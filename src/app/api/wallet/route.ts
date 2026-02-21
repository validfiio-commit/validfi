import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchWalletIntelligence, isStale } from "@/lib/x402";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return cached data if fresh
  if (user.walletData && user.walletFetched && !isStale(user.walletFetched)) {
    return NextResponse.json({ data: user.walletData, cached: true });
  }

  // Fetch fresh data from x402
  const data = await fetchWalletIntelligence(user.wallet);

  if (data) {
    // Cache it
    await prisma.user.update({
      where: { id: user.id },
      data: { walletData: data as any, walletFetched: new Date() },
    });
    return NextResponse.json({ data, cached: false });
  }

  // Return stale cache if x402 fails
  if (user.walletData) {
    return NextResponse.json({ data: user.walletData, cached: true, stale: true });
  }

  return NextResponse.json({ data: null, message: "x402 not configured or wallet has no activity" });
}

// Force refresh
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  console.log("USER WALLET:", user.wallet);

  const data = await fetchWalletIntelligence(user.wallet);
  if (data) {
    await prisma.user.update({
      where: { id: user.id },
      data: { walletData: data as any, walletFetched: new Date() },
    });
    return NextResponse.json({ data, cached: false });
  }

  return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
}
