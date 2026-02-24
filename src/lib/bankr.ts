import { execSync } from "child_process";
import { prisma } from "./prisma";

// ─── Types ───────────────────────────────────────────────────

export interface BankrLaunchResult {
  success: boolean;
  tokenAddress?: string;
  poolId?: string;
  chain?: string;
  viewUrl?: string;
  txUrl?: string;
  feeDistribution?: {
    creator?: string;
    bankr?: string;
    protocol?: string;
    ecosystem?: string;
  };
  raw?: string;
  error?: string;
}

// ─── CLI Wrapper ─────────────────────────────────────────────

function runBankr(args: string[], timeoutMs = 180_000): string {
  const cmd = `bankr ${args.join(" ")}`;
  try {
    const raw = execSync(cmd, {
      encoding: "utf-8",
      timeout: timeoutMs,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    return raw;
  } catch (err: any) {
    const output = (err.stdout || "") + (err.stderr || "");
    throw new Error(output.trim().split("\n").pop() || "bankr command failed");
  }
}

// ─── Parse Prompt Output ─────────────────────────────────────

function parsePromptOutput(output: string): BankrLaunchResult {
  const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract contract address: "contract address is 0x..."
  const addrMatch = output.match(/contract address[^\n]*?(0x[a-fA-F0-9]{40})/i);
  const tokenAddress = addrMatch?.[1];

  // Extract view URL: "view token: https://..."
  const viewMatch = output.match(/view token:\s*(https?:\/\/[^\s]+)/i);
  const viewUrl = viewMatch?.[1];

  // Extract tx URL: "tx: https://..."
  const txMatch = output.match(/tx:\s*(https?:\/\/[^\s]+)/i);
  const txUrl = txMatch?.[1];

  if (!tokenAddress) {
    // Check for errors
    const errorLine = lines.find(
      (l) => l.includes("✗") || l.includes("Error") || l.includes("error") || l.includes("failed")
    );
    return { success: false, error: errorLine || output.slice(-300) };
  }

  return {
    success: true,
    tokenAddress,
    chain: "base",
    viewUrl: viewUrl || `https://bankr.bot/launches/${tokenAddress}`,
    txUrl,
  };
}

// ─── Launch Token via bankr prompt ───────────────────────────

/**
 * Launch a token on Base via `bankr prompt`.
 *
 * Uses natural language to deploy — avoids all interactive CLI prompts.
 * The Bankr AI agent handles token creation, Uniswap pool, and listing.
 *
 * Results:
 * - ERC-20 token deployed on Base
 * - Uniswap V4 pool created automatically
 * - Creator earns ~57% of swap fees
 * - Token instantly tradeable
 * - Listed on bankr.bot/launches
 */
export async function launchToken(params: {
  name: string;
  symbol: string;
  website?: string;
  image?: string;
  tweet?: string;
  fee?: string;
}): Promise<BankrLaunchResult> {
  // Build natural language prompt
  let prompt = `launch a token called ${params.name} with symbol ${params.symbol} on Base`;

  if (params.website) {
    prompt += ` with website ${params.website}`;
  }
  if (params.image) {
    prompt += ` with image ${params.image}`;
  }
  if (params.fee) {
    prompt += ` with fee recipient ${params.fee}`;
  }

  const output = runBankr(["prompt", `"${sanitize(prompt)}"`], 120_000);
  return parsePromptOutput(output);
}

// ─── Database Operations ─────────────────────────────────────

/**
 * Create a launch record and execute bankr launch.
 * Updates the record with results (success or failure).
 */
export async function createAndExecuteLaunch(params: {
  ideaId: string;
  tokenName: string;
  tokenSymbol: string;
  scoreCardUrl?: string;
  imageUrl?: string;
  tweetUrl?: string;
  feeRecipient?: string;
}) {
  // Create pending launch record
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
      tweet: params.tweetUrl,
      fee: params.feeRecipient,
    });

    if (!result.success) {
      throw new Error(result.error || "Launch failed");
    }

    // Update with success
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
        poolId: result.poolId,
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

/**
 * Generate Bankr trade commands for a token.
 */
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

function sanitize(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ").trim().slice(0, 200);
}

export function generateSymbol(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 5).toUpperCase();
}
