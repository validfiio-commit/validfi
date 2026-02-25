// hooks/use-wallet-compat.ts
"use client";

import { useAccount, useConnect } from "wagmi";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function useWalletCompat() {
  const { address, isConnecting, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { context } = useMiniKit();

  const isMiniApp = !!context;

  return {
    address: address ?? null,
    connecting: isConnecting,
    connected: isConnected,
    isMiniApp,
    farcasterUser: context?.user,
    connect: () => {
      // In mini app context, the wallet is auto-connected via the Farcaster connector
      // In standalone, trigger the first available connector
      if (!isConnected && connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
    },
  };
}