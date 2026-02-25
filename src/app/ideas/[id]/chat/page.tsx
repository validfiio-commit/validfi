"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWalletCompat as useWallet } from "@/hooks/use-wallet-compat";
import type { Idea, Report, ChatMessage } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const { shortAddr } = useWallet();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [msgs, setMsgs] = useState<(ChatMessage & { source?: string })[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [ir, cr] = await Promise.all([fetch(`/api/ideas/${params.id}`), fetch(`/api/ideas/${params.id}/chat`)]);
      if (ir.ok) setIdea(await ir.json());
      if (cr.ok) { const h = await cr.json(); setMsgs(h.map((m:any) => ({ id:m.id, role:m.role==="assistant"?"assistant":"user", content:m.content }))); }
      setLoaded(true);
    })();
  }, [params.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, typing]);

  const send = useCallback(async () => {
    if (!input.trim() || typing) return;
    const txt = input.trim(); setInput("");
    setMsgs(p => [...p, { id:`t-${Date.now()}`, role:"user", content:txt }]);
    setTyping(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}/chat`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({message:txt}) });
      if (!res.ok) throw new Error((await res.json()).error);
      const d = await res.json();
      setMsgs(p => [...p, { id:d.id, role:"assistant", content:d.content, source: d.source }]);
    } catch (e:any) {
      setMsgs(p => [...p, { id:`e-${Date.now()}`, role:"assistant", content:`Error: ${e.message}` }]);
    }
    setTyping(false); inputRef.current?.focus();
  }, [input, typing, params.id]);

  const renderText = (text: string) => text.split("\n").map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#eeeae2;font-weight:600">$1</strong>');
    if (line.startsWith("- ")||line.startsWith("• ")) return <div key={i} className="pl-4 mb-0.5" dangerouslySetInnerHTML={{ __html:"↳ "+html.slice(2) }} />;
    if (line === "") return <div key={i} className="h-2.5" />;
    return <div key={i} className="mb-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
  });

  const report = idea?.report as unknown as Report | undefined;
  const prompts = [
    { text: "Show my portfolio", icon: "⚡" },
    { text: "Price of ETH", icon: "⚡" },
    { text: "Best yields right now", icon: "⚡" },
    { text: "Challenge my tokenomics", icon: "🧠" },
    { text: "Help me plan GTM strategy", icon: "🧠" },
    { text: "Analyze my wallet activity", icon: "⚡" },
  ];

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-ivory-dim text-sm">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with co-branding */}
      <nav className="sticky top-0 z-50 flex items-center gap-4 px-8 py-3.5 border-b border-border bg-[#06060add] backdrop-blur-xl">
        <button onClick={() => router.push(`/ideas/${params.id}`)} className="text-ivory-dim hover:text-ivory transition-colors">←</button>
        <div className="w-10 h-10 rounded-lg bg-accent-muted border border-accent-border flex items-center justify-center relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
          {/* Live indicator */}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green border-2 border-[#06060a]" style={{ animation: "pulse 2s ease-in-out infinite" }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold">AI Advisor</span>
            <span className="text-[8px] font-mono px-2 py-0.5 rounded-full tracking-[1.5px] uppercase"
              style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
              LIVE DATA
            </span>
          </div>
          <div className="text-[11px] font-mono text-ivory-dim tracking-wider mt-0.5">
            {idea?.name} · {idea?.chain || "Web3"} · Score {report?.overall_score ?? "—"}
          </div>
        </div>
        {/* Elsa x402 co-brand */}
        <a href="https://x402.heyelsa.ai" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:brightness-125"
          style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span className="text-[9px] font-mono tracking-[1.5px] uppercase" style={{ color: "rgba(168,85,247,0.7)" }}>
            Powered by <span style={{ color: "#a855f7" }}>Elsa x402</span>
          </span>
        </a>
      </nav>

      {/* XMTP Integration Bar */}
      {process.env.NEXT_PUBLIC_XMTP_AGENT_ADDRESS && (
        <div className="border-b border-border bg-[#06060a] px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* XMTP logo */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                background: "linear-gradient(135deg, #fc4f37 0%, #7c3aed 100%)",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M4 4l8 8 8-8"/><path d="M4 12l8 8 8-8"/></svg>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-[1.5px] uppercase" style={{ color: "#fc4f37" }}>XMTP</span>
            </div>
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green" style={{ animation: "pulse 2s ease-in-out infinite" }} />
              <span className="text-[10px] font-mono tracking-wider" style={{ color: "rgba(238,234,226,0.35)" }}>
                E2E Encrypted · Decentralized Messaging
              </span>
            </div>
          </div>
          <a
            href={`https://xmtp.chat/dm/${process.env.NEXT_PUBLIC_XMTP_AGENT_ADDRESS}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold tracking-wider uppercase transition-all hover:brightness-125"
            style={{
              background: "linear-gradient(135deg, rgba(252,79,55,0.08) 0%, rgba(124,58,237,0.08) 100%)",
              border: "1px solid rgba(252,79,55,0.2)",
              color: "#fc4f37",
            }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            Chat via XMTP
          </a>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-7 py-6 overflow-y-auto">
        {/* Welcome message */}
        {msgs.length === 0 && (
          <div className="flex mb-4">
            <div className="max-w-[82%] p-4 px-5 rounded-[14px] rounded-bl-[4px] bg-surface border border-border">
              <div className="text-sm text-ivory-muted leading-relaxed">
                <div className="mb-2">
                  Welcome to your <strong className="text-ivory font-semibold">{idea?.name}</strong> advisory session.
                  Score: <strong className="text-ivory font-semibold">{report?.overall_score}/100</strong> ({report?.verdict}).
                </div>
                <div className="h-2" />
                <div className="mb-2 py-2 px-3 rounded-lg" style={{ background: "rgba(168,85,247,0.04)", border: "1px solid rgba(168,85,247,0.1)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    <span className="text-[9px] font-mono tracking-[2px] uppercase" style={{ color: "#a855f7" }}>Dual Engine Active</span>
                  </div>
                  <div className="text-[11px] leading-[1.6]" style={{ color: "rgba(238,234,226,0.45)" }}>
                    <span style={{ color: "#a855f7" }}>⚡ Elsa x402</span> — Live portfolio, token prices, yields, gas, wallet analysis<br/>
                    <span style={{ color: "#00f0ff" }}>🧠 AI Advisor</span> — Strategy, tokenomics, GTM, competitive analysis
                  </div>
                </div>
                <div className="h-2" />
                <div className="mb-1"><strong className="text-ivory font-semibold">1.</strong> What&apos;s your biggest concern — tokenomics, tech, or GTM?</div>
                <div className="mb-1"><strong className="text-ivory font-semibold">2.</strong> Want me to analyze competitors with live market data?</div>
                <div className="mb-1"><strong className="text-ivory font-semibold">3.</strong> Should I suggest yield strategies for your treasury?</div>
                {process.env.NEXT_PUBLIC_XMTP_AGENT_ADDRESS && (
                  <div className="mt-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(238,234,226,0.3)" }}>
                      <span style={{ color: "#fc4f37" }}>📬</span> Also available via <a href={`https://xmtp.chat/dm/${process.env.NEXT_PUBLIC_XMTP_AGENT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="underline hover:brightness-150" style={{ color: "#fc4f37" }}>XMTP</a> — end-to-end encrypted, from any Web3 wallet
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {msgs.map((m,i) => (
          <div key={m.id} className={`flex mb-4 ${m.role==="user"?"justify-end":"justify-start"}`} style={{ animation: i===msgs.length-1?"fadeIn 0.4s ease-out":"none" }}>
            <div className={`max-w-[82%] p-4 px-5 rounded-[14px] ${m.role==="user"?"rounded-br-[4px] bg-accent-muted border border-accent-border":"rounded-bl-[4px] bg-surface border border-border"}`}>
              <div className="text-sm text-ivory-muted leading-relaxed">{renderText(m.content)}</div>
              {/* Source badge */}
              {m.role === "assistant" && m.source && (
                <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {m.source === "elsa" ? (
                    <>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      <span className="text-[8px] font-mono tracking-[1.5px] uppercase" style={{ color: "rgba(168,85,247,0.5)" }}>
                        Live on-chain data · Elsa x402
                      </span>
                    </>
                  ) : (
                    <>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                      <span className="text-[8px] font-mono tracking-[1.5px] uppercase" style={{ color: "rgba(0,240,255,0.35)" }}>
                        AI Strategy Advisor
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex mb-4">
            <div className="inline-flex items-center gap-3 p-3.5 px-5 rounded-[14px] rounded-bl-[4px] bg-surface border border-border">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-ivory-dim" style={{ animation:`dotPulse 1.4s ease-in-out ${i*0.16}s infinite` }}/>)}
              </div>
              <span className="text-[9px] font-mono tracking-wider" style={{ color: "rgba(168,85,247,0.35)" }}>fetching live data...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts — x402 flavored */}
      {msgs.length === 0 && (
        <div className="max-w-3xl w-full mx-auto px-7 pb-3">
          <div className="flex gap-1.5 flex-wrap">{prompts.map(q => (
            <button key={q.text} onClick={() => setInput(q.text)}
              className="px-3.5 py-2 rounded-full text-xs border text-ivory-muted hover:text-accent transition-all flex items-center gap-1.5"
              style={{
                background: q.icon === "⚡" ? "rgba(168,85,247,0.03)" : "rgba(255,255,255,0.02)",
                borderColor: q.icon === "⚡" ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.06)",
              }}>
              <span>{q.icon}</span> {q.text}
            </button>
          ))}</div>
        </div>
      )}

      {/* Input bar */}
      <div className="sticky bottom-0 bg-bg border-t border-border">
        <div className="max-w-3xl w-full mx-auto px-7 py-4 flex gap-2.5">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&send()}
            placeholder={`Ask about ${idea?.name||"your project"} (backed by live on-chain data)...`}
            className="flex-1 px-4 py-3.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-border text-ivory text-sm outline-none focus:border-accent-border" />
          <button onClick={send} disabled={!input.trim()||typing}
            className="w-12 h-12 rounded-lg flex items-center justify-center transition-all"
            style={{ background: input.trim()&&!typing?"#00f0ff":"rgba(255,255,255,0.03)", color: input.trim()&&!typing?"#06060a":"rgba(238,234,226,0.25)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
          </button>
        </div>
        {/* Footer co-brand */}
        <div className="max-w-3xl w-full mx-auto px-7 pb-3 flex items-center justify-center gap-2">
          <span className="text-[8px] font-mono tracking-[2px] uppercase" style={{ color: "rgba(238,234,226,0.12)" }}>ValidFi</span>
          <span className="text-[8px]" style={{ color: "rgba(238,234,226,0.06)" }}>×</span>
          <a href="https://x402.heyelsa.ai" target="_blank" rel="noopener noreferrer"
            className="text-[8px] font-mono tracking-[2px] uppercase hover:brightness-150 transition-all" style={{ color: "rgba(168,85,247,0.25)" }}>
            Elsa x402
          </a>
          <span className="text-[8px]" style={{ color: "rgba(238,234,226,0.06)" }}>×</span>
          <a href="https://xmtp.org" target="_blank" rel="noopener noreferrer"
            className="text-[8px] font-mono tracking-[2px] uppercase hover:brightness-150 transition-all" style={{ color: "rgba(252,79,55,0.25)" }}>
            XMTP
          </a>
        </div>
      </div>
    </div>
  );
}
