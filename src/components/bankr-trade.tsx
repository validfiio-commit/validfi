"use client";

import { useState } from "react";

interface BankrTradeProps {
  tokenSymbol: string;
  tokenAddress: string;
  tokenName: string;
  bankrUrl?: string;
  score?: number;
}

export function BankrTrade({ tokenSymbol, tokenAddress, tokenName, bankrUrl, score }: BankrTradeProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [amount, setAmount] = useState("50");

  const commands = [
    {
      label: "Buy on X",
      cmd: `@bankrbot buy $${amount} of ${tokenAddress}`,
      platform: "X (Twitter)",
      icon: "𝕏",
    },
    {
      label: "Buy on Farcaster",
      cmd: `/bankr buy $${amount} of ${tokenAddress}`,
      platform: "Farcaster",
      icon: "🟪",
    },
    {
      label: "Check Price",
      cmd: `@bankrbot price ${tokenAddress}`,
      platform: "X (Twitter)",
      icon: "📊",
    },
  ];

  const copy = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const tokenUrl = bankrUrl || `https://bankr.bot/launches/${tokenAddress}`;

  return (
    <div className="rounded-xl bg-[#0c0c12] border border-[rgba(255,255,255,0.06)] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[rgba(0,200,83,0.1)] border border-[rgba(0,200,83,0.2)] flex items-center justify-center text-xs">🏦</div>
          <span className="text-sm font-semibold">Trade via Bankr</span>
          <span className="text-[9px] font-mono text-[#5a5652] tracking-wider">POWERED BY BANKRBOT</span>
        </div>
        <a href={tokenUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[#00f0ff] hover:underline">
          View on Bankr ↗
        </a>
      </div>

      <div className="px-5 py-4">
        {/* Token bar */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.08)]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-[#00f0ff]">${tokenSymbol}</span>
            <span className="text-xs text-[#9a9590]">{tokenName}</span>
          </div>
          <div className="flex items-center gap-2">
            {score && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(0,240,255,0.08)] text-[#00f0ff]">
                Score: {score}
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(168,85,247,0.08)] text-[#a855f7]">Base</span>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <div className="text-[9px] font-mono text-[#5a5652] tracking-[2px] uppercase mb-2">Trade Amount (USD)</div>
          <div className="flex gap-2">
            {["25", "50", "100", "250"].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  amount === val
                    ? "bg-[#00f0ff] text-[#06060a] font-bold"
                    : "bg-[#111118] text-[#9a9590] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,240,255,0.2)]"
                }`}
              >
                ${val}
              </button>
            ))}
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-20 px-3 py-1.5 rounded-md bg-[#111118] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[#e8e4dd] text-center focus:border-[rgba(0,240,255,0.3)] focus:outline-none"
              placeholder="Custom"
            />
          </div>
        </div>

        {/* Commands */}
        <div className="space-y-2 mb-4">
          {commands.map((c) => (
            <div key={c.label} className="flex items-center gap-3 p-3 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-all">
              <span className="text-base shrink-0">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[#5a5652] mb-0.5">{c.platform}</div>
                <code className="text-xs font-mono text-[#e8e4dd] block truncate">{c.cmd}</code>
              </div>
              <button
                onClick={() => copy(c.cmd, c.label)}
                className={`shrink-0 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                  copied === c.label
                    ? "bg-[rgba(52,211,153,0.1)] text-[#34d399] border border-[rgba(52,211,153,0.2)]"
                    : "bg-[rgba(0,240,255,0.06)] text-[#00f0ff] border border-[rgba(0,240,255,0.1)] hover:bg-[rgba(0,240,255,0.1)]"
                }`}
              >
                {copied === c.label ? "✓ Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-2 pt-3 border-t border-[rgba(255,255,255,0.04)]">
          <a href={tokenUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-lg bg-[rgba(0,200,83,0.08)] border border-[rgba(0,200,83,0.15)] text-[10px] font-mono font-bold text-[#34d399] text-center hover:bg-[rgba(0,200,83,0.12)] transition-all">
            🏦 Bankr
          </a>
          <a href={`https://app.uniswap.org/explore/tokens/base/${tokenAddress}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)] text-[10px] font-mono font-bold text-[#a855f7] text-center hover:bg-[rgba(168,85,247,0.12)] transition-all">
            🦄 Uniswap
          </a>
          <a href={`https://basescan.org/token/${tokenAddress}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-lg bg-[#111118] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono font-bold text-[#9a9590] text-center hover:text-[#e8e4dd] transition-all">
            📋 Basescan
          </a>
        </div>

        <p className="text-[9px] text-[#5a5652] text-center mt-3 font-mono">
          Paste commands on X or Farcaster · Creator earns 57% of swap fees
        </p>
      </div>
    </div>
  );
}

/**
 * Compact inline version for dashboard rows
 */
export function BankrTradeInline({ tokenSymbol, tokenAddress, bankrUrl }: {
  tokenSymbol: string;
  tokenAddress: string;
  bankrUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const cmd = `@bankrbot buy $50 of ${tokenAddress}`;

  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); copy(); }}
        className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all ${
          copied
            ? "bg-[rgba(52,211,153,0.08)] text-[#34d399] border border-[rgba(52,211,153,0.15)]"
            : "bg-[rgba(0,200,83,0.06)] text-[#34d399] border border-[rgba(0,200,83,0.1)] hover:bg-[rgba(0,200,83,0.1)]"
        }`}
      >
        {copied ? "✓ Copied" : `🏦 Copy trade cmd`}
      </button>
      <a
        href={bankrUrl || `https://bankr.bot/launches/${tokenAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="px-2.5 py-1 rounded-md bg-[rgba(0,200,83,0.06)] border border-[rgba(0,200,83,0.1)] text-[10px] font-mono text-[#34d399] hover:bg-[rgba(0,200,83,0.1)] transition-all"
      >
        Bankr ↗
      </a>
    </div>
  );
}
