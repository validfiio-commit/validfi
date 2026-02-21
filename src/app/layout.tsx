import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";

export const metadata: Metadata = {
  title: "ValidFi — Validate Web3 Ideas Before You Build",
  description: "AI-powered Web3 project validation. Connect wallet, submit your idea, get institutional-grade analysis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
