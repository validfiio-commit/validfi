import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/gemini";
import { fetchWalletIntelligence, isStale } from "@/lib/x402";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ideas = await prisma.idea.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ideas);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name || !body.category || !body.problem || !body.solution) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const idea = await prisma.idea.create({
    data: {
      userId: user.id,
      name: body.name,
      oneLiner: body.oneLiner || null,
      category: body.category,
      problem: body.problem,
      solution: body.solution,
      chain: body.chain || null,
      tokenModel: body.tokenModel || null,
      stage: body.stage || "idea",
      competitors: body.competitors || null,
      audience: body.audience || null,
      status: "ANALYZING",
    },
  });

  // Fetch wallet intelligence (cached or fresh)
  let walletData = user.walletData as any;
  if (!walletData || (user.walletFetched && isStale(user.walletFetched))) {
    const fresh = await fetchWalletIntelligence(user.wallet);
    if (fresh) {
      walletData = fresh;
      await prisma.user.update({
        where: { id: user.id },
        data: { walletData: fresh as any, walletFetched: new Date() },
      });
    }
  }

  try {
    const report = await generateReport(body, walletData);
    const updated = await prisma.idea.update({
      where: { id: idea.id },
      data: { report: report as any, status: "COMPLETED" },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    await prisma.idea.update({ where: { id: idea.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: err.message, ideaId: idea.id }, { status: 500 });
  }
}
