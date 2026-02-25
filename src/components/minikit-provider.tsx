"use client";

import { ReactNode } from "react";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { base } from "wagmi/chains";

export function MiniKitContextProvider({ children }: { children: ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: "dark",
          theme: "default",
          name: process.env.NEXT_PUBLIC_APP_NAME || "ValidFi",
          logo: `${process.env.NEXT_PUBLIC_URL}/validfi_logo.PNG`,
        },
      }}
    >
      {children}
    </MiniKitProvider>
  );
}