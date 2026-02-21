"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WalletCtx {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  shortAddr: string;
}

const Ctx = createContext<WalletCtx>({
  address: null, connecting: false,
  connect: async () => {}, disconnect: () => {},
  shortAddr: "",
});

export const useWallet = () => useContext(Ctx);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  // Check existing session on mount
  useEffect(() => {
    fetch("/api/auth", { method: "GET" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.wallet) setAddress(d.wallet); })
      .catch(() => {});
  }, []);

  const connect = useCallback(async () => {
    if (!(window as any).ethereum) {
      alert("Please install MetaMask to use ValidFi");
      return;
    }
    setConnecting(true);
    try {
      const provider = (window as any).ethereum;
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const wallet = accounts[0].toLowerCase();

      // 1. Get nonce
      const nonceRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nonce", wallet }),
      });
      const { message } = await nonceRes.json();

      // 2. Sign message
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, wallet],
      });

      // 3. Verify & get JWT cookie
      const verifyRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", wallet, signature }),
      });

      if (verifyRes.ok) {
        setAddress(wallet);
      } else {
        const err = await verifyRes.json();
        alert(err.error || "Verification failed");
      }
    } catch (err: any) {
      if (err.code !== 4001) { // User rejected
        console.error("Connect error:", err);
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAddress(null);
  }, []);

  return (
    <Ctx.Provider value={{ address, connecting, connect, disconnect, shortAddr }}>
      {children}
    </Ctx.Provider>
  );
}
