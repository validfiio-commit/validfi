"use client";

import { ReactNode } from "react";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "viem/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet } from "wagmi/connectors";

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    coinbaseWallet({ appName: "ValidFi" }),
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
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
          miniKit={{
            enabled: true,
            autoConnect: true,
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}