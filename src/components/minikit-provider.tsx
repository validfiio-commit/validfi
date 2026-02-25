"use client";

import { ReactNode } from "react";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { base } from "wagmi/chains";

/**
 * Wraps the app with MiniKitProvider which provides:
 * - Farcaster SDK context (user, client info) when inside a mini app
 * - wagmi + react-query providers (auto-configured)
 * - Farcaster connector when in mini app, CoinbaseWallet fallback otherwise
 *
 * This replaces the old WalletProvider in layout.tsx.
 * The actual auth logic (nonce signing, JWT) lives in useWalletCompat.
 */
export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "dark",
          theme: "default",
          name: "ValidFi",
          logo: `${process.env.NEXT_PUBLIC_URL || "https://validfi.io"}/validfi_logo.PNG`,
        },
      }}
    >
      {children}
    </MiniKitProvider>
  );
}