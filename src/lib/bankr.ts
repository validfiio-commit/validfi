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

// ─── API: Submit Prompt ──────────────────────────────────────

/**
 * POST /agent/prompt — Submit a prompt, returns jobId immediately (~1s)
 */
export async function bankrSubmitPrompt(prompt: string): Promise<{
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

// ─── API: Check Job Status ───────────────────────────────────

/**
 * GET /agent/job/{jobId} — Check status, returns immediately (~200ms)
 */
export async function bankrCheckJob(jobId: string): Promise<{
  status: "processing" | "completed" | "failed";
  response?: string;
  error?: string;
}> {
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
    const text = data.response
      || data.result?.text
      || data.result?.message
      || data.result?.response
      || data.text
      || data.message
      || (typeof data.result === "string" ? data.result : null)
      || JSON.stringify(data);
    return {
      status: "completed",
      response: typeof text === "string" ? text : JSON.stringify(text),
    };
  }

  if (status === "failed" || status === "error" || status === "cancelled") {
    return {
      status: "failed",
      error: data.error || data.result?.error || data.response || "Bankr job failed",
    };
  }

  return { status: "processing" };
}

// ─── Parse Response ──────────────────────────────────────────

export function parseBankrResponse(text: string): BankrLaunchResult {
  // Check for rate limit or simulation-only response
  if (text.match(/rate.?limit/i) || text.match(/simulation complete.*not broadcast/i) || text.match(/simulated deployment/i)) {
    return { success: false, error: "Rate limited — Bankr allows 1 token launch per day. Try again tomorrow." };
  }

  const addrMatch = text.match(/contract address[^\n]*?(0x[a-fA-F0-9]{40})/i)
    || text.match(/deployed[^\n]*?(0x[a-fA-F0-9]{40})/i)
    || text.match(/(0x[a-fA-F0-9]{40})/);
  const tokenAddress = addrMatch?.[1];

  const viewMatch = text.match(/view token:\s*(https?:\/\/[^\s]+)/i)
    || text.match(/(https?:\/\/(?:www\.)?bankr\.bot\/launches\/[^\s]+)/i);
  const viewUrl = viewMatch?.[1];

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

// ─── Database Operations ─────────────────────────────────────

/**
 * Create a DEPLOYING launch record with the Bankr jobId
 */
export async function createLaunchRecord(params: {
  ideaId: string;
  tokenName: string;
  tokenSymbol: string;
  jobId: string;
}) {
  return prisma.launch.create({
    data: {
      ideaId: params.ideaId,
      tokenName: params.tokenName,
      tokenSymbol: params.tokenSymbol.toUpperCase(),
      status: "DEPLOYING",
      launchData: { jobId: params.jobId } as any,
    },
  });
}

/**
 * Finalize a launch record after Bankr job completes
 */
export async function finalizeLaunch(launchId: string, result: BankrLaunchResult) {
  if (!result.success) {
    return prisma.launch.update({
      where: { id: launchId },
      data: {
        status: "FAILED",
        error: result.error || "Launch failed",
      },
    });
  }

  return prisma.launch.update({
    where: { id: launchId },
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
