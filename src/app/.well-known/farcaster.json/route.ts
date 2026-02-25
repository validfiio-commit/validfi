export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://validfi.io";

  const manifest = {
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || "",
      payload: process.env.FARCASTER_PAYLOAD || "",
      signature: process.env.FARCASTER_SIGNATURE || "",
    },
    miniapp: {
      version: "1",
      name: "ValidFi",
      subtitle: "Validate Before You Build",
      description:
        "AI-powered Web3 project validation. Submit your idea, get institutional-grade analysis, and mint your score card as an NFT on Base.",
      iconUrl: `${appUrl}/validfi_logo.png`,
      homeUrl: appUrl,
      splashImageUrl: `${appUrl}/validfi_logo.png`,
      splashBackgroundColor: "#06060a",
      webhookUrl: `${appUrl}/api/webhook`,
      primaryCategory: "developer-tools",
      tags: ["web3", "validation", "AI", "base", "tokenomics"],
      heroImageUrl: `${appUrl}/og-image.png`,
      screenshotUrls: [
        `${appUrl}/screenshots/dashboard.png`,
        `${appUrl}/screenshots/report.png`,
        `${appUrl}/screenshots/scorecard.png`,
      ],
      tagline: "Start validating ideas",
      ogTitle: "ValidFi — Validate Web3 Ideas",
      ogDescription:
        "Submit your Web3 idea and get an institutional-grade validation report in under 5 minutes.",
      ogImageUrl: `${appUrl}/og-image.png`,
    },
  };

  return Response.json(manifest);
}