"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWalletCompat as useWallet } from "@/hooks/use-wallet-compat";
import { BankrTradeInline } from "@/components/bankr-trade";
import type { Idea } from "@/types";

interface WalletData {
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

interface LaunchData {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string | null;
  explorerUrl: string | null;
  uniswapUrl: string | null;
  bankrUrl: string | null;
  poolId: string | null;
  status: "PENDING" | "DEPLOYING" | "LIVE" | "FAILED";
  error: string | null;
}

// ─── Launch Modal (Bankr) ────────────────────────────────────

interface LaunchModalProps {
  idea: Idea;
  onClose: () => void;
  onSuccess: (ideaId: string, launch: LaunchData) => void;
}

function LaunchModal({ idea, onClose, onSuccess }: LaunchModalProps) {
  const report = idea.report as any;
  const defaultSymbol = genSymbol(idea.name);

  const [tokenName, setTokenName] = useState(idea.name);
  const [tokenSymbol, setTokenSymbol] = useState(defaultSymbol);
  const [imageUrl, setImageUrl] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [feeRecipient, setFeeRecipient] = useState("");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"confirm" | "deploying" | "success" | "error">("confirm");
  const [launchResult, setLaunchResult] = useState<LaunchData | null>(null);

  const handleLaunch = async () => {
    setLaunching(true);
    setError("");
    setStep("deploying");

    try {
      // Step 1: Submit to Bankr (returns immediately with jobId)
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, tokenName, tokenSymbol: tokenSymbol.toUpperCase(), imageUrl: imageUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Launch failed");

      const { jobId, id: launchId } = data.launch;

      // Step 2: Poll status from frontend every 3s (avoids serverless timeout)
      const maxPolls = 60; // 3 minutes max
      for (let i = 0; i < maxPolls; i++) {
        await new Promise((r) => setTimeout(r, 3000));

        const pollRes = await fetch(`/api/launch/status?jobId=${jobId}&launchId=${launchId}`);
        const pollData = await pollRes.json();

        if (pollData.status === "completed") {
          setLaunchResult(pollData.launch);
          setStep("success");
          onSuccess(idea.id, pollData.launch);
          return;
        }

        if (pollData.status === "failed") {
          throw new Error(pollData.error || "Launch failed");
        }

        // "processing" — continue polling
      }

      throw new Error("Launch timed out. Check your dashboard for status.");
    } catch (err: any) {
      setError(err.message || "Launch failed. Please try again.");
      setStep("error");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0c0c12] border border-[rgba(255,255,255,0.08)] overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-7 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,200,83,0.1)] border border-[rgba(0,200,83,0.2)] flex items-center justify-center text-sm">🏦</div>
            <div>
              <h3 className="text-base font-bold">Launch on Bankr</h3>
              <p className="text-[10px] font-mono text-[#5a5652] tracking-wider">BASE · UNISWAP V4 · 57% CREATOR FEES</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5a5652] hover:text-[#e8e4dd] transition-colors text-lg">✕</button>
        </div>

        <div className="px-7 py-5 overflow-y-auto flex-1">
          {step === "confirm" && (
            <>
              {/* Score badge */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.1)]">
                <div className="text-2xl font-bold font-mono text-[#00f0ff]">{report?.overall_score}</div>
                <div>
                  <div className="text-sm font-semibold">{idea.name}</div>
                  <div className="text-[10px] text-[#9a9590]">Score qualifies for launch (≥30)</div>
                </div>
              </div>

              {/* Token config */}
              <div className="space-y-3 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-[#5a5652] tracking-[1.5px] uppercase block mb-1.5">Token Name</label>
                    <input type="text" value={tokenName} onChange={(e) => setTokenName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-sm text-[#e8e4dd] focus:border-[rgba(0,240,255,0.3)] focus:outline-none transition-colors"
                      maxLength={32} />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#5a5652] tracking-[1.5px] uppercase block mb-1.5">Symbol</label>
                    <input type="text" value={tokenSymbol} onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-sm text-[#e8e4dd] font-mono tracking-wider focus:border-[rgba(0,240,255,0.3)] focus:outline-none transition-colors"
                      maxLength={10} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#5a5652] tracking-[1.5px] uppercase block mb-1.5">Image URL <span className="opacity-40">optional</span></label>
                  <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-xs text-[#e8e4dd] focus:border-[rgba(0,240,255,0.3)] focus:outline-none transition-colors placeholder:text-[#5a5652]/30"
                    placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-[#5a5652] tracking-[1.5px] uppercase block mb-1.5">Tweet <span className="opacity-40">optional</span></label>
                    <input type="text" value={tweetUrl} onChange={(e) => setTweetUrl(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-xs text-[#e8e4dd] focus:border-[rgba(0,240,255,0.3)] focus:outline-none transition-colors placeholder:text-[#5a5652]/30"
                      placeholder="https://x.com/..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#5a5652] tracking-[1.5px] uppercase block mb-1.5">Fee To <span className="opacity-40">optional</span></label>
                    <input type="text" value={feeRecipient} onChange={(e) => setFeeRecipient(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-xs text-[#e8e4dd] font-mono focus:border-[rgba(0,240,255,0.3)] focus:outline-none transition-colors placeholder:text-[#5a5652]/30"
                      placeholder="@user / 0x..." />
                  </div>
                </div>
              </div>

              {/* What you get */}
              <div className="mb-5 p-3 rounded-xl bg-[#111118] border border-[rgba(255,255,255,0.04)]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ["⚡", "ERC-20 on Base"],
                    ["🦄", "Uniswap V4 pool"],
                    ["💰", "57% swap fees"],
                    ["🏦", "Listed on bankr.bot"],
                    ["📊", "Trade via @bankrbot"],
                    ["🔗", "Score card linked"],
                  ].map(([icon, text]) => (
                    <div key={text} className="flex items-center gap-2 text-[11px] text-[#9a9590]">
                      <span className="text-xs">{icon}</span><span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleLaunch} disabled={!tokenName.trim() || !tokenSymbol.trim()}
                className="w-full py-3.5 rounded-lg bg-[#34d399] text-[#06060a] text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                🏦 Launch Token via Bankr
              </button>
              <p className="text-[10px] text-[#5a5652] text-center mt-3">Powered by BankrBot · Deployed on Base mainnet</p>
            </>
          )}

          {step === "deploying" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-[rgba(0,200,83,0.2)] border-t-[#34d399] rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-lg font-semibold mb-2">Deploying via Bankr...</h3>
              <p className="text-sm text-[#9a9590] mb-6">Your token is being deployed on Base. This may take up to 2 minutes.</p>
              <div className="space-y-2 text-left max-w-xs mx-auto">
                {["Connecting to Bankr...", "Deploying ERC-20 on Base...", "Creating Uniswap V4 pool...", "Linking ValidFi score card..."].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs text-[#5a5652]">
                    <div className="w-4 h-4 border border-[rgba(0,200,83,0.3)] border-t-[#34d399] rounded-full animate-spin" style={{ animationDelay: `${i * 0.3}s` }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "success" && launchResult && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] flex items-center justify-center text-3xl mx-auto mb-5">🎉</div>
              <h3 className="text-xl font-bold mb-1">Token Launched!</h3>
              <p className="text-sm text-[#9a9590] mb-6">
                <span className="font-mono font-bold text-[#e8e4dd]">${launchResult.tokenSymbol}</span> is now live on Base via Bankr
              </p>

              <div className="text-left space-y-3 mb-6 p-4 rounded-xl bg-[#111118] border border-[rgba(52,211,153,0.1)]">
                {launchResult.tokenAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-wider">Contract</span>
                    <span className="text-xs font-mono text-[#00f0ff]">{launchResult.tokenAddress.slice(0, 8)}...{launchResult.tokenAddress.slice(-6)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-wider">Network</span>
                  <span className="text-xs font-mono text-[#a855f7]">Base Mainnet</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-wider">Creator Fees</span>
                  <span className="text-xs font-mono text-[#34d399]">57% of swaps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#5a5652] uppercase tracking-wider">Status</span>
                  <span className="text-xs font-mono text-[#34d399]">● Live</span>
                </div>
              </div>

              {/* Trade command */}
              {launchResult.tokenAddress && (
                <div className="mb-6 p-3 rounded-lg bg-[rgba(0,200,83,0.04)] border border-[rgba(0,200,83,0.1)]">
                  <div className="text-[9px] font-mono text-[#5a5652] tracking-wider uppercase mb-2">Trade on X</div>
                  <code className="text-xs font-mono text-[#34d399] break-all">
                    @bankrbot buy $50 of {launchResult.tokenAddress}
                  </code>
                </div>
              )}

              <div className="flex gap-3">
                {launchResult.bankrUrl && (
                  <a href={launchResult.bankrUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-lg bg-[rgba(0,200,83,0.08)] border border-[rgba(0,200,83,0.15)] text-xs font-semibold text-[#34d399] hover:bg-[rgba(0,200,83,0.12)] transition-all text-center">
                    🏦 View on Bankr ↗
                  </a>
                )}
                {launchResult.uniswapUrl && (
                  <a href={launchResult.uniswapUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)] text-xs font-semibold text-[#a855f7] hover:bg-[rgba(168,85,247,0.12)] transition-all text-center">
                    🦄 Uniswap ↗
                  </a>
                )}
              </div>

              <button onClick={onClose} className="w-full mt-4 py-3 rounded-lg bg-[#34d399] text-[#06060a] text-sm font-bold hover:brightness-110 transition-all">
                Done
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] flex items-center justify-center text-2xl mx-auto mb-5">✕</div>
              <h3 className="text-lg font-bold mb-2">Launch Failed</h3>
              <p className="text-sm text-[#f87171] mb-6 max-w-sm mx-auto">{error}</p>
              <div className="flex gap-3">
                <button onClick={() => { setStep("confirm"); setError(""); }}
                  className="flex-1 py-3 rounded-lg bg-[#34d399] text-[#06060a] text-sm font-bold hover:brightness-110 transition-all">
                  Try Again
                </button>
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-sm font-semibold text-[#e8e4dd] hover:border-[rgba(255,255,255,0.12)] transition-all">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function genSymbol(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 5).toUpperCase();
}

// ─── Dashboard ───────────────────────────────────────────────

export default function Dashboard() {
  const { shortAddr, disconnect } = useWallet();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [launchModal, setLaunchModal] = useState<Idea | null>(null);
  const [launches, setLaunches] = useState<Record<string, LaunchData>>({});

  useEffect(() => {
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((d) => {
        setIdeas(d);
        setLoading(false);
        d.filter((i: Idea) => i.status === "COMPLETED").forEach((idea: Idea) => {
          fetch(`/api/launch?ideaId=${idea.id}`)
            .then((r) => r.json())
            .then((data) => { if (data.launch) setLaunches((prev) => ({ ...prev, [idea.id]: data.launch })); })
            .catch(() => {});
        });
      })
      .catch(() => setLoading(false));

    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => { setWalletData(d.data); setWalletLoading(false); })
      .catch(() => setWalletLoading(false));
  }, []);

  const deleteIdea = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    setIdeas((p) => p.filter((i) => i.id !== id));
  };

  const handleLaunchSuccess = (ideaId: string, launch: LaunchData) => {
    setLaunches((prev) => ({ ...prev, [ideaId]: launch }));
  };

  const sc = (s?: number) => !s ? "text-ivory-dim" : s >= 70 ? "text-green" : s >= 40 ? "text-amber" : "text-red";
  const vc = (v?: string) => ({ BULLISH: "#4ade80", CAUTIOUS: "#fbbf24", BEARISH: "#f87171", NGMI: "#f87171" }[v || ""] || "#00f0ff");

  const fmtUsd = (v: string) => {
    const n = parseFloat(v || "0");
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  };

  const canLaunch = (idea: Idea): boolean => {
    if (idea.status !== "COMPLETED") return false;
    const report = idea.report as any;
    return report?.overall_score && report.overall_score >= 30;
  };

  return (
    <div className="min-h-screen">
      {launchModal && (
        <LaunchModal idea={launchModal} onClose={() => setLaunchModal(null)} onSuccess={handleLaunchSuccess} />
      )}

      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 border-b border-border bg-[#06060add] backdrop-blur-xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <img src="/validfi_logo.png" alt="ValidFi" className="h-10 w-10 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          {/* <span className="text-lg font-bold tracking-tight">Valid<span className="text-accent">Fi</span></span> */}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-accent px-3 py-1.5 rounded-md border border-accent-border bg-accent-muted tracking-wider">{shortAddr}</span>
          <button onClick={disconnect} className="text-xs text-ivory-dim hover:text-ivory transition-colors">Disconnect</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-7 py-9">
        {/* Wallet Intelligence */}
        <div className="rounded-xl bg-surface border border-border mb-8 overflow-hidden animate-fade-in">
          <div className="px-7 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-muted border border-purple/20 flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/></svg>
              </div>
              <span className="text-[11px] font-mono text-ivory-dim tracking-[2px] uppercase">On-Chain Profile</span>
            </div>
            <span className="text-[9px] font-mono text-ivory-dim/40 tracking-wider">POWERED BY x402</span>
          </div>

          {walletLoading ? (
            <div className="px-7 py-8 flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-ivory-dim">Scanning blockchain activity...</span>
            </div>
          ) : !walletData ? (
            <div className="px-7 py-6 text-center">
              <p className="text-xs text-ivory-dim/50">No on-chain data available yet</p>
            </div>
          ) : (
            <div className="px-7 py-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div>
                  <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">Portfolio</div>
                  <div className="text-xl font-bold text-accent">{fmtUsd(walletData.totalValueUsd)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">30D P&L</div>
                  <div className={`text-xl font-bold ${parseFloat(walletData.pnl30d) >= 0 ? "text-green" : "text-red"}`}>
                    {parseFloat(walletData.pnl30d) >= 0 ? "+" : ""}{fmtUsd(walletData.pnl30d)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">Staked</div>
                  <div className="text-xl font-bold text-purple">{fmtUsd(walletData.totalStakedUsd)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">Transactions</div>
                  <div className="text-xl font-bold text-ivory">{walletData.txCount.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {walletData.chains.map((c) => (
                  <span key={c} className="text-[10px] font-mono px-2.5 py-1 rounded bg-accent-muted text-accent/70 tracking-wider capitalize">{c}</span>
                ))}
                {walletData.defiPositions > 0 && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-muted text-purple/70 tracking-wider">{walletData.defiPositions} DeFi positions</span>
                )}
                {walletData.walletAge !== "Unknown" && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-surface text-ivory-dim/50 tracking-wider border border-border">Age: {walletData.walletAge}</span>
                )}
              </div>
              {walletData.topTokens.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-2">Top Holdings</div>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {walletData.topTokens.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs shrink-0">
                        <span className="font-mono font-bold text-ivory">{t.symbol}</span>
                        <span className="text-ivory-dim/50">{fmtUsd(t.balanceUsd)}</span>
                        <span className="text-[9px] font-mono text-accent/40">{t.chain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {walletData.stakingPositions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-2">Staking</div>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {walletData.stakingPositions.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs shrink-0">
                        <span className="font-mono font-bold text-purple">{s.protocol}</span>
                        <span className="text-ivory-dim/50">{s.amount} {s.token}</span>
                        <span className="text-green text-[10px]">{s.apy}% APY</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Header + CTA */}
        <div className="flex justify-between items-end mb-10 animate-fade-in">
          <div>
            <span className="text-[11px] text-accent tracking-[3px] uppercase font-semibold font-mono">Dashboard</span>
            <h1 className="text-3xl font-normal mt-2 tracking-tight" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>Your Projects</h1>
          </div>
          <button onClick={() => router.push("/ideas/new")} className="inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-accent text-[#06060a] text-sm font-semibold hover:brightness-110 transition-all">
            + Validate Idea
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-ivory-dim text-sm">Loading...</div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-20 px-10 rounded-xl bg-surface border border-border animate-fade-in-d1">
            <div className="w-14 h-14 rounded-xl bg-accent-muted border border-accent-border flex items-center justify-center mx-auto mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3 className="text-xl font-normal mb-2" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>No projects yet</h3>
            <p className="text-sm text-ivory-dim max-w-xs mx-auto mb-7">Submit your first Web3 idea to receive an AI validation report.</p>
            <button onClick={() => router.push("/ideas/new")} className="px-7 py-3 rounded-lg bg-accent text-[#06060a] text-sm font-semibold">+ Validate First Idea</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ideas.map((idea) => {
              const r = idea.report as any;
              const launch = launches[idea.id] || null;
              const showLaunchBtn = canLaunch(idea) && !launch;
              const isLive = launch?.status === "LIVE";
              const isDeploying = launch?.status === "DEPLOYING" || launch?.status === "PENDING";
              const isFailed = launch?.status === "FAILED";

              return (
                <div key={idea.id} className="rounded-xl bg-surface border border-border hover:border-border-hover transition-all px-7 py-5">
                  {/* Main row */}
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => router.push(`/ideas/${idea.id}`)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[15px] font-bold tracking-tight truncate">{idea.name}</span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-accent-muted text-accent tracking-wider shrink-0">{idea.category}</span>
                        {idea.chain && <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-purple-muted text-purple tracking-wider shrink-0">{idea.chain}</span>}
                      </div>
                      <div className="text-xs text-ivory-dim truncate">{idea.oneLiner || idea.problem?.slice(0, 80)}</div>
                    </div>
                    <div className="flex items-center gap-5 shrink-0 ml-6">
                      <span className={`text-2xl font-semibold font-mono ${sc(r?.overall_score)}`}>{r?.overall_score ?? "—"}</span>
                      {r?.verdict && (
                        <span className="text-[10px] font-mono px-3 py-1 rounded-full font-bold tracking-[2px] uppercase"
                          style={{ color: vc(r.verdict), background: vc(r.verdict) + "0d", border: `1px solid ${vc(r.verdict)}33` }}>
                          {r.verdict}
                        </span>
                      )}
                      {idea.status === "ANALYZING" && <span className="text-[10px] font-mono text-accent tracking-wider">Analyzing...</span>}
                      {idea.status === "FAILED" && <span className="text-[10px] font-mono text-red tracking-wider">Failed</span>}
                      <button onClick={(e) => { e.stopPropagation(); deleteIdea(idea.id); }}
                        className="text-ivory-dim hover:text-red transition-colors p-1 opacity-30 hover:opacity-100">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Launch / Trade row */}
                  {(showLaunchBtn || isLive || isDeploying || isFailed) && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      {showLaunchBtn && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#34d399] tracking-wider">🏦 ELIGIBLE FOR TOKEN LAUNCH</span>
                            <span className="text-[9px] text-[#5a5652]">Score ≥ 30 — deploy on Base via Bankr</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setLaunchModal(idea); }}
                            className="px-5 py-2 rounded-lg bg-[#34d399] text-[#06060a] text-xs font-bold hover:brightness-110 transition-all">
                            🏦 Launch via Bankr
                          </button>
                        </>
                      )}

                      {isLive && launch && (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-[#34d399] tracking-wider">● LIVE ON BASE</span>
                            <span className="font-mono text-xs font-bold text-[#e8e4dd]">${launch.tokenSymbol}</span>
                            {launch.tokenAddress && (
                              <span className="text-[9px] font-mono text-[#5a5652]">
                                {launch.tokenAddress.slice(0, 8)}...{launch.tokenAddress.slice(-4)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {launch.tokenAddress && (
                              <BankrTradeInline tokenSymbol={launch.tokenSymbol} tokenAddress={launch.tokenAddress} bankrUrl={launch.bankrUrl || undefined} />
                            )}
                            {launch.explorerUrl && (
                              <a href={launch.explorerUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 rounded-md bg-[#111118] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-[#9a9590] hover:text-[#e8e4dd] transition-colors">
                                Basescan ↗
                              </a>
                            )}
                          </div>
                        </>
                      )}

                      {isDeploying && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-[rgba(0,200,83,0.3)] border-t-[#34d399] rounded-full animate-spin" />
                          <span className="text-[10px] font-mono text-[#34d399] tracking-wider">DEPLOYING VIA BANKR...</span>
                        </div>
                      )}

                      {isFailed && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#f87171] tracking-wider">✕ LAUNCH FAILED</span>
                            <span className="text-[9px] text-[#5a5652]">{launch?.error?.slice(0, 60)}</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setLaunchModal(idea); }}
                            className="px-4 py-1.5 rounded-md bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.15)] text-[10px] font-mono text-[#f87171] hover:bg-[rgba(248,113,113,0.12)] transition-colors">
                            Retry
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
