"use client";

import { useWallet } from "@/components/wallet-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { address, connecting, connect } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (address) router.push("/dashboard");
  }, [address, router]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse,rgba(0,240,255,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(168,85,247,0.03)_0%,transparent_60%)] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-muted border border-accent-border flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Valid<span className="text-accent">Fi</span>
          </span>
        </div>
        <button
          onClick={connect}
          disabled={connecting}
          className="px-6 py-2.5 rounded-lg bg-accent text-[#06060a] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      </nav>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-8 pt-32 pb-28 text-center relative z-10">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border mb-10 text-xs text-ivory-dim tracking-widest uppercase font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#00f0ff]" />
            AI-Powered Web3 Validation
          </div>
        </div>

        <h1
          className="text-6xl md:text-7xl font-normal leading-[1.05] tracking-tight mb-8 animate-fade-in-d1"
          style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}
        >
          Validate your
          <br />
          <span className="bg-gradient-to-r from-accent via-purple to-accent bg-clip-text text-transparent">
            Web3 idea
          </span>
        </h1>

        <p className="text-lg text-ivory-muted leading-relaxed max-w-md mx-auto mb-12 animate-fade-in-d2">
          Connect wallet. Submit your project. Get an AI-generated validation report
          with tokenomics analysis, competitor mapping, and a shareable score card.
        </p>

        <div className="animate-fade-in-d3">
          <button
            onClick={connect}
            disabled={connecting}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-lg bg-accent text-[#06060a] text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_0_40px_rgba(0,240,255,0.15)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12V7H5a2 2 0 010-4h14v4" />
              <path d="M3 5v14a2 2 0 002 2h16v-5" />
              <path d="M18 12a2 2 0 000 4h4v-4h-4z" />
            </svg>
            {connecting ? "Connecting..." : "Connect Wallet to Start"}
          </button>
        </div>

        {/* Feature pills */}
        <div className="flex justify-center gap-4 mt-20 flex-wrap">
          {[
            ["⚡", "5D Scoring"],
            ["🔗", "On-Chain Identity"],
            ["🤖", "AI Advisor"],
            ["📊", "Share Card"],
          ].map(([icon, label]) => (
            <div
              key={label}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface border border-border text-sm"
            >
              <span>{icon}</span>
              <span className="text-ivory-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
