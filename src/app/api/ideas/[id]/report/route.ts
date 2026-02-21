import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/gemini";
import { fetchWalletIntelligence, isStale } from "@/lib/x402";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const idea = await prisma.idea.findFirst({ where: { id: id, userId: user.id } });
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let walletData = user.walletData as any;
  if (!walletData || (user.walletFetched && isStale(user.walletFetched))) {
    const fresh = await fetchWalletIntelligence(user.wallet);
    if (fresh) {
      walletData = fresh;
      await prisma.user.update({ where: { id: user.id }, data: { walletData: fresh as any, walletFetched: new Date() } });
    }
  }

  await prisma.idea.update({ where: { id: idea.id }, data: { status: "ANALYZING" } });
  try {
    const report = await generateReport(idea, walletData);
    const updated = await prisma.idea.update({ where: { id: idea.id }, data: { report: report as any, status: "COMPLETED" } });
    return NextResponse.json(updated);
  } catch (err: any) {
    await prisma.idea.update({ where: { id: idea.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
