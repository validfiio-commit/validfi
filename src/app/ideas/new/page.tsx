"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletCompat as useWallet } from "@/hooks/use-wallet-compat";

const CATEGORIES = ["DeFi","NFT / Gaming","DAO / Governance","Infrastructure","L2 / Scaling","Identity / Social","Payments","RWA","AI x Crypto","Privacy","DePin","Other"];
const CHAINS = ["Ethereum","Solana","Base","Arbitrum","Polygon","Optimism","Avalanche","BNB Chain","Sui","Aptos","Bitcoin L2","Multi-chain","Other"];
const TOKEN_MODELS = ["Utility Token","Governance Token","NFT-Based","Dual Token","Revenue Share","No Token","Staking","Other"];
const STAGES = [{v:"idea",l:"Idea",d:"Just a concept"},{v:"whitepaper",l:"Whitepaper",d:"Design phase"},{v:"testnet",l:"Testnet",d:"Building / testing"},{v:"mainnet",l:"Mainnet",d:"Live on-chain"},{v:"traction",l:"Traction",d:"Active users"}];

const labelCls = "block text-[11px] text-ivory-dim tracking-[2px] uppercase font-semibold mb-2.5 font-mono";
const inputCls = "w-full px-4 py-3.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-border text-ivory text-sm outline-none transition-colors focus:border-accent-border";

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${selected ? "bg-accent-muted border-accent-border text-accent" : "bg-[rgba(255,255,255,0.02)] border-border text-ivory-muted"}`}>
      {selected ? "✓ " : ""}{label}
    </button>
  );
}

export default function NewIdea() {
  const router = useRouter();
  const { shortAddr } = useWallet();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    name:"",oneLiner:"",category:"",problem:"",solution:"",
    chain:"",tokenModel:"",stage:"idea",competitors:"",audience:"",
  });
  const u = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const steps = [
    { tag: "01", title: "Your Project", sub: "What are you building and why?" },
    { tag: "02", title: "Web3 Details", sub: "Chain, token model, and landscape" },
  ];

  const valid = step === 0 ? f.name && f.category && f.problem && f.solution : true;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      const idea = await res.json();
      router.push(`/ideas/${idea.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 border-b border-border bg-[#06060add] backdrop-blur-xl">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <div className="w-6 h-6 rounded-md bg-accent-muted border border-accent-border flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <img src="/validfi_logo.PNG" alt="ValidFi" className="h-10 w-10 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          {/* <span className="text-base font-bold tracking-tight">Valid<span className="text-accent">Fi</span></span> */}
        </div>
        <span className="text-[11px] font-mono text-accent px-3 py-1.5 rounded-md border border-accent-border bg-accent-muted tracking-wider">{shortAddr}</span>
      </nav>

      <div className="max-w-xl mx-auto px-7 py-12">
        {loading ? (
          <div className="text-center py-28 animate-fade-in">
            <div className="w-[72px] h-[72px] rounded-2xl bg-accent-muted border border-accent-border flex items-center justify-center mx-auto mb-7" style={{ animation: "glow 2.5s ease-in-out infinite" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h2 className="text-2xl font-normal tracking-tight mb-3" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>Analyzing {f.name}</h2>
            <p className="text-xs font-mono text-accent tracking-wider mb-10">Running Web3 validation analysis...</p>
            <div className="w-56 h-0.5 bg-border rounded mx-auto overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-accent to-transparent" style={{ animation: "shimmer 1.5s ease-in-out infinite" }} />
            </div>
            <p className="text-xs text-ivory-dim mt-5">This takes 15-30 seconds</p>
            {error && <p className="text-red text-sm mt-4">{error}</p>}
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="flex gap-2 mb-14">
              {steps.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-sm transition-all duration-500" style={{ background: i <= step ? "#00f0ff" : "rgba(255,255,255,0.06)" }} />
              ))}
            </div>

            <div className="mb-10">
              <span className="text-[11px] font-mono text-accent tracking-[3px] font-semibold">STEP {steps[step].tag} / 02</span>
              <h2 className="text-3xl font-normal mt-2.5 tracking-tight" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>{steps[step].title}</h2>
              <p className="text-sm text-ivory-dim mt-1.5">{steps[step].sub}</p>
            </div>

            <div className="flex flex-col gap-6 mb-12">
              {step === 0 && <>
                <div><label className={labelCls}>Project Name</label><input className={inputCls} value={f.name} onChange={e => u("name",e.target.value)} placeholder="What's it called?" /></div>
                <div><label className={labelCls}>One-liner</label><input className={inputCls} value={f.oneLiner} onChange={e => u("oneLiner",e.target.value)} placeholder="Describe it in one sentence" /></div>
                <div><label className={labelCls}>Category</label><div className="flex flex-wrap gap-1.5">{CATEGORIES.map(c => <Chip key={c} label={c} selected={f.category===c} onClick={() => u("category",c)} />)}</div></div>
                <div><label className={labelCls}>Problem</label><textarea className={inputCls + " min-h-[100px] resize-y leading-relaxed"} value={f.problem} onChange={e => u("problem",e.target.value)} placeholder="What on-chain/web3 problem exists?" /></div>
                <div><label className={labelCls}>Solution</label><textarea className={inputCls + " min-h-[100px] resize-y leading-relaxed"} value={f.solution} onChange={e => u("solution",e.target.value)} placeholder="How does your protocol/product solve this?" /></div>
              </>}
              {step === 1 && <>
                <div><label className={labelCls}>Chain</label><div className="flex flex-wrap gap-1.5">{CHAINS.map(c => <Chip key={c} label={c} selected={f.chain===c} onClick={() => u("chain",c)} />)}</div></div>
                <div><label className={labelCls}>Token Model</label><div className="flex flex-wrap gap-1.5">{TOKEN_MODELS.map(t => <Chip key={t} label={t} selected={f.tokenModel===t} onClick={() => u("tokenModel",t)} />)}</div></div>
                <div><label className={labelCls}>Stage</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{STAGES.map(s => (
                    <button key={s.v} type="button" onClick={() => u("stage",s.v)}
                      className={`p-3 rounded-lg text-left transition-all border ${f.stage===s.v ? "bg-accent-muted border-accent-border" : "bg-[rgba(255,255,255,0.02)] border-border"}`}>
                      <div className={`text-xs font-semibold mb-0.5 ${f.stage===s.v ? "text-accent" : "text-ivory-muted"}`}>{s.l}</div>
                      <div className="text-[10px] text-ivory-dim">{s.d}</div>
                    </button>
                  ))}</div>
                </div>
                <div><label className={labelCls}>Known Competitors / Similar Protocols</label><textarea className={inputCls + " min-h-[70px] resize-y leading-relaxed"} value={f.competitors} onChange={e => u("competitors",e.target.value)} placeholder="Uniswap, Aave, Lido..." /></div>
                <div><label className={labelCls}>Target Audience</label><input className={inputCls} value={f.audience} onChange={e => u("audience",e.target.value)} placeholder="DeFi degens, DAOs, institutional, retail..." /></div>
              </>}
            </div>

            {error && <p className="text-red text-sm mb-4">{error}</p>}

            <div className="flex justify-between pt-6 border-t border-border">
              <button onClick={step === 0 ? () => router.push("/dashboard") : () => setStep(0)} className="text-sm text-ivory-dim hover:text-ivory transition-colors">
                ← {step === 0 ? "Cancel" : "Back"}
              </button>
              {step === 0 ? (
                <button onClick={() => setStep(1)} disabled={!valid} className="px-7 py-3 rounded-lg bg-accent text-[#06060a] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-30">
                  Continue →
                </button>
              ) : (
                <button onClick={submit} className="px-7 py-3 rounded-lg bg-accent text-[#06060a] text-sm font-bold hover:brightness-110 transition-all shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                  ⚡ Validate Project
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
