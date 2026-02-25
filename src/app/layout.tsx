import type { Metadata } from "next";
import "./globals.css";
import { MiniKitContextProvider } from "@/components/minikit-provider";

const appUrl = process.env.NEXT_PUBLIC_URL || "https://validfi.io";

// Embed metadata for when your URL is shared in Farcaster/Base App
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "ValidFi — Validate Web3 Ideas Before You Build",
    description:
      "AI-powered Web3 project validation. Connect wallet, submit your idea, get institutional-grade analysis.",
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: `${appUrl}/og-image.png`,
        button: {
          title: "Validate Your Idea",
          action: {
            type: "launch_miniapp",
            name: "ValidFi",
            url: appUrl,
            splashImageUrl: `${appUrl}/validfi_logo.PNG`,
            splashBackgroundColor: "#06060a",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="699ef86e444bc92883920614" />
      </head>
      <body className="grain">
        <MiniKitContextProvider>{children}</MiniKitContextProvider>
      </body>
    </html>
  );
}