"use client";

import { useState, useEffect } from "react";

const BASE_CHAIN_ID = "0x2105"; // 8453 in hex

interface MintData {
  contractAddress: string;
  abi: any[];
  chainId: number;
  args: any[];
  projectName: string;
  score: number;
  verdict: string;
  mintedTxHash: string | null;
  mintTokenId: string | null;
}

export default function MintReportCard({ ideaId }: { ideaId: string }) {
  const [mintData, setMintData] = useState<MintData | null>(null);
  const [status, setStatus] = useState<"idle" | "switching" | "minting" | "confirming" | "done" | "error">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/ideas/${ideaId}/mint`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMintData(d);
          if (d.mintedTxHash) {
            setTxHash(d.mintedTxHash);
            setStatus("done");
          }
        }
      })
      .catch(() => {});
  }, [ideaId]);

  const handleMint = async () => {
    if (!mintData || !mintData.contractAddress) {
      setError("NFT contract not deployed yet");
      return;
    }

    const provider = (window as any).ethereum;
    if (!provider) {
      setError("Please install MetaMask");
      return;
    }

    setStatus("switching");
    setError("");

    try {
      // Switch to Base
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_CHAIN_ID }],
        });
      } catch (switchError: any) {
        // Chain not added — add it
        if (switchError.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: BASE_CHAIN_ID,
                chainName: "Base",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://mainnet.base.org"],
                blockExplorerUrls: ["https://basescan.org"],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      setStatus("minting");

      // Encode the mint function call
      const iface = new (await import("ethers")).Interface(mintData.abi);
      const data = iface.encodeFunctionData("mint", mintData.args);

      // Send transaction
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const tx = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: mintData.contractAddress,
            data: data,
          },
        ],
      });

      setTxHash(tx);
      setStatus("confirming");

      // Save to backend
      await fetch(`/api/ideas/${ideaId}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: tx }),
      });

      setStatus("done");
    } catch (err: any) {
      console.error("Mint error:", err);
      if (err.code === 4001) {
        setError("Transaction rejected");
      } else {
        setError(err.message || "Minting failed");
      }
      setStatus("error");
    }
  };

  if (!mintData) return null;

  return (
    <div className="mt-6">
      {status === "done" && txHash ? (
        <div className="p-4 rounded-xl" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,222,128,0.1)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-ivory">Minted on Base</div>
              <div className="text-[10px] font-mono text-ivory-dim">Soulbound Report Card NFT</div>
            </div>
          </div>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-accent hover:underline break-all"
          >
            {txHash}
          </a>
        </div>
      ) : (
        <button
          onClick={handleMint}
          disabled={status === "switching" || status === "minting" || status === "confirming"}
          className="w-full py-4 px-6 rounded-xl font-bold text-sm transition-all relative overflow-hidden group"
          style={{
            background:
              status === "idle" || status === "error"
                ? "linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)"
                : "rgba(255,255,255,0.05)",
            color: status === "idle" || status === "error" ? "#06060a" : "#eeeae2",
            border: "1px solid rgba(0,240,255,0.2)",
          }}
        >
          <div className="flex items-center justify-center gap-3">
            {/* Base logo */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill={status === "idle" || status === "error" ? "#06060a" : "rgba(0,240,255,0.2)"} />
              <text x="12" y="16" textAnchor="middle" fill={status === "idle" || status === "error" ? "#00f0ff" : "#00f0ff"} fontSize="10" fontWeight="bold" fontFamily="sans-serif">B</text>
            </svg>
            <span>
              {status === "idle" && "Mint Report Card on Base"}
              {status === "switching" && "Switching to Base..."}
              {status === "minting" && "Confirm in MetaMask..."}
              {status === "confirming" && "Confirming..."}
              {status === "error" && "Try Again — Mint on Base"}
            </span>
          </div>
          {(status === "idle" || status === "error") && (
            <div className="text-[10px] mt-1 opacity-70 font-normal">
              Soulbound NFT · On-chain score · Free (gas only ~$0.01)
            </div>
          )}
        </button>
      )}

      {error && status === "error" && (
        <div className="mt-2 text-[11px] text-red-400 font-mono text-center">{error}</div>
      )}
    </div>
  );
}
