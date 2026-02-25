import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bankrSubmitPrompt, createLaunchRecord, generateSymbol } from "@/lib/bankr";

// POST /api/launch — Submit token launch to Bankr (returns immediately)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { ideaId, tokenName, tokenSymbol, imageUrl } = body;

  if (!ideaId) {
    return NextResponse.json({ error: "ideaId is required" }, { status: 400 });
  }

  // 1. Fetch idea + verify ownership
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { launch: true },
  });

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }
  if (idea.userId !== user.id) {
    return NextResponse.json({ error: "Not your idea" }, { status: 403 });
  }

  // 2. Must be validated
  if (idea.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Idea must be validated before launching" },
      { status: 400 }
    );
  }

  // 3. Score >= 30
  const report = idea.report as any;
  const score = report?.overall_score;
  if (!score || score < 30) {
    return NextResponse.json(
      { error: `Score must be at least 30 to launch. Current: ${score || "N/A"}` },
      { status: 400 }
    );
  }

  // 4. Not already launched (allow retry on FAILED)
  if (idea.launch && idea.launch.status !== "FAILED") {
    return NextResponse.json(
      { error: "Token already launched", launch: idea.launch },
      { status: 409 }
    );
  }

  // Delete old failed record if retrying
  if (idea.launch && idea.launch.status === "FAILED") {
    await prisma.launch.delete({ where: { id: idea.launch.id } });
  }

  // 5. Build params
  const name = tokenName || idea.name;
  const symbol = (tokenSymbol || generateSymbol(idea.name))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  const scoreCardUrl = `${process.env.NEXT_PUBLIC_URL || "https://validfi.io"}/ideas/${idea.id}`;

  // 6. Build prompt
  let prompt = `launch a token called ${name} with symbol ${symbol} on Base`;
  prompt += ` with website ${scoreCardUrl}`;
  if (imageUrl) prompt += ` with image ${imageUrl}`;

  // 7. Submit to Bankr (returns immediately with jobId)
  try {
    const { jobId } = await bankrSubmitPrompt(prompt);

    // 8. Create DB record with jobId
    const launch = await createLaunchRecord({
      ideaId: idea.id,
      tokenName: name,
      tokenSymbol: symbol,
      jobId,
    });

    return NextResponse.json({
      success: true,
      launch: {
        id: launch.id,
        tokenName: launch.tokenName,
        tokenSymbol: launch.tokenSymbol,
        status: "DEPLOYING",
        jobId,
      },
    });
  } catch (err: any) {
    console.error("Bankr submit failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit launch. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/launch?ideaId=xxx — Get launch status
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ideaId = req.nextUrl.searchParams.get("ideaId");
  if (!ideaId) {
    return NextResponse.json({ error: "ideaId required" }, { status: 400 });
  }

  const launch = await prisma.launch.findUnique({ where: { ideaId } });
  return NextResponse.json({ launch: launch || null });
}
