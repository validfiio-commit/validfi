"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";
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

export default function Dashboard() {
  const { shortAddr, disconnect } = useWallet();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ideas").then(r => r.json()).then(d => { setIdeas(d); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/wallet").then(r => r.json()).then(d => { setWalletData(d.data); setWalletLoading(false); }).catch(() => setWalletLoading(false));
  }, []);

  const deleteIdea = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    setIdeas(p => p.filter(i => i.id !== id));
  };

  const sc = (s?: number) => !s ? "text-ivory-dim" : s >= 70 ? "text-green" : s >= 50 ? "text-amber" : "text-red";
  const vc = (v?: string) => ({ BULLISH: "#4ade80", CAUTIOUS: "#fbbf24", BEARISH: "#f87171", NGMI: "#f87171" }[v || ""] || "#00f0ff");

  const fmtUsd = (v: string) => {
    const n = parseFloat(v || "0");
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 border-b border-border bg-[#06060add] backdrop-blur-xl">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <div className="w-6 h-6 rounded-md bg-accent-muted border border-accent-border flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span className="text-base font-bold tracking-tight">Valid<span className="text-accent">Fi</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-accent px-3 py-1.5 rounded-md border border-accent-border bg-accent-muted tracking-wider">{shortAddr}</span>
          <button onClick={disconnect} className="text-xs text-ivory-dim hover:text-ivory transition-colors">Disconnect</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-7 py-9">
        {/* Wallet Intelligence Card */}
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
              {/* Stats row */}
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

              {/* Details row */}
              <div className="flex flex-wrap gap-2">
                {walletData.chains.map(c => (
                  <span key={c} className="text-[10px] font-mono px-2.5 py-1 rounded bg-accent-muted text-accent/70 tracking-wider capitalize">{c}</span>
                ))}
                {walletData.defiPositions > 0 && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-muted text-purple/70 tracking-wider">
                    {walletData.defiPositions} DeFi positions
                  </span>
                )}
                {walletData.walletAge !== "Unknown" && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-surface text-ivory-dim/50 tracking-wider border border-border">
                    Age: {walletData.walletAge}
                  </span>
                )}
                {walletData.riskScore !== "Unknown" && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-surface text-ivory-dim/50 tracking-wider border border-border">
                    Risk: {walletData.riskScore}
                  </span>
                )}
              </div>

              {/* Top holdings */}
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

              {/* Staking positions */}
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
            {ideas.map(idea => {
              const r = idea.report as any;
              return (
                <div key={idea.id} className="rounded-xl bg-surface border border-border hover:border-border-hover transition-all cursor-pointer px-7 py-5"
                  onClick={() => router.push(`/ideas/${idea.id}`)}>
                  <div className="flex items-center justify-between">
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
                        <span className="text-[10px] font-mono px-3 py-1 rounded-full font-bold tracking-[2px] uppercase" style={{ color: vc(r.verdict), background: vc(r.verdict)+"0d", border: `1px solid ${vc(r.verdict)}33` }}>
                          {r.verdict}
                        </span>
                      )}
                      {idea.status === "ANALYZING" && <span className="text-[10px] font-mono text-accent tracking-wider">Analyzing...</span>}
                      {idea.status === "FAILED" && <span className="text-[10px] font-mono text-red tracking-wider">Failed</span>}
                      <button onClick={e => { e.stopPropagation(); deleteIdea(idea.id); }} className="text-ivory-dim hover:text-red transition-colors p-1 opacity-30 hover:opacity-100">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
