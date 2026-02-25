"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useConnect, useSignMessage } from "wagmi";

/**
 * Drop-in replacement for useWallet() from wallet-provider.tsx.
 *
 * Detects whether we're running inside a mini app (Base App / Farcaster)
 * or standalone browser, and uses the appropriate auth flow:
 *
 * - Mini app:   Wallet comes from MiniKit's wagmi connector (auto-connected).
 *               We still call /api/auth to create the JWT session so your
 *               backend works identically.
 *
 * - Standalone: Falls back to your original MetaMask flow with nonce signing.
 */
export function useWalletCompat() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // MiniKit context — only populated inside Base App / Farcaster
  const { context } = useMiniKit();
  const isMiniApp = !!context;

  // Wagmi hooks — used in mini app mode where MiniKitProvider configures the connector
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // ─── Nonce-signing auth (shared by both flows) ───
  const authWithNonceSigning = useCallback(
    async (wallet: string, useMiniAppSigner: boolean) => {
      // 1. Get nonce
      const nonceRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "nonce", wallet }),
      });
      const { message } = await nonceRes.json();

      // 2. Sign — wagmi signer in mini app, raw MetaMask otherwise
      let signature: string;
      if (useMiniAppSigner) {
        signature = await signMessageAsync({ message });
      } else {
        const provider = (window as any).ethereum;
        signature = await provider.request({
          method: "personal_sign",
          params: [message, wallet],
        });
      }

      // 3. Verify & get JWT cookie
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
          console.error(err.error || "Verification failed");
        } catch {
          console.error("Verification failed:", text || verifyRes.statusText);
        }
      }
    },
    [signMessageAsync]
  );

  // ─── Check existing JWT session on mount (same as original) ───
  useEffect(() => {
    fetch("/api/auth", { method: "GET" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.wallet) setAddress(d.wallet);
      })
      .catch(() => {});
  }, []);

  // ─── Mini app: auto-auth once wagmi connects via Farcaster connector ───
  useEffect(() => {
    if (!isMiniApp || !wagmiAddress || address) return;

    const wallet = wagmiAddress.toLowerCase();

    (async () => {
      try {
        setConnecting(true);
        await authWithNonceSigning(wallet, true);
      } catch (err) {
        console.error("Mini app auto-auth error:", err);
      } finally {
        setConnecting(false);
      }
    })();
  }, [isMiniApp, wagmiAddress, address, authWithNonceSigning]);

  // ─── Connect: branch by context ───
  const connect = useCallback(async () => {
    if (isMiniApp) {
      // In mini app, wallet should already be connected. If not, trigger wagmi.
      if (!wagmiConnected && connectors.length > 0) {
        wagmiConnect({ connector: connectors[0] });
      }
      // The useEffect above handles auth once wagmiAddress populates.
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
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      const wallet = accounts[0].toLowerCase();
      await authWithNonceSigning(wallet, false);
    } catch (err: any) {
      if (err.code !== 4001) {
        console.error("Connect error:", err);
      }
    } finally {
      setConnecting(false);
    }
  }, [isMiniApp, wagmiConnected, connectors, wagmiConnect, authWithNonceSigning]);

  // ─── Disconnect (same as original) ───
  const disconnect = useCallback(async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setAddress(null);
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