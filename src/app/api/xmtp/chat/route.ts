import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatWithAdvisor } from "@/lib/gemini";
import {
  detectIntent, extractTokenFromMessage, extractChainFromMessage,
  elsaGetPortfolio, elsaGetTokenPrice, elsaGetYields, elsaGetGas, elsaAnalyzeWallet,
  fetchWalletIntelligence,
} from "@/lib/x402";

// Endpoint for XMTP agent to call
export async function POST(req: NextRequest) {
  // Auth check — only XMTP agent should call this
  const secret = req.headers.get("x-xmtp-secret");
  if (secret !== (process.env.XMTP_API_SECRET || "validfi-xmtp-secret")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { walletAddress, message, history } = await req.json();
  if (!walletAddress || !message) {
    return NextResponse.json({ error: "Missing walletAddress or message" }, { status: 400 });
  }

  // Find user and their latest project
  const user = await prisma.user.findUnique({ where: { wallet: walletAddress.toLowerCase() } });
  const latestIdea = user
    ? await prisma.idea.findFirst({
        where: { userId: user.id, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
      })
    : null;

  // Smart routing — same logic as web chat
  const intent = detectIntent(message);
  let response = "";
  let source: "elsa" | "gemini" = "gemini";

  try {
    if (intent === "portfolio") {
      response = await elsaGetPortfolio(walletAddress);
      source = "elsa";
    } else if (intent === "price") {
      const token = extractTokenFromMessage(message);
      response = await elsaGetTokenPrice(token);
      source = "elsa";
    } else if (intent === "yield") {
      response = await elsaGetYields(walletAddress);
      source = "elsa";
    } else if (intent === "gas") {
      const chain = extractChainFromMessage(message, latestIdea?.chain || null);
      response = await elsaGetGas(chain);
      source = "elsa";
    } else if (intent === "analyze_wallet") {
      response = await elsaAnalyzeWallet(walletAddress);
      source = "elsa";
    } else if (latestIdea) {
      // Strategy advice with project context
      let walletData = user?.walletData as any;
      if (!walletData && user) {
        walletData = await fetchWalletIntelligence(walletAddress);
      }

      const chatHistory = (history || []).map((h: string) => {
        const isUser = h.startsWith("User:");
        return { role: isUser ? "user" : "assistant", content: h.replace(/^(User|Assistant):\s*/, "") };
      });

      response = await chatWithAdvisor(
        latestIdea, latestIdea.report, chatHistory, message,
        walletAddress, walletData
      );
      source = "gemini";
    } else {
      // No project — welcome message
      response = `Welcome to **ValidFi** on XMTP! 🚀\n\nI'm your Web3 AI advisor. I can help with:\n\n⚡ **Live data** — "show my portfolio", "price of ETH", "best yields"\n🧠 **Strategy** — tokenomics, GTM, competitive analysis\n\nTo get personalized project advice, visit **validfi.com** and submit your idea first. Then come back here and I'll have full context on your project!\n\nWhat would you like to know?`;
      source = "gemini";
    }

    return NextResponse.json({ response, source });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
