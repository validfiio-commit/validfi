"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWalletCompat as useWallet } from "@/hooks/use-wallet-compat";
import MintReportCard from "@/components/mint-report-card";
import type { Idea, Report } from "@/types";

export default function IdeaPage() {
  const router = useRouter();
  const params = useParams();
  const { shortAddr } = useWallet();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ideas/${params.id}`).then(r => r.json()).then(d => { setIdea(d); setLoading(false); });
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-ivory-dim text-sm">Loading...</div>;
  if (!idea) return <div className="min-h-screen flex items-center justify-center text-red text-sm">Not found</div>;

  const r = idea.report as unknown as Report | undefined;
  const tabs = ["overview","market","competitors","swot","risks","roadmap"];
  const sc = (s: number) => s >= 70 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171";
  const vc = (v: string) => ({ BULLISH:"#4ade80", CAUTIOUS:"#fbbf24", BEARISH:"#f87171", NGMI:"#f87171" }[v] || "#00f0ff");

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 border-b border-border bg-[#06060add] backdrop-blur-xl">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <div className="w-6 h-6 rounded-md bg-accent-muted border border-accent-border flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <img
            src="/validfi_logo.png"
            alt="ValidFi"
            className="h-14 w-14 rounded-md"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* <span className="text-base font-bold tracking-tight">Valid<span className="text-accent">Fi</span></span> */}
        </div>
        <span className="text-[11px] font-mono text-accent px-3 py-1.5 rounded-md border border-accent-border bg-accent-muted tracking-wider">{shortAddr}</span>
      </nav>

      <div className="max-w-4xl mx-auto px-7 py-9">
        <button onClick={() => router.push("/dashboard")} className="text-xs text-ivory-dim hover:text-ivory transition-colors mb-4">← Dashboard</button>

        <div className="flex justify-between items-start flex-wrap gap-4 mb-9">
          <div>
            <h1 className="text-3xl font-normal tracking-tight" style={{ fontFamily: "Instrument Serif, Georgia, serif", fontStyle: "italic" }}>{idea.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-accent-muted text-accent tracking-wider">{idea.category}</span>
              {idea.chain && <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-purple-muted text-purple tracking-wider">{idea.chain}</span>}
              {idea.tokenModel && <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-ivory-dim tracking-wider">{idea.tokenModel}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/ideas/${idea.id}/card`)} className="px-5 py-2.5 rounded-lg border border-accent-border bg-accent-muted text-accent text-sm font-semibold hover:bg-[rgba(0,240,255,0.15)] transition-all">
              📊 Share Card
            </button>
            <button onClick={() => router.push(`/ideas/${idea.id}/chat`)} className="px-5 py-2.5 rounded-lg bg-accent text-[#06060a] text-sm font-semibold hover:brightness-110 transition-all">
              💬 AI Advisor
            </button>
          </div>
        </div>

        {/* Mint Report Card NFT */}
        {r && <MintReportCard ideaId={idea.id} />}

        {!r ? (
          <div className="text-center py-20 rounded-xl bg-surface border border-border">
            {idea.status === "ANALYZING" ? <p className="text-accent text-sm">Generating report...</p>
            : idea.status === "FAILED" ? <>
                <p className="text-red text-sm mb-4">Report generation failed.</p>
                <button onClick={async () => { const res = await fetch(`/api/ideas/${idea.id}/report`, { method: "POST" }); if (res.ok) setIdea(await res.json()); }}
                  className="px-6 py-2.5 rounded-lg bg-accent text-[#06060a] text-sm font-semibold">⚡ Retry</button>
              </> : <p className="text-ivory-dim text-sm">No report.</p>}
          </div>
        ) : (<>
          {/* Score Hero */}
          <div className="flex gap-12 p-9 rounded-xl bg-surface border border-border mb-5 items-center flex-wrap">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg width="160" height="160" className="absolute" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <circle cx="80" cy="80" r="74" fill="none" stroke={sc(r.overall_score)} strokeWidth="6"
                  strokeDasharray={2*Math.PI*74} strokeDashoffset={2*Math.PI*74-(r.overall_score/100)*2*Math.PI*74}
                  strokeLinecap="round" className="transition-all duration-[2s]" />
              </svg>
              <div className="text-center z-10">
                <div className="text-5xl font-semibold font-mono" style={{ color: sc(r.overall_score) }}>{r.overall_score}</div>
                <div className="text-[10px] text-ivory-dim tracking-[2px] mt-1 font-mono">/ 100</div>
              </div>
            </div>
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs text-ivory-dim">Verdict</span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold tracking-[2.5px] uppercase"
                  style={{ color: vc(r.verdict), background: vc(r.verdict)+"0d", border: `1px solid ${vc(r.verdict)}33` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: vc(r.verdict) }} />{r.verdict}
                </span>
              </div>
              {Object.entries(r.scores).map(([k, v]) => (
                <div key={k} className="flex items-center gap-4 mb-3">
                  <span className="w-28 text-xs text-ivory-muted capitalize">{k.replace("_"," ")}</span>
                  <div className="flex-1 h-[3px] bg-[rgba(255,255,255,0.04)] rounded overflow-hidden">
                    <div className="h-full rounded transition-all duration-[1.5s]" style={{ width:`${v}%`, background: sc(v) }} />
                  </div>
                  <span className="w-7 text-sm font-semibold font-mono text-right" style={{ color: sc(v) }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 p-1 bg-surface rounded-xl border border-border mb-5 overflow-x-auto">
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${tab===t ? "bg-accent-muted text-accent" : "text-ivory-dim hover:text-ivory"}`}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-surface border border-border p-8">
            {tab === "overview" && <>
              <h3 className="text-[11px] font-mono text-accent tracking-[3px] uppercase font-semibold mb-6">Executive Summary</h3>
              <p className="text-[15px] text-ivory-muted leading-relaxed mb-6">{r.summary}</p>
              <div className="p-6 rounded-lg bg-accent-muted border border-accent-border mb-6">
                <div className="text-[11px] font-mono text-accent tracking-[2px] mb-2.5 font-semibold">VERDICT</div>
                <p className="text-sm text-[rgba(238,234,226,0.6)] leading-relaxed">{r.verdict_reasoning}</p>
              </div>
              {r.token_analysis && (
                <div className="p-6 rounded-lg bg-purple-muted border border-[rgba(168,85,247,0.2)]">
                  <div className="text-[11px] font-mono text-purple tracking-[2px] mb-2.5 font-semibold">TOKEN ANALYSIS</div>
                  <p className="text-sm text-[rgba(238,234,226,0.6)] leading-relaxed">{r.token_analysis}</p>
                </div>
              )}
            </>}

            {tab === "market" && r.market && <>
              <h3 className="text-[11px] font-mono text-accent tracking-[3px] uppercase font-semibold mb-6">Market Intelligence</h3>
              <div className="grid grid-cols-4 gap-3 mb-9">
                {[["TAM",r.market.tam],["SAM",r.market.sam],["SOM",r.market.som],["CAGR",r.market.growth]].map(([l,v]) => (
                  <div key={l} className="p-5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-border">
                    <div className="text-[10px] font-mono text-ivory-dim tracking-[2px] mb-2">{l}</div>
                    <div className="text-xl font-mono font-semibold text-accent tracking-tight">{v}</div>
                  </div>
                ))}
              </div>
              {r.market.trends?.length > 0 && r.market.trends.map((t,i) => (
                <div key={i} className="flex items-start gap-3.5 mb-3">
                  <span className="text-[10px] font-mono text-accent mt-1 font-semibold">{String(i+1).padStart(2,"0")}</span>
                  <span className="text-sm text-ivory-muted leading-relaxed">{t}</span>
                </div>
              ))}
            </>}

            {tab === "competitors" && r.competitors?.map((c,i) => (
              <div key={i} className="p-6 rounded-lg bg-[rgba(255,255,255,0.01)] border border-border mb-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-bold">{c.name}</span>
                    {c.chain && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-muted text-purple tracking-wider">{c.chain}</span>}
                  </div>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded tracking-[2px] font-bold uppercase ${c.threat==="high"?"bg-[rgba(248,113,113,0.12)] text-red":c.threat==="medium"?"bg-[rgba(251,191,36,0.12)] text-amber":"bg-[rgba(74,222,128,0.12)] text-green"}`}>{c.threat}</span>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <div className="text-[10px] font-mono text-green tracking-[2px] mb-2 font-semibold">STRENGTHS</div>
                    {c.strengths?.map((s,j) => <div key={j} className="text-sm text-ivory-muted mb-1">↳ {s}</div>)}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-red tracking-[2px] mb-2 font-semibold">WEAKNESSES</div>
                    {c.weaknesses?.map((w,j) => <div key={j} className="text-sm text-ivory-muted mb-1">↳ {w}</div>)}
                  </div>
                </div>
              </div>
            ))}

            {tab === "swot" && r.swot && (
              <div className="grid grid-cols-2 gap-3">
                {([["Strengths",r.swot.s,"#4ade80"],["Weaknesses",r.swot.w,"#f87171"],["Opportunities",r.swot.o,"#00f0ff"],["Threats",r.swot.t,"#fbbf24"]] as const).map(([t,items,col]) => (
                  <div key={t} className="p-6 rounded-lg" style={{ background: col+"06", border: `1px solid ${col}15` }}>
                    <div className="text-[10px] font-mono tracking-[2px] font-bold mb-4" style={{ color: col }}>{t.toUpperCase()}</div>
                    {items?.map((item,i) => <div key={i} className="text-sm text-ivory-muted leading-relaxed mb-2.5 pl-3.5" style={{ borderLeft: `2px solid ${col}25` }}>{item}</div>)}
                  </div>
                ))}
              </div>
            )}

            {tab === "risks" && r.risks?.map((risk,i) => {
              const col = risk.s==="critical"?"#f87171":risk.s==="high"?"#fbbf24":"#4ade80";
              return (
                <div key={i} className="p-6 rounded-lg bg-[rgba(255,255,255,0.01)] border border-border mb-3">
                  <div className="flex items-center gap-3 mb-3.5">
                    <span className="text-[15px] font-semibold flex-1">{risk.r}</span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded tracking-[2px] font-bold uppercase" style={{ background: col+"15", color: col }}>{risk.s}</span>
                  </div>
                  <span className="text-sm text-ivory-muted">💡 {risk.m}</span>
                </div>
              );
            })}

            {tab === "roadmap" && <>
              <h3 className="text-[11px] font-mono text-accent tracking-[3px] uppercase font-semibold mb-6">Next Steps</h3>
              <div className="relative pl-7">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                {r.steps?.map((s,i) => (
                  <div key={i} className="flex gap-5 mb-6 relative">
                    <div className="absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full" style={{ background: i===0?"#00f0ff":"rgba(255,255,255,0.06)", boxShadow: i===0?"0 0 10px rgba(0,240,255,0.3)":"none" }} />
                    <div>
                      <div className="text-[15px] font-semibold mb-2">{s.a}</div>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-accent-muted text-accent tracking-wider">{s.t}</span>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[rgba(255,255,255,0.03)] text-ivory-dim tracking-wider">{s.e} effort</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {r.gtm && (
                <div className="p-6 rounded-lg bg-accent-muted border border-accent-border mt-2">
                  <div className="text-[11px] font-mono text-accent tracking-[2px] mb-2 font-semibold">GO-TO-MARKET</div>
                  <p className="text-sm text-[rgba(238,234,226,0.6)] leading-relaxed">{r.gtm}</p>
                </div>
              )}
            </>}
          </div>
        </>)}
      </div>
    </div>
  );
}
