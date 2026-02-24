import { execSync } from "child_process";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// ─── Types ───────────────────────────────────────────────────
export interface MoltlaunchResult {
  success: boolean;
  agentId?: string;
  tokenAddress?: string;
  transactionHash?: string;
  name?: string;
  symbol?: string;
  network?: string;
  explorer?: string;
  wallet?: string;
  [key: string]: any;
}

// ─── CLI Wrapper ─────────────────────────────────────────────

function runMltl(args: string[], timeoutMs = 180_000): any {
  const cmd = `npx mltl ${args.join(" ")}`;
  try {
    const raw = execSync(cmd, {
      encoding: "utf-8",
      timeout: timeoutMs,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });

    const trimmed = raw.trim();
    try {
      const result = JSON.parse(trimmed);
      if (result.error && !result.tokenAddress && !result.agentId) {
        throw new Error(result.error);
      }
      return { success: true, ...result };
    } catch (e) {
      if (e instanceof SyntaxError) {
        return { success: true, raw: trimmed };
      }
      throw e;
    }
  } catch (err: any) {
    if (err.stdout) {
      const trimmed = err.stdout.trim();
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.tokenAddress || parsed.agentId) {
          return { success: true, ...parsed };
        }
        if (parsed.error) throw new Error(parsed.error);
        return parsed;
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== trimmed) {
          throw parseErr;
        }
      }
    }
    if (err.stderr) {
      throw new Error(err.stderr.trim().split("\n")[0] || "mltl command failed");
    }
    throw new Error(err.message || "mltl command failed");
  }
}

// ─── Register Agent on Moltlaunch (for ValidFi hireable agent) ──

/**
 * Register a project as an agent on Moltlaunch Mandate protocol.
 * Used for ValidFi agent identity — NOT for user token launches (Bankr handles those).
 */
export async function registerAndLaunch(params: {
  name: string;
  symbol: string;
  description: string;
  skills: string;
  website?: string;
  image?: string;
  price?: string;
}): Promise<MoltlaunchResult> {
  const args = [
    "register",
    "--name", `"${sanitize(params.name)}"`,
    "--symbol", params.symbol.toUpperCase(),
    "--description", `"${sanitize(params.description)}"`,
    "--skills", `"${sanitize(params.skills)}"`,
  ];

  if (params.website) {
    args.push("--website", `"${params.website}"`);
  }

  const imagePath = params.image || generateDefaultLogo(params.name, params.symbol);
  args.push("--image", imagePath);

  if (params.price) {
    args.push("--price", params.price);
  }

  args.push("--json");

  const result = runMltl(args);

  return {
    success: true,
    agentId: result.agentId || result.id,
    tokenAddress: result.tokenAddress || result.token,
    transactionHash: result.transactionHash || result.tokenTxHash || result.txHash || result.tx,
    name: result.name || params.name,
    symbol: result.symbol || params.symbol,
    network: result.network || "Base",
    explorer: result.explorer || (result.tokenAddress
      ? `https://basescan.org/token/${result.tokenAddress}`
      : undefined),
    wallet: result.wallet,
    ...result,
  };
}

// ─── Get Agent Profile ───────────────────────────────────────

export async function getAgentProfile(agentId: string): Promise<any> {
  try {
    return runMltl(["profile", "--agent", agentId, "--json"]);
  } catch {
    return null;
  }
}

// ─── Get Fees ────────────────────────────────────────────────

export async function getFees(): Promise<any> {
  try {
    return runMltl(["fees", "--json"]);
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function sanitize(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ").trim().slice(0, 500);
}

export function generateSymbol(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 5).toUpperCase();
}

function generateDefaultLogo(name: string, symbol: string): string {
  const tmpDir = join(process.cwd(), ".moltlaunch-tmp");
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const filePath = join(tmpDir, `${symbol.toLowerCase()}-logo.png`);

  const zlib = require("zlib");
  const width = 64;
  const height = 64;

  const colors = [
    [0, 240, 255],
    [168, 85, 247],
    [52, 211, 153],
    [251, 191, 36],
  ];
  const [r, g, b] = colors[name.length % colors.length];

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrBody = Buffer.alloc(13);
  ihdrBody.writeUInt32BE(width, 0);
  ihdrBody.writeUInt32BE(height, 4);
  ihdrBody[8] = 8;
  ihdrBody[9] = 2;
  const ihdr = pngChunk("IHDR", ihdrBody);
  const idat = pngChunk("IDAT", compressed);
  const iend = pngChunk("IEND", Buffer.alloc(0));

  const png = Buffer.concat([sig, ihdr, idat, iend]);
  writeFileSync(filePath, png);

  return filePath;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const body = Buffer.concat([t, data]);

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < body.length; i++) {
    crc ^= body[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  crc = (crc ^ 0xFFFFFFFF) >>> 0;

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, t, data, crcBuf]);
}

export function buildSkills(category: string, chain?: string): string {
  const skills: string[] = [];
  if (category) skills.push(category.toLowerCase().replace(/\s+/g, "-"));

  const map: Record<string, string[]> = {
    "DeFi": ["defi", "smart-contracts", "tokenomics"],
    "NFT": ["nft", "digital-art", "marketplace"],
    "Gaming": ["gamefi", "gaming", "play-to-earn"],
    "DAO": ["dao", "governance", "treasury"],
    "Infrastructure": ["infra", "protocol", "tooling"],
    "Social": ["social", "community", "messaging"],
    "AI": ["ai", "machine-learning", "automation"],
  };

  skills.push(...(map[category] || []));
  if (chain) skills.push(chain.toLowerCase());

  return [...new Set(skills)].slice(0, 8).join(",");
}
