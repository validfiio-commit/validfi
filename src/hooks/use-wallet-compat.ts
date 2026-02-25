"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useConnect, useSignMessage } from "wagmi";

export function useWalletCompat() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);

  const { context } = useMiniKit();
  const isMiniApp = !!context;

  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // ─── Check existing JWT session on mount ───
  useEffect(() => {
    fetch("/api/auth", { method: "GET" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.wallet) setAddress(d.wallet);
      })
      .catch(() => {});
  }, []);

  // ─── Mini app: auto-auth when wagmi connects ───
  // Uses a dedicated /api/auth/miniapp endpoint that doesn't require signing.
  // The user is already authenticated by the Base App / Farcaster client.
  useEffect(() => {
    if (!isMiniApp || !wagmiAddress || address || authAttempted) return;

    const wallet = wagmiAddress.toLowerCase();
    setAuthAttempted(true);

    (async () => {
      try {
        setConnecting(true);
        console.log("[MiniApp Auth] Attempting auth for wallet:", wallet, "fid:", context?.user?.fid);

        const res = await fetch("/api/auth/miniapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet,
            fid: context?.user?.fid || null,
            username: context?.user?.username || null,
            displayName: context?.user?.displayName || null,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setAddress(data.wallet || wallet);
          console.log("[MiniApp Auth] Success:", wallet);
        } else {
          const text = await res.text();
          console.error("[MiniApp Auth] Failed:", text);

          // Fallback: try nonce signing if miniapp endpoint doesn't exist
          try {
            await authWithNonceSigning(wallet);
          } catch (signErr) {
            console.error("[MiniApp Auth] Nonce signing fallback also failed:", signErr);
          }
        }
      } catch (err) {
        console.error("[MiniApp Auth] Error:", err);
      } finally {
        setConnecting(false);
      }
    })();
  }, [isMiniApp, wagmiAddress, address, authAttempted, context]);

  // ─── Nonce-signing auth (standalone MetaMask flow) ───
  const authWithNonceSigning = async (wallet: string) => {
    const nonceRes = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "nonce", wallet }),
    });
    const { message } = await nonceRes.json();

    let signature: string;
    if (isMiniApp) {
      signature = await signMessageAsync({ message });
    } else {
      const provider = (window as any).ethereum;
      signature = await provider.request({
        method: "personal_sign",
        params: [message, wallet],
      });
    }

    const verifyRes = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", wallet, signature }),
    });

    if (verifyRes.ok) {
      setAddress(wallet);
    } else {
      throw new Error("Verification failed");
    }
  };

  // ─── Connect ───
  const connect = useCallback(async () => {
    if (isMiniApp) {
      if (!wagmiConnected && connectors.length > 0) {
        wagmiConnect({ connector: connectors[0] });
      }
      // Auto-auth useEffect handles the rest once wagmiAddress populates
      return;
    }

    // Standalone MetaMask flow
    if (!(window as any).ethereum) {
      alert("Please install MetaMask to use ValidFi");
      return;
    }
    setConnecting(true);
    try {
      const provider = (window as any).ethereum;
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const wallet = accounts[0].toLowerCase();
      await authWithNonceSigning(wallet);
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
    setAuthAttempted(false);
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
