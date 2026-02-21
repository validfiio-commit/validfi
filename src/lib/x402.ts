import axios from "axios";
import { withPaymentInterceptor } from "x402-axios";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

let apiClient: ReturnType<typeof axios.create> | null = null;

function getClient() {
  if (apiClient) return apiClient;

  const pk = process.env.VALIDFI_WALLET_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk || pk === "0x..." || pk.length < 60) {
    console.warn("VALIDFI_WALLET_PRIVATE_KEY not set or invalid — x402 features disabled");
    return null;
  }

  const account = privateKeyToAccount(pk);

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http("https://mainnet.base.org"),
  });

  console.log("SIGNER ADDRESS:", walletClient.account?.address);

  const axiosInstance = axios.create({
    baseURL: "https://x402-api.heyelsa.ai",
    timeout: 30000,
  });

  // Critical: cast argument (library viem types lag your viem types)
  apiClient = withPaymentInterceptor(axiosInstance, walletClient as any) as any;
  return apiClient;
}

export interface WalletIntelligence {
  totalValueUsd: string;
  chains: string[];
  topTokens: { symbol: string; balanceUsd: string; chain: string }[];
  defiPositions: number;
  stakingPositions: { protocol: string; token: string; amount: string; apy: string }[];
  totalStakedUsd: string;
  walletAge: string;
  riskScore: string;
  txCount: number;
  activeChains: number;
  pnl30d: string;
  fetchedAt: string;
}

function axiosErr(e: any) {
  return {
    message: e?.message ? String(e.message) : String(e),
    httpStatus: e?.response?.status,
    data: e?.response?.data,
  };
}

export async function fetchWalletIntelligence(walletAddress: string): Promise<WalletIntelligence | null> {
  const c = getClient();
  if (!c) return null;

  try {
    const [portfolioRes, balancesRes, analysisRes, stakingRes, pnlRes] = await Promise.allSettled([
      c.post("/api/get_portfolio", { wallet_address: walletAddress }),
      c.post("/api/get_balances", { wallet_address: walletAddress }),
      c.post("/api/analyze_wallet", { wallet_address: walletAddress }),
      c.post("/api/get_stake_balances", { wallet_address: walletAddress }),
      c.post("/api/get_pnl_report", { wallet_address: walletAddress, time_period: "30_days" }),
    ]);

    console.log(
      "ELSA RAW:",
      JSON.stringify(
        {
          portfolio:
            portfolioRes.status === "fulfilled"
              ? portfolioRes.value.data
              : { result: "rejected", ...axiosErr(portfolioRes.reason) },

          balances:
            balancesRes.status === "fulfilled"
              ? balancesRes.value.data
              : { result: "rejected", ...axiosErr(balancesRes.reason) },

          analysis:
            analysisRes.status === "fulfilled"
              ? analysisRes.value.data
              : { result: "rejected", ...axiosErr(analysisRes.reason) },

          staking:
            stakingRes.status === "fulfilled"
              ? stakingRes.value.data
              : { result: "rejected", ...axiosErr(stakingRes.reason) },

          pnl:
            pnlRes.status === "fulfilled"
              ? pnlRes.value.data
              : { result: "rejected", ...axiosErr(pnlRes.reason) },
        },
        null,
        2
      )
    );

    const portfolio = portfolioRes.status === "fulfilled" ? portfolioRes.value.data : null;
    const balances = balancesRes.status === "fulfilled" ? balancesRes.value.data : null;
    const analysis = analysisRes.status === "fulfilled" ? analysisRes.value.data : null;
    const staking = stakingRes.status === "fulfilled" ? stakingRes.value.data : null;
    const pnl = pnlRes.status === "fulfilled" ? pnlRes.value.data : null;

    const tokens = (balances?.balances || [])
      .filter((b: any) => parseFloat(b.balance_usd || "0") > 0)
      .sort((a: any, b: any) => parseFloat(b.balance_usd) - parseFloat(a.balance_usd))
      .slice(0, 5)
      .map((b: any) => ({ symbol: b.asset, balanceUsd: b.balance_usd, chain: b.chain }));

    const stakes = (staking?.stakes || []).map((s: any) => ({
      protocol: s.protocol,
      token: s.token,
      amount: s.staked_amount,
      apy: s.apy,
    }));

    return {
      totalValueUsd: portfolio?.total_value_usd || "0",
      chains: portfolio?.chains || [],
      topTokens: tokens,
      defiPositions: portfolio?.portfolio?.defi_positions?.length || 0,
      stakingPositions: stakes,
      totalStakedUsd: staking?.total_staked_usd || "0",
      walletAge: analysis?.wallet_age || "Unknown",
      riskScore: analysis?.risk_score || "Unknown",
      txCount: analysis?.transaction_count || 0,
      activeChains: (portfolio?.chains || []).length,
      pnl30d: pnl?.total_pnl || "0",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("x402 fetch error:", err?.message || err);
    return null;
  }
}

export function isStale(fetchedAt: Date | null): boolean {
  if (!fetchedAt) return true;
  const hoursSince = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
  return hoursSince > 6;
}

// ─── Direct Elsa x402 Queries (return formatted responses) ──────────

export async function elsaGetPortfolio(walletAddress: string): Promise<string> {
  const c = getClient();
  if (!c) return "⚠️ Elsa x402 is not configured yet. Add VALIDFI_WALLET_PRIVATE_KEY to enable live on-chain data.";

  try {
    const [portfolioRes, balancesRes, stakingRes, pnlRes] = await Promise.allSettled([
      c.post("/api/get_portfolio", { wallet_address: walletAddress }),
      c.post("/api/get_balances", { wallet_address: walletAddress }),
      c.post("/api/get_stake_balances", { wallet_address: walletAddress }),
      c.post("/api/get_pnl_report", { wallet_address: walletAddress, time_period: "30_days" }),
    ]);

    const portfolio = portfolioRes.status === "fulfilled" ? portfolioRes.value.data : null;
    const balances = balancesRes.status === "fulfilled" ? balancesRes.value.data : null;
    const staking = stakingRes.status === "fulfilled" ? stakingRes.value.data : null;
    const pnl = pnlRes.status === "fulfilled" ? pnlRes.value.data : null;

    const tokens = (balances?.balances || [])
      .filter((b: any) => parseFloat(b.balance_usd || "0") > 0)
      .sort((a: any, b: any) => parseFloat(b.balance_usd) - parseFloat(a.balance_usd))
      .slice(0, 8);

    const stakes = (staking?.stakes || []).slice(0, 5);

    let resp = `**Your On-Chain Portfolio** ⚡ *Live via Elsa x402*\n\n`;
    resp += `**Wallet:** \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\`\n`;
    resp += `**Total Value:** $${formatUsd(portfolio?.total_value_usd || "0")}\n`;
    resp += `**30-Day P&L:** ${parseFloat(pnl?.total_pnl || "0") >= 0 ? "+" : ""}$${formatUsd(pnl?.total_pnl || "0")}\n`;
    resp += `**Active Chains:** ${(portfolio?.chains || []).join(", ") || "None detected"}\n`;

    if (tokens.length > 0) {
      resp += `\n**Holdings:**\n`;
      tokens.forEach((t: any) => {
        resp += `- **${t.asset}** — $${formatUsd(t.balance_usd)} (${t.chain})\n`;
      });
    }

    if (stakes.length > 0) {
      resp += `\n**Staking Positions:**\n`;
      stakes.forEach((s: any) => {
        resp += `- **${s.protocol}** — ${s.staked_amount} ${s.token} (${s.apy}% APY)\n`;
      });
      resp += `**Total Staked:** $${formatUsd(staking?.total_staked_usd || "0")}\n`;
    }

    const defiCount = portfolio?.portfolio?.defi_positions?.length || 0;
    if (defiCount > 0) {
      resp += `\n**DeFi Positions:** ${defiCount} active\n`;
    }

    return resp;
  } catch (err: any) {
    const e = axiosErr(err);
    return `⚠️ Couldn't fetch portfolio data: ${e.message}${e.httpStatus ? ` (HTTP ${e.httpStatus})` : ""}`;
  }
}

export async function elsaGetTokenPrice(query: string): Promise<string> {
  const c = getClient();
  if (!c) return "⚠️ Elsa x402 not configured.";

  try {
    const res = await c.post("/api/search_token", { symbol_or_address: query, limit: 3 });
    const results = res.data?.result?.results || res.data?.results || [];
    if (results.length === 0) return `No token found for "${query}".`;

    let resp = `**Token Prices** ⚡ *Live via Elsa x402*\n\n`;
    results.forEach((t: any) => {
      resp += `- **${t.symbol}** (${t.name}) — **$${t.priceUSD || t.price || "N/A"}** [${t.chain || "Multi"}]\n`;
    });
    return resp;
  } catch (err: any) {
    const e = axiosErr(err);
    return `⚠️ Token search failed: ${e.message}${e.httpStatus ? ` (HTTP ${e.httpStatus})` : ""}`;
  }
}

export async function elsaGetYields(walletAddress: string): Promise<string> {
  const c = getClient();
  if (!c) return "⚠️ Elsa x402 not configured.";

  try {
    const res = await c.post("/api/get_yield_suggestions", { wallet_address: walletAddress });
    const suggestions = res.data?.suggestions || [];
    if (suggestions.length === 0) return "No yield opportunities found right now.";

    let resp = `**Top Yield Opportunities** ⚡ *Live via Elsa x402*\n\n`;
    suggestions.slice(0, 6).forEach((s: any) => {
      resp += `- **${s.protocol}** — ${s.apy}% APY on **${s.token}** [${s.chain}]\n`;
    });
    return resp;
  } catch (err: any) {
    const e = axiosErr(err);
    return `⚠️ Yield data unavailable: ${e.message}${e.httpStatus ? ` (HTTP ${e.httpStatus})` : ""}`;
  }
}

export async function elsaGetGas(chain: string): Promise<string> {
  const c = getClient();
  if (!c) return "⚠️ Elsa x402 not configured.";

  const chainMap: Record<string, string> = {
    ethereum: "ethereum",
    base: "base",
    arbitrum: "arbitrum",
    polygon: "polygon",
    optimism: "optimism",
    avalanche: "avalanche",
  };
  const normalized = chainMap[chain.toLowerCase()] || "base";

  try {
    const res = await c.post("/api/get_gas_prices", { chain: normalized });
    return `**Gas Price on ${normalized}:** ${res.data?.gas_price || "N/A"} gwei ⚡ *Live via Elsa x402*`;
  } catch (err: any) {
    const e = axiosErr(err);
    return `⚠️ Gas data unavailable: ${e.message}${e.httpStatus ? ` (HTTP ${e.httpStatus})` : ""}`;
  }
}

export async function elsaAnalyzeWallet(walletAddress: string): Promise<string> {
  const c = getClient();
  if (!c) return "⚠️ Elsa x402 not configured.";

  try {
    const res = await c.post("/api/analyze_wallet", { wallet_address: walletAddress });
    const a = res.data;

    let resp = `**Wallet Analysis** ⚡ *Live via Elsa x402*\n\n`;
    resp += `**Address:** \`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\`\n`;
    resp += `**Wallet Age:** ${a?.wallet_age || "Unknown"}\n`;
    resp += `**Transaction Count:** ${a?.transaction_count || 0}\n`;
    resp += `**Risk Score:** ${a?.risk_score || "Unknown"}\n`;
    if (a?.labels?.length) resp += `**Labels:** ${a.labels.join(", ")}\n`;
    if (a?.summary) resp += `\n${a.summary}\n`;
    return resp;
  } catch (err: any) {
    const e = axiosErr(err);
    return `⚠️ Wallet analysis failed: ${e.message}${e.httpStatus ? ` (HTTP ${e.httpStatus})` : ""}`;
  }
}

function formatUsd(v: string): string {
  const n = parseFloat(v || "0");
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
}

// ─── Intent Detection ───────────────────────────────────────────────

export type QueryIntent = "portfolio" | "price" | "yield" | "gas" | "analyze_wallet" | "advisor";

export function detectIntent(message: string): QueryIntent {
  const m = message.toLowerCase();

  if (/\b(portfolio|holdings?|balance|my tokens|my assets|my wallet|fetch.*portfolio|show.*portfolio|what do i (have|hold|own))\b/.test(m)) {
    return "portfolio";
  }
  if (/\b(price|how much is|what('s| is) .{1,20} (worth|trading|at)|token price|current price|market price)\b/.test(m)) {
    return "price";
  }
  if (/\b(yield|apy|apr|staking rewards|best (yield|return|apy)|where.*(stake|earn|farm)|farming)\b/.test(m)) {
    return "yield";
  }
  if (/\b(gas price|gas fee|gas cost|how much.*gas|gwei)\b/.test(m)) {
    return "gas";
  }
  if (/\b(analyze.*wallet|wallet.*analy|on-?chain.*profile|my.*activity|transaction.*history|wallet.*score)\b/.test(m)) {
    return "analyze_wallet";
  }
  return "advisor";
}

export function extractTokenFromMessage(message: string): string {
  const m = message.toLowerCase();
  const patterns = [
    /price (?:of |for )?(\w+)/i,
    /how much is (\w+)/i,
    /what(?:'s| is) (\w+) (?:worth|trading|at|price)/i,
    /(\w+) price/i,
    /(\w+) token/i,
  ];

  for (const p of patterns) {
    const match = message.match(p);
    if (match) return match[1].toUpperCase();
  }

  const known = [
    "ETH",
    "BTC",
    "SOL",
    "USDC",
    "USDT",
    "ARB",
    "OP",
    "MATIC",
    "AVAX",
    "BNB",
    "UNI",
    "AAVE",
    "LINK",
    "PENDLE",
    "LDO",
    "CRV",
    "MKR",
    "SNX",
    "COMP",
    "DYDX",
    "GMX",
    "JUP",
    "JTO",
    "SUI",
    "APT",
    "BASE",
  ];
  for (const t of known) {
    if (m.includes(t.toLowerCase())) return t;
  }
  return "ETH";
}

export function extractChainFromMessage(message: string, defaultChain: string | null): string {
  const m = message.toLowerCase();
  const chains = ["ethereum", "base", "arbitrum", "polygon", "optimism", "avalanche", "solana", "bnb"];
  for (const c of chains) {
    if (m.includes(c)) return c;
  }
  return defaultChain?.toLowerCase() || "base";
}

// ─── Live Market Context for Gemini ────

export interface LiveMarketContext {
  tokens: { symbol: string; name: string; price: string; chain: string }[];
  yieldOpportunities: { protocol: string; token: string; apy: string; chain: string }[];
  gasPrices: { chain: string; price: string }[];
  fetchedAt: string;
}

export async function fetchLiveMarketContext(
  chain: string | null,
  competitors: string | null,
  walletAddress: string
): Promise<LiveMarketContext | null> {
  const c = getClient();
  if (!c) return null;

  try {
    const tokenSearches: string[] = [];
    const chainTokenMap: Record<string, string[]> = {
      Ethereum: ["ETH", "USDC"],
      Solana: ["SOL", "USDC"],
      Base: ["ETH", "USDC"],
      Arbitrum: ["ETH", "ARB"],
      Polygon: ["MATIC", "USDC"],
      Optimism: ["ETH", "OP"],
      Avalanche: ["AVAX", "USDC"],
      "BNB Chain": ["BNB", "USDC"],
      Sui: ["SUI"],
      Aptos: ["APT"],
    };

    if (chain && chainTokenMap[chain]) tokenSearches.push(...chainTokenMap[chain]);

    if (competitors) {
      const known = ["Uniswap", "Aave", "Lido", "Curve", "Compound", "MakerDAO", "Chainlink", "Pendle", "EigenLayer", "Jupiter", "Raydium", "Jito"];
      known.forEach((k) => {
        if (competitors.toLowerCase().includes(k.toLowerCase())) tokenSearches.push(k);
      });
    }

    const requests: Promise<any>[] = [];
    const uniqueTokens = Array.from(new Set(tokenSearches)).slice(0, 4);

    uniqueTokens.forEach((symbol) => {
      requests.push(
        c
          .post("/api/search_token", { symbol_or_address: symbol, limit: 1 })
          .then((r: any) => ({ type: "token", data: r.data }))
          .catch(() => null)
      );
    });

    requests.push(
      c
        .post("/api/get_yield_suggestions", { wallet_address: walletAddress })
        .then((r: any) => ({ type: "yield", data: r.data }))
        .catch(() => null)
    );

    const gasChain =
      chain?.toLowerCase().includes("ethereum") ? "ethereum" : chain?.toLowerCase().includes("base") ? "base" : chain?.toLowerCase().includes("arbitrum") ? "arbitrum" : "base";

    requests.push(
      c
        .post("/api/get_gas_prices", { chain: gasChain })
        .then((r: any) => ({ type: "gas", data: r.data, chain: gasChain }))
        .catch(() => null)
    );

    const results = await Promise.all(requests);

    const tokens: LiveMarketContext["tokens"] = [];
    let yieldOpportunities: LiveMarketContext["yieldOpportunities"] = [];
    const gasPrices: LiveMarketContext["gasPrices"] = [];

    for (const r of results) {
      if (!r) continue;

      if (r.type === "token" && r.data?.result?.results?.[0]) {
        const t = r.data.result.results[0];
        tokens.push({ symbol: t.symbol, name: t.name, price: t.priceUSD || "N/A", chain: t.chain });
      }

      if (r.type === "yield" && r.data?.suggestions) {
        yieldOpportunities = r.data.suggestions.slice(0, 5).map((s: any) => ({
          protocol: s.protocol,
          token: s.token,
          apy: s.apy,
          chain: s.chain,
        }));
      }

      if (r.type === "gas") {
        gasPrices.push({ chain: r.chain, price: r.data?.gas_price || "N/A" });
      }
    }

    return { tokens, yieldOpportunities, gasPrices, fetchedAt: new Date().toISOString() };
  } catch (err: any) {
    console.error("x402 market context error:", err?.message || err);
    return null;
  }
}