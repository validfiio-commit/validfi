import { prisma } from "./prisma";

const BANKR_API_URL = "https://api.bankr.bot";
const BANKR_API_KEY = process.env.BANKR_API_KEY!;

// ─── Types ───────────────────────────────────────────────────

export interface BankrLaunchResult {
  success: boolean;
  tokenAddress?: string;
  chain?: string;
  viewUrl?: string;
  txUrl?: string;
  jobId?: string;
  error?: string;
}

// ─── API Helpers ─────────────────────────────────────────────

/**
 * POST /agent/prompt — Submit a prompt to the Bankr AI agent
 * Returns a jobId to poll for completion
 */
async function bankrPrompt(prompt: string): Promise<{
  jobId: string;
  threadId?: string;
}> {
  const res = await fetch(`${BANKR_API_URL}/agent/prompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": BANKR_API_KEY,
    },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bankr API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    jobId: data.jobId || data.job_id || data.id,
    threadId: data.threadId || data.thread_id,
  };
}

/**
 * GET /agent/job/{jobId} — Poll job status until completed
 */
async function bankrPollJob(jobId: string, maxWaitMs = 120_000): Promise<string> {
  const start = Date.now();
  const pollInterval = 3000;

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${BANKR_API_URL}/agent/job/${jobId}`, {
      headers: {
        "X-API-Key": BANKR_API_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`Bankr status check failed: ${res.status}`);
    }

    const data = await res.json();
    const status = data.status?.toLowerCase();

    if (status === "completed" || status === "done" || status === "success") {
      // Extract text response — try multiple possible fields
      const text = data.response
        || data.result?.text
        || data.result?.message
        || data.result?.response
        || data.text
        || data.message
        || (typeof data.result === "string" ? data.result : null)
        || JSON.stringify(data);
      return typeof text === "string" ? text : JSON.stringify(text);
    }

    if (status === "failed" || status === "error" || status === "cancelled") {
      throw new Error(data.error || data.result?.error || data.response || "Bankr job failed");
    }

    // Still processing — wait and retry
    await new Promise((r) => setTimeout(r, pollInterval));
  }

  throw new Error("Bankr launch timed out after 2 minutes");
}

// ─── Parse Response ──────────────────────────────────────────

function parseBankrResponse(text: string): BankrLaunchResult {
  // Extract contract address
  const addrMatch = text.match(/contract address[^\n]*?(0x[a-fA-F0-9]{40})/i)
    || text.match(/deployed[^\n]*?(0x[a-fA-F0-9]{40})/i)
    || text.match(/(0x[a-fA-F0-9]{40})/);
  const tokenAddress = addrMatch?.[1];

  // Extract view URL
  const viewMatch = text.match(/view token:\s*(https?:\/\/[^\s]+)/i)
    || text.match(/(https?:\/\/(?:www\.)?bankr\.bot\/launches\/[^\s]+)/i);
  const viewUrl = viewMatch?.[1];

  // Extract tx URL
  const txMatch = text.match(/tx:\s*(https?:\/\/[^\s]+)/i)
    || text.match(/(https?:\/\/basescan\.org\/tx\/[^\s]+)/i);
  const txUrl = txMatch?.[1];

  if (!tokenAddress) {
    return { success: false, error: text.slice(0, 300) };
  }

  return {
    success: true,
    tokenAddress,
    chain: "base",
    viewUrl: viewUrl || `https://bankr.bot/launches/${tokenAddress}`,
    txUrl,
  };
}

// ─── Launch Token ────────────────────────────────────────────

/**
 * Launch a token on Base via Bankr REST API.
 *
 * Flow: POST /agent/prompt → poll GET /agent/job/{jobId} → parse result
 */
export async function launchToken(params: {
  name: string;
  symbol: string;
  website?: string;
  image?: string;
}): Promise<BankrLaunchResult> {
  let prompt = `launch a token called ${params.name} with symbol ${params.symbol} on Base`;

  if (params.website) {
    prompt += ` with website ${params.website}`;
  }
  if (params.image) {
    prompt += ` with image ${params.image}`;
  }

  // Step 1: Submit prompt
  const { jobId } = await bankrPrompt(prompt);

  // Step 2: Poll for completion
  const responseText = await bankrPollJob(jobId);

  // Step 3: Parse result
  const result = parseBankrResponse(responseText);
  result.jobId = jobId;

  return result;
}

// ─── Database Operations ─────────────────────────────────────

export async function createAndExecuteLaunch(params: {
  ideaId: string;
  tokenName: string;
  tokenSymbol: string;
  scoreCardUrl?: string;
  imageUrl?: string;
  tweetUrl?: string;
  feeRecipient?: string;
}) {
  const launch = await prisma.launch.create({
    data: {
      ideaId: params.ideaId,
      tokenName: params.tokenName,
      tokenSymbol: params.tokenSymbol.toUpperCase(),
      status: "DEPLOYING",
    },
  });

  try {
    const result = await launchToken({
      name: params.tokenName,
      symbol: params.tokenSymbol,
      website: params.scoreCardUrl,
      image: params.imageUrl,
    });

    if (!result.success) {
      throw new Error(result.error || "Launch failed");
    }

    const updated = await prisma.launch.update({
      where: { id: launch.id },
      data: {
        tokenAddress: result.tokenAddress,
        explorerUrl: result.txUrl || (result.tokenAddress
          ? `https://basescan.org/token/${result.tokenAddress}`
          : null),
        uniswapUrl: result.tokenAddress
          ? `https://app.uniswap.org/explore/tokens/base/${result.tokenAddress}`
          : null,
        bankrUrl: result.viewUrl || (result.tokenAddress
          ? `https://bankr.bot/launches/${result.tokenAddress}`
          : null),
        status: "LIVE",
        launchData: result as any,
      },
    });

    return updated;
  } catch (err: any) {
    await prisma.launch.update({
      where: { id: launch.id },
      data: {
        status: "FAILED",
        error: err.message || "Launch failed",
      },
    });
    throw err;
  }
}

// ─── Trade Commands ──────────────────────────────────────────

export function getTradeCommands(tokenAddress: string, amount = "50") {
  return {
    buyOnX: `@bankrbot buy $${amount} of ${tokenAddress}`,
    buyOnFarcaster: `/bankr buy $${amount} of ${tokenAddress}`,
    priceCheck: `@bankrbot price ${tokenAddress}`,
    bankrUrl: `https://bankr.bot/launches/${tokenAddress}`,
    uniswapUrl: `https://app.uniswap.org/explore/tokens/base/${tokenAddress}`,
    basescanUrl: `https://basescan.org/token/${tokenAddress}`,
  };
}

// ─── Helpers ─────────────────────────────────────────────────

export function generateSymbol(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 5).toUpperCase();
}
