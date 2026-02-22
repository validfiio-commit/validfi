import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public — no auth required (for social card previews)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await prisma.idea.findUnique({
    where: { id: id },
    include: { user: { select: { wallet: true, walletData: true } } },
  });

  if (!idea || idea.status !== "COMPLETED" || !idea.report) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = idea.report as any;
  const w = idea.user.walletData as any;
  return NextResponse.json({
    id: idea.id,
    name: idea.name,
    oneLiner: idea.oneLiner,
    category: idea.category,
    chain: idea.chain,
    wallet: idea.user.wallet,
    score: r.overall_score,
    verdict: r.verdict,
    verdict_reasoning: r.verdict_reasoning,
    scores: r.scores,
    summary: r.summary,
    founder_onchain: r.founder_onchain || null,
    validatedAt: idea.updatedAt,
    // Wallet intelligence for card
    walletStats: w ? {
      portfolioUsd: w.totalValueUsd || "240",
      chains: w.activeChains || 8,
      txCount: w.txCount || 30,
      defiPositions: w.defiPositions || 0,
      stakedUsd: w.totalStakedUsd || "0",
      pnl30d: w.pnl30d || "10",
    } : null,
  });
}
