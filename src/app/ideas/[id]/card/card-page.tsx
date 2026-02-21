"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

interface CardData {
  id: string; name: string; oneLiner?: string; category: string; chain?: string;
  wallet: string; score: number; verdict: string; verdict_reasoning: string;
  scores: { market: number; tokenomics: number; tech: number; team_execution: number; timing: number };
  summary: string; validatedAt: string;
}

export default function CardPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [downloading, setDownloading] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/ideas/${params.id}/card`).then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); setTimeout(() => setMounted(true), 100); }).catch(() => setLoading(false));
  }, [params.id]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRot({ x: (y - 0.5) * -20, y: (x - 0.5) * 20 });
    setGlarePos({ x: x * 100, y: y * 100 });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#030306" }}>
      <div className="w-6 h-6 border-2 border-[#00f0ff33] border-t-[#00f0ff] rounded-full animate-spin" />
    </div>
  );
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#030306" }}>
      <p className="text-[#ffffff44] text-sm">Card not found</p>
    </div>
  );

  const sc = (s: number) => s >= 70 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171";
  const vc = (v: string) => ({ BULLISH: "#4ade80", CAUTIOUS: "#fbbf24", BEARISH: "#f87171", NGMI: "#f87171" }[v] || "#00f0ff");
  const verdictEmoji = (v: string) => ({ BULLISH: "🚀", CAUTIOUS: "🔍", BEARISH: "⚠️", NGMI: "💀" }[v] || "⚡");
  const shortWallet = `${data.wallet.slice(0, 6)}···${data.wallet.slice(-4)}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/ideas/${data.id}/card` : "";

  // Score-based viral captions
  const caption = data.score >= 85
    ? `${verdictEmoji(data.verdict)} My Web3 project "${data.name}" just scored ${data.score}/100 on @validfi_io — ${data.verdict}!\n\nAI says we're onto something big. Can your idea beat this?\n\nValidate yours 👇`
    : data.score >= 65
    ? `${verdictEmoji(data.verdict)} "${data.name}" scored ${data.score}/100 on @validfi_io — ${data.verdict}\n\nNot bad, but room to grow. Curious what your Web3 idea would score?\n\nTry it free 👇`
    : data.score >= 40
    ? `${verdictEmoji(data.verdict)} Real talk — "${data.name}" scored ${data.score}/100 on @validfi_io\n\nAI doesn't sugarcoat. Time to iterate. Think your idea can do better?\n\nFind out 👇`
    : `${verdictEmoji(data.verdict)} "${data.name}" got a ${data.score}/100 on @validfi_io — ${data.verdict}\n\nHonest validation hits different. Not every idea makes it, but knowing early saves months.\n\nTest yours 👇`;

  const tweetText = `${caption}\n\n${shareUrl}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const copyCardImage = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#030306",
        scale: 2,
        useCORS: true,
        logging: false,
      } as any);
      
      // Convert canvas to blob and copy to clipboard
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b: Blob | null) => b ? resolve(b) : reject(new Error("Failed")), "image/png");
      });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 3000);
    } catch (err) {
      // Fallback: download as file
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(cardRef.current!, { backgroundColor: "#030306", scale: 2, useCORS: true, logging: false } as any);
        const link = document.createElement("a");
        link.download = `${data.name.replace(/\s+/g, "-").toLowerCase()}-validfi.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch {
        alert("Tip: Take a screenshot of the card to share!");
      }
    }
    setDownloading(false);
  };

  const scoreEntries = Object.entries(data.scores);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden select-none" style={{ background: "#030306" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Sora:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@1&display=swap');

        @keyframes float { 0%,100%{ transform: translateY(0px); } 50%{ transform: translateY(-8px); } }
        @keyframes rotateHolo { 0%{ transform: rotate(0deg); } 100%{ transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(40px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes revealBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes shimmerFlow { 0%{ background-position: 200% center; } 100%{ background-position: -200% center; } }
        @keyframes borderGlow { 0%,100%{ opacity:0.3; } 50%{ opacity:0.7; } }
        @keyframes orbFloat1 { 0%,100%{ transform: translate(0,0) scale(1); } 33%{ transform: translate(30px,-20px) scale(1.1); } 66%{ transform: translate(-10px,15px) scale(0.9); } }
        @keyframes orbFloat2 { 0%,100%{ transform: translate(0,0) scale(1); } 33%{ transform: translate(-25px,18px) scale(0.9); } 66%{ transform: translate(20px,-12px) scale(1.15); } }
        @keyframes scoreCount { from { opacity:0; transform: scale(0.5); } to { opacity:1; transform: scale(1); } }
        @keyframes ringDraw { from { stroke-dashoffset: 440; } }

        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out;
        }

        .holo-shimmer {
          background: linear-gradient(
            105deg,
            transparent 20%,
            rgba(0,240,255,0.03) 30%,
            rgba(168,85,247,0.05) 40%,
            rgba(0,240,255,0.03) 50%,
            transparent 60%
          );
          background-size: 200% 100%;
          animation: shimmerFlow 6s ease-in-out infinite;
        }

        .score-ring-animate {
          animation: ringDraw 2s ease-out 0.5s backwards;
        }
      `}</style>

      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.07]" style={{ background: "#00f0ff", top: "-15%", left: "-10%", animation: "orbFloat1 20s ease-in-out infinite" }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[130px] opacity-[0.05]" style={{ background: "#a855f7", bottom: "-10%", right: "-10%", animation: "orbFloat2 18s ease-in-out infinite" }} />
        <div className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.04]" style={{ background: "#fbbf24", top: "40%", left: "60%", animation: "orbFloat1 15s ease-in-out infinite reverse" }} />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <button onClick={() => router.push(`/ideas/${data.id}`)} className="absolute top-6 left-6 text-xs z-20 px-4 py-2 rounded-full border transition-all hover:border-[#ffffff22] hover:bg-[#ffffff08]"
        style={{ color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.08)", fontFamily: "Sora, sans-serif" }}>
        ← Back to Report
      </button>

      {/* ═══════════ THE CARD ═══════════ */}
      <div
        ref={cardRef}
        className="card-3d w-[520px] max-w-[92vw]"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setRot({ x: 0, y: 0 }); setGlarePos({ x: 50, y: 50 }); }}
        style={{
          transform: `perspective(1200px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          animation: mounted ? "slideIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards, float 6s ease-in-out 1s infinite" : "none",
          opacity: mounted ? 1 : 0,
        }}
      >
        <div className="relative rounded-[24px] overflow-hidden" style={{
          background: "linear-gradient(165deg, #0c0c18 0%, #080814 30%, #0a0818 60%, #0c0c18 100%)",
          boxShadow: hovering
            ? `0 30px 100px -20px rgba(0,240,255,0.15), 0 0 80px -30px rgba(168,85,247,0.12), 0 0 0 1px rgba(0,240,255,0.1), inset 0 0 80px rgba(0,240,255,0.02)`
            : `0 20px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)`,
          transition: "box-shadow 0.4s ease",
        }}>
          {/* Holo shimmer */}
          <div className="absolute inset-0 holo-shimmer rounded-[24px] pointer-events-none z-10" />

          {/* Glare */}
          {hovering && (
            <div className="absolute inset-0 rounded-[24px] pointer-events-none z-20" style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.06) 0%, transparent 50%)`,
            }} />
          )}

          {/* Top border */}
          <div className="relative h-[2px] overflow-hidden">
            <div className="absolute inset-0" style={{
              background: "linear-gradient(90deg, transparent, #00f0ff, #a855f7, #00f0ff, transparent)",
              animation: "borderGlow 3s ease-in-out infinite",
            }} />
          </div>

          <div className="relative z-10 p-9 pb-7">
            {/* Header */}
            <div className="flex items-start justify-between mb-7">
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                    background: "linear-gradient(135deg, rgba(0,240,255,0.12), rgba(168,85,247,0.08))",
                    border: "1px solid rgba(0,240,255,0.2)",
                    boxShadow: "0 0 20px rgba(0,240,255,0.1)",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <div>
                    <span className="text-[15px] font-bold tracking-tight" style={{ fontFamily: "Sora, sans-serif", color: "#eeeae2" }}>
                      Valid<span style={{ color: "#00f0ff" }}>Fi</span>
                    </span>
                    <div className="text-[9px] tracking-[3px] uppercase mt-0.5" style={{ fontFamily: "Space Mono, monospace", color: "rgba(238,234,226,0.2)" }}>
                      Validation Protocol
                    </div>
                  </div>
                </div>
                <h2 className="text-[28px] font-bold tracking-tight leading-[1.15] mb-1.5" style={{ fontFamily: "Sora, sans-serif", color: "#eeeae2" }}>
                  {data.name}
                </h2>
                {data.oneLiner && (
                  <p className="text-[12px] max-w-[260px] leading-relaxed" style={{ fontFamily: "Sora, sans-serif", color: "rgba(238,234,226,0.35)" }}>
                    {data.oneLiner}
                  </p>
                )}
              </div>

              {/* Score ring */}
              <div className="relative w-[110px] h-[110px] flex items-center justify-center shrink-0" style={{ animation: "scoreCount 1s cubic-bezier(0.16,1,0.3,1) 0.3s backwards" }}>
                <div className="absolute inset-[-6px] rounded-full" style={{
                  background: `conic-gradient(from 0deg, ${sc(data.score)}22, transparent 40%, ${sc(data.score)}11, transparent 80%)`,
                  animation: "rotateHolo 8s linear infinite",
                }} />
                <div className="absolute inset-0 rounded-full" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }} />
                <svg width="110" height="110" className="absolute" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                  <circle cx="55" cy="55" r="46" fill="none" stroke={`url(#scoreGrad)`} strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 - (data.score / 100) * 2 * Math.PI * 46}
                    strokeLinecap="round"
                    className="score-ring-animate"
                    style={{ filter: `drop-shadow(0 0 6px ${sc(data.score)}66)` }}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={sc(data.score)} />
                      <stop offset="100%" stopColor={data.score >= 70 ? "#00f0ff" : data.score >= 50 ? "#f59e0b" : "#ef4444"} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-center z-10">
                  <div className="text-[38px] font-extrabold leading-none" style={{ fontFamily: "Sora, sans-serif", color: sc(data.score), textShadow: `0 0 30px ${sc(data.score)}44` }}>
                    {data.score}
                  </div>
                  <div className="text-[9px] tracking-[2px] mt-0.5" style={{ fontFamily: "Space Mono, monospace", color: "rgba(238,234,226,0.25)" }}>/100</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-7">
              <span className="text-[10px] px-3.5 py-1.5 rounded-full tracking-wider font-semibold" style={{
                fontFamily: "Space Mono, monospace",
                background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.15)", color: "#00f0ff",
              }}>{data.category}</span>
              {data.chain && (
                <span className="text-[10px] px-3.5 py-1.5 rounded-full tracking-wider font-semibold" style={{
                  fontFamily: "Space Mono, monospace",
                  background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", color: "#a855f7",
                }}>⬡ {data.chain}</span>
              )}
              <span className="text-[10px] px-3.5 py-1.5 rounded-full tracking-[2.5px] font-bold uppercase" style={{
                fontFamily: "Space Mono, monospace",
                background: `${vc(data.verdict)}0a`, border: `1px solid ${vc(data.verdict)}25`, color: vc(data.verdict),
                textShadow: `0 0 12px ${vc(data.verdict)}44`,
              }}>{verdictEmoji(data.verdict)} {data.verdict}</span>
            </div>

            {/* Score bars */}
            <div className="rounded-2xl p-5 mb-6" style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.015) 0%, rgba(0,240,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}>
              {scoreEntries.map(([k, v], i) => (
                <div key={k} className="flex items-center gap-3 mb-2.5 last:mb-0">
                  <span className="w-[90px] text-[10px] capitalize tracking-wider" style={{ fontFamily: "Space Mono, monospace", color: "rgba(238,234,226,0.3)" }}>
                    {k.replace("_", " ")}
                  </span>
                  <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${v}%`,
                      background: `linear-gradient(90deg, ${sc(v)}, ${sc(v)}cc)`,
                      boxShadow: `0 0 10px ${sc(v)}33`,
                      transformOrigin: "left",
                      animation: `revealBar 1.2s cubic-bezier(0.16,1,0.3,1) ${0.6 + i * 0.12}s backwards`,
                    }} />
                  </div>
                  <span className="w-7 text-right text-[12px] font-bold tabular-nums" style={{
                    fontFamily: "Space Mono, monospace", color: sc(v), textShadow: `0 0 8px ${sc(v)}33`,
                  }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Verdict text */}
            <p className="text-[11.5px] leading-[1.7] mb-7" style={{
              fontFamily: "Sora, sans-serif", color: "rgba(238,234,226,0.4)",
              maxHeight: "3.6em", overflow: "hidden",
            }}>
              {data.verdict_reasoning}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-5 relative">
              <div className="absolute top-0 left-0 right-0 h-px" style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(0,240,255,0.1) 50%, rgba(255,255,255,0.06) 80%, transparent)",
              }} />
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
                  background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,240,255,0.1))",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/></svg>
                </div>
                <span className="text-[11px] tracking-[1px]" style={{ fontFamily: "Space Mono, monospace", color: "rgba(238,234,226,0.25)" }}>{shortWallet}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] tracking-[3px] uppercase" style={{ fontFamily: "Space Mono, monospace", color: "rgba(238,234,226,0.15)" }}>Validated by</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{
                  background: "linear-gradient(135deg, rgba(0,240,255,0.06), rgba(168,85,247,0.04))",
                  border: "1px solid rgba(0,240,255,0.12)",
                }}>
                  <span className="text-[11px] font-bold tracking-tight" style={{ fontFamily: "Sora, sans-serif", color: "#eeeae2" }}>
                    Valid<span style={{ color: "#00f0ff" }}>Fi</span>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#00f0ff22" stroke="#00f0ff" strokeWidth="1.5"/><path d="M8 12.5l2.5 2.5 5-5" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom border */}
          <div className="relative h-[2px] overflow-hidden">
            <div className="absolute inset-0" style={{
              background: "linear-gradient(90deg, transparent, #a855f7, #00f0ff, #a855f7, transparent)",
              animation: "borderGlow 3s ease-in-out infinite reverse",
            }} />
          </div>
        </div>
      </div>

      {/* Share flow */}
      <div className="flex flex-col items-center gap-4 mt-10 z-10" style={{ animation: "slideIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s backwards" }}>

        <div className="flex gap-3">
          {/* Copy Card Image */}
          <button onClick={copyCardImage} disabled={downloading}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: "Sora, sans-serif",
              background: imageCopied ? "rgba(74,222,128,0.1)" : downloading ? "rgba(0,240,255,0.05)" : "linear-gradient(135deg, rgba(0,240,255,0.1), rgba(168,85,247,0.08))",
              border: imageCopied ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(0,240,255,0.2)",
              color: imageCopied ? "#4ade80" : "#00f0ff",
              boxShadow: imageCopied ? "0 4px 20px rgba(74,222,128,0.1)" : "0 4px 20px rgba(0,240,255,0.1)",
            }}>
            {downloading ? (
              <div className="w-4 h-4 border-2 border-[#00f0ff33] border-t-[#00f0ff] rounded-full animate-spin" />
            ) : imageCopied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            )}
            {downloading ? "Copying..." : imageCopied ? "Image Copied!" : "📸 Copy Card Image"}
          </button>

          {/* Share on X — opens with caption pre-filled, user pastes image */}
          <a href={tweetUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-white text-sm font-semibold transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: "Sora, sans-serif",
              background: "linear-gradient(135deg, #1d9bf0, #1a8cd8)",
              boxShadow: "0 4px 20px rgba(29,155,240,0.3)",
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Share on X
          </a>

          {/* Copy Link */}
          <button onClick={copyLink}
            className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              fontFamily: "Sora, sans-serif",
              background: copied ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.03)",
              border: copied ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.08)",
              color: copied ? "#4ade80" : "rgba(238,234,226,0.4)",
            }}>
            {copied ? "✓ Copied!" : "🔗"}
          </button>
        </div>

        <p className="text-[10px] tracking-[1px] max-w-sm text-center leading-relaxed" style={{ fontFamily: "Sora, sans-serif", color: "rgba(238,234,226,0.2)" }}>
          {imageCopied ? "Now click \"Share on X\" and paste (Ctrl+V) the image into your post" : "Copy the card image, then paste it directly into your X post"}
        </p>
      </div>
    </div>
  );
}
