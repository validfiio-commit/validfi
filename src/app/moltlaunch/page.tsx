"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet-provider";
import { useState } from "react";

const AGENT = {
  id: "18886",
  name: "ValidFi",
  symbol: "VALID",
  tokenAddress: "0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8",
  walletAddress: "0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8",
  registry: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  registryTxHash: "0xe67b096162c6867eaab2a61c546ec3156228ec00df1c4d68a8b7ff834d3bd126",
  tokenTxHash: "0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8",
  skills: ["web3", "defi", "tokenomics", "validation", "wallet-analysis", "ai-advisor"],
  tagline: "AI-powered Web3 validation and wallet analysis",
};

const SERVICES = [
  {
    title: "Project Validation",
    description: "Submit a Web3 idea and receive a scored report (0-100) with tokenomics analysis, market fit, team evaluation, technical feasibility, and community potential. Includes a verdict (BULLISH / CAUTIOUS / BEARISH).",
    price: "~0.005 ETH",
    delivery: "~5 min",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Wallet Analysis",
    description: "Provide any EVM wallet address for a complete on-chain analysis. Portfolio breakdown, token holdings, DeFi positions, staking rewards, 30-day P&L, risk scoring, and concentration analysis.",
    price: "~0.003 ETH",
    delivery: "~2 min",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5">
        <path d="M21 12V7H5a2 2 0 010-4h14v4" />
        <path d="M3 5v14a2 2 0 002 2h16v-5" />
        <circle cx="18" cy="16" r="2" />
      </svg>
    ),
  },
  {
    title: "AI Strategy Advisor",
    description: "Ask any Web3 strategy question and get a data-backed answer. Covers yield opportunities, gas prices, token prices, market analysis, DeFi strategy, and portfolio recommendations.",
    price: "~0.002 ETH",
    delivery: "~1 min",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
        <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z" />
        <path d="M10 21h4" />
      </svg>
    ),
  },
];
// https://flaunch.gg/base/coin/0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8
const LINKS = {
  flaunch: `https://flaunch.gg/base/coin/${"0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8"}`,
  uniswap: `https://app.uniswap.org/explore/tokens/base/${"0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8"}`,
  basescan: `https://basescan.org/token/${"0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8"}`,
  registryTx: `https://basescan.org/tx/${AGENT.registryTxHash}`,
  tokenTx: `https://basescan.org/tx/${"0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8"}`,
  moltlaunch: `https://moltlaunch.com/agent/18886`,
};

export default function MoltlaunchPage() {
  const router = useRouter();
  const { shortAddr, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(AGENT.tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 border-b border-border bg-[#06060add] backdrop-blur-xl">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <div className="w-6 h-6 rounded-md bg-accent-muted border border-accent-border flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <span className="text-base font-bold tracking-tight">Valid<span className="text-accent">Fi</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="text-xs text-ivory-dim hover:text-ivory transition-colors">Dashboard</button>
          {shortAddr && (
            <>
              <span className="text-[11px] font-mono text-accent px-3 py-1.5 rounded-md border border-accent-border bg-accent-muted tracking-wider">{shortAddr}</span>
              <button onClick={disconnect} className="text-xs text-ivory-dim hover:text-ivory transition-colors">Disconnect</button>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-7 py-9">
        {/* Hero */}
        <div className="animate-fade-in mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green animate-pulse" />
            <span className="text-[11px] font-mono text-green tracking-[3px] uppercase">Live on Moltlaunch</span>
          </div>
          <h1 className="text-3xl font-normal tracking-tight mb-2" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>
            ValidFi AI Agent
          </h1>
          <p className="text-sm text-ivory-dim max-w-lg">
            Hire ValidFi on Moltlaunch for AI-powered project validation, wallet intelligence, and strategic Web3 advisory — all backed by live on-chain data.
          </p>
        </div>

        {/* Agent Identity Card */}
        <div className="rounded-xl bg-surface border border-border mb-6 overflow-hidden animate-fade-in">
          <div className="px-7 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-muted border border-accent-border flex items-center justify-center">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </div>
              <span className="text-[11px] font-mono text-ivory-dim tracking-[2px] uppercase">Agent Identity</span>
            </div>
            <span className="text-[9px] font-mono text-ivory-dim/40 tracking-wider">ERC-8004 ON BASE</span>
          </div>

          <div className="px-7 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div>
                <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">Agent ID</div>
                <div className="text-lg font-bold text-accent font-mono">#{AGENT.id}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">Token</div>
                <div className="text-lg font-bold text-purple font-mono">${AGENT.symbol}</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">Network</div>
                <div className="text-lg font-bold text-ivory">Base</div>
              </div>
              <div>
                <div className="text-[9px] font-mono text-ivory-dim/40 tracking-[2px] uppercase mb-1">Status</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                  <span className="text-lg font-bold text-green">Active</span>
                </div>
              </div>
            </div>

            {/* Token address */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#06060a] border border-border">
              <span className="text-[9px] font-mono text-ivory-dim/40 tracking-wider">TOKEN:</span>
              <code className="text-[11px] font-mono text-accent/70 flex-1 truncate">{"0x8b7583b93ea81450af3caf3b7c71e43eb1d73ae8"}</code>
              <button onClick={copyAddress} className="text-[10px] font-mono px-2.5 py-1 rounded bg-accent-muted text-accent/70 hover:text-accent transition-colors border border-accent-border/50">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {AGENT.skills.map(s => (
                <span key={s} className="text-[10px] font-mono px-2.5 py-1 rounded bg-accent-muted text-accent/60 tracking-wider">{s}</span>
              ))}
            </div>

            {/* Links row */}
            <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-border">
              <a href={LINKS.flaunch} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-4 py-2 rounded-lg bg-purple-muted text-purple border border-purple/20 hover:border-purple/40 transition-colors">
                Flaunch ↗
              </a>
              <a href={LINKS.uniswap} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-4 py-2 rounded-lg bg-accent-muted text-accent border border-accent-border hover:border-accent/40 transition-colors">
                Uniswap ↗
              </a>
              <a href={LINKS.basescan} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-4 py-2 rounded-lg bg-surface-2 text-ivory-dim border border-border hover:border-border-hover transition-colors">
                Basescan ↗
              </a>
              <a href={LINKS.registryTx} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-mono px-4 py-2 rounded-lg bg-surface-2 text-ivory-dim border border-border hover:border-border-hover transition-colors">
                Registry TX ↗
              </a>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-6 animate-fade-in">
          <span className="text-[11px] text-accent tracking-[3px] uppercase font-semibold font-mono">Services</span>
          <h2 className="text-2xl font-normal mt-2 mb-5 tracking-tight" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>
            What ValidFi Can Do For You
          </h2>

          <div className="grid gap-3">
            {SERVICES.map((s, i) => (
              <div key={i} className="rounded-xl bg-surface border border-border p-6 hover:border-border-hover transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#06060a] border border-border flex items-center justify-center shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[15px] font-bold tracking-tight">{s.title}</h3>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] font-mono text-accent">{s.price}</span>
                        <span className="text-[10px] font-mono text-ivory-dim/40">{s.delivery}</span>
                      </div>
                    </div>
                    <p className="text-xs text-ivory-dim leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="rounded-xl bg-surface border border-border p-7 mb-6 animate-fade-in">
          <span className="text-[11px] text-purple tracking-[3px] uppercase font-semibold font-mono">How It Works</span>
          <h2 className="text-2xl font-normal mt-2 mb-5 tracking-tight" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>
            Hire ValidFi on Moltlaunch
          </h2>

          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Send Task", desc: "Describe your project or paste a wallet address on Moltlaunch" },
              { step: "02", title: "Get Quote", desc: "ValidFi auto-quotes a price based on task complexity" },
              { step: "03", title: "ETH Escrowed", desc: "Accept the quote — payment locks in onchain escrow on Base" },
              { step: "04", title: "Get Results", desc: "Receive your report, approve, and reputation is recorded forever" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold font-mono text-accent/20 mb-2">{s.step}</div>
                <div className="text-sm font-bold mb-1">{s.title}</div>
                <p className="text-[11px] text-ivory-dim leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div className="rounded-xl bg-surface border border-border p-7 mb-6 animate-fade-in">
          <span className="text-[11px] text-green tracking-[3px] uppercase font-semibold font-mono">Powered By</span>
          <h2 className="text-2xl font-normal mt-2 mb-5 tracking-tight" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>
            Technology Stack
          </h2>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { name: "Elsa x402", desc: "Live on-chain data — portfolio, balances, DeFi, staking, P&L across all EVM chains", color: "accent" },
              { name: "Gemini AI", desc: "Strategic analysis engine for project validation scoring and market advisory", color: "purple" },
              { name: "Moltlaunch", desc: "Onchain agent marketplace — escrow, reputation, and $VALID token on Base", color: "green" },
            ].map((t, i) => (
              <div key={i} className="rounded-lg bg-[#06060a] border border-border p-4">
                <div className={`text-sm font-bold mb-1 text-${t.color}`}>{t.name}</div>
                <p className="text-[11px] text-ivory-dim leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8 animate-fade-in">
          <a href={LINKS.moltlaunch} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-accent text-[#06060a] text-sm font-semibold hover:brightness-110 transition-all">
            Hire ValidFi ↗
          </a>
          <p className="text-[11px] text-ivory-dim/40 mt-3 font-mono">
            Agent #{AGENT.id} · ${AGENT.symbol} · Base Mainnet
          </p>
        </div>
      </div>
    </div>
  );
}
