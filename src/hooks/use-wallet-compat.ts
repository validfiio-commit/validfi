"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useConnect } from "wagmi";

export function useWalletCompat() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [miniAppAuthDone, setMiniAppAuthDone] = useState(false);

  const { context } = useMiniKit();
  const isMiniApp = !!context;

  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // ─── Debug: log context on mount ───
  useEffect(() => {
    console.log("[WalletCompat] isMiniApp:", isMiniApp);
    console.log("[WalletCompat] context:", context);
    console.log("[WalletCompat] wagmiAddress:", wagmiAddress);
    console.log("[WalletCompat] wagmiConnected:", wagmiConnected);
    console.log("[WalletCompat] connectors:", connectors.map((c) => c.name));
  }, [isMiniApp, context, wagmiAddress, wagmiConnected, connectors]);

  // ─── Check existing JWT session on mount ───
  useEffect(() => {
    fetch("/api/auth", { method: "GET" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.wallet) {
          console.log("[WalletCompat] Existing session found:", d.wallet);
          setAddress(d.wallet);
        }
      })
      .catch(() => {});
  }, []);

  // ─── Mini app: auto-auth when wagmi connects (NO signature required) ───
  useEffect(() => {
    if (!isMiniApp || !wagmiAddress || address || miniAppAuthDone) return;

    const wallet = wagmiAddress.toLowerCase();
    setMiniAppAuthDone(true);
    setConnecting(true);

    console.log("[WalletCompat] Mini app auto-auth starting for:", wallet);

    fetch("/api/auth/miniapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet,
        fid: context?.user?.fid || null,
        username: context?.user?.username || null,
        displayName: context?.user?.displayName || null,
      }),
    })
      .then((res) => {
        console.log("[WalletCompat] Mini app auth response:", res.status);
        if (res.ok) return res.json();
        throw new Error(`Auth failed: ${res.status}`);
      })
      .then((data) => {
        console.log("[WalletCompat] ✅ Mini app auth success:", data);
        setAddress(data.wallet || wallet);
      })
      .catch((err) => {
        console.error("[WalletCompat] ❌ Mini app auth error:", err);
      })
      .finally(() => {
        setConnecting(false);
      });
  }, [isMiniApp, wagmiAddress, address, miniAppAuthDone, context]);

  // ─── Connect ───
  const connect = useCallback(async () => {
    if (isMiniApp) {
      console.log("[WalletCompat] Mini app connect. wagmiConnected:", wagmiConnected);
      if (!wagmiConnected && connectors.length > 0) {
        console.log("[WalletCompat] Triggering wagmi connect with:", connectors[0].name);
        wagmiConnect({ connector: connectors[0] });
      }
      // Auto-auth useEffect fires once wagmiAddress populates
      return;
    }

    // ─── Standalone: original MetaMask flow ───
    if (!(window as any).ethereum) {
      alert("Please install MetaMask to use ValidFi");
      return;
    }
    setConnecting(true);
    try {
      const provider = (window as any).ethereum;
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const wallet = accounts[0].toLowerCase();

      // Nonce signing for standalone mode
      const nonceRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nonce", wallet }),
      });
      const { message } = await nonceRes.json();

      const signature = await provider.request({
        method: "personal_sign",
        params: [message, wallet],
      });

      const verifyRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", wallet, signature }),
      });

      if (verifyRes.ok) {
        setAddress(wallet);
      } else {
        const text = await verifyRes.text();
        try {
          const err = JSON.parse(text);
          alert(err.error || "Verification failed");
        } catch {
          alert("Verification failed: " + (text || verifyRes.statusText));
        }
      }
    } catch (err: any) {
      if (err.code !== 4001) console.error("Connect error:", err);
    } finally {
      setConnecting(false);
    }
  }, [isMiniApp, wagmiConnected, connectors, wagmiConnect]);

  // ─── Disconnect ───
  const disconnect = useCallback(async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAddress(null);
    setMiniAppAuthDone(false);
  }, []);

  return {
    address,
    connecting,
    connect,
    disconnect,
    shortAddr,
    isMiniApp,
    farcasterUser: context?.user ?? null,
  };
}
