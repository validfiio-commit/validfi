import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithAdvisor } from "@/lib/gemini";
import {
  fetchWalletIntelligence, isStale, detectIntent, extractTokenFromMessage, extractChainFromMessage,
  elsaGetPortfolio, elsaGetTokenPrice, elsaGetYields, elsaGetGas, elsaAnalyzeWallet,
} from "@/lib/x402";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const idea = await prisma.idea.findFirst({ where: { id: id, userId: user.id } });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await prisma.chatMessage.findMany({ where: { ideaId: id }, orderBy: { createdAt: "asc" }, take: 100 });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const idea = await prisma.idea.findFirst({ where: { id: id, userId: user.id } });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  await prisma.chatMessage.create({ data: { ideaId: id, role: "user", content: message } });

  // ─── Smart Router: detect intent ───
  const intent = detectIntent(message);
  let response = "";
  let source: "elsa" | "gemini" | "both" = "gemini";

  try {
    if (intent === "portfolio") {
      // Direct Elsa call — real portfolio data
      response = await elsaGetPortfolio(user.wallet);
      source = "elsa";

    } else if (intent === "price") {
      // Direct Elsa call — real token price
      const token = extractTokenFromMessage(message);
      response = await elsaGetTokenPrice(token);
      source = "elsa";

    } else if (intent === "yield") {
      // Direct Elsa call — real yield data
      response = await elsaGetYields(user.wallet);
      source = "elsa";

    } else if (intent === "gas") {
      // Direct Elsa call — real gas price
      const chain = extractChainFromMessage(message, idea.chain);
      response = await elsaGetGas(chain);
      source = "elsa";

    } else if (intent === "analyze_wallet") {
      // Direct Elsa call — wallet analysis
      response = await elsaAnalyzeWallet(user.wallet);
      source = "elsa";

    } else {
      // Strategy/advice → Gemini with cached wallet context
      let walletData = user.walletData as any;
      if (!walletData || (user.walletFetched && isStale(user.walletFetched))) {
        const fresh = await fetchWalletIntelligence(user.wallet);
        if (fresh) {
          walletData = fresh;
          await prisma.user.update({ where: { id: user.id }, data: { walletData: fresh as any, walletFetched: new Date() } });
        }
      }

      const history = await prisma.chatMessage.findMany({ where: { ideaId: id }, orderBy: { createdAt: "asc" }, take: 50 });
      const apiHistory = history.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

      response = await chatWithAdvisor(idea, idea.report, apiHistory.slice(0, -1), message, user.wallet, walletData);
      source = "gemini";
    }

    const saved = await prisma.chatMessage.create({ data: { ideaId: id, role: "assistant", content: response } });
    return NextResponse.json({ role: "assistant", content: response, id: saved.id, source });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
