import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Contract address on Base (set after deployment)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VALIDFI_NFT_CONTRACT || "";

// Contract ABI — only mint function needed
const MINT_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "ideaId", type: "string" },
      { name: "projectName", type: "string" },
      { name: "category", type: "string" },
      { name: "chain", type: "string" },
      { name: "overallScore", type: "uint8" },
      { name: "verdict", type: "string" },
      { name: "marketScore", type: "uint8" },
      { name: "tokenomicsScore", type: "uint8" },
      { name: "techScore", type: "uint8" },
      { name: "executionScore", type: "uint8" },
      { name: "timingScore", type: "uint8" },
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "string" },
    ],
    name: "mintedReports",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idea = await prisma.idea.findFirst({
    where: { id: params.id, userId: user.id, status: "COMPLETED" },
  });
  if (!idea || !idea.report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const r = idea.report as any;

  return NextResponse.json({
    contractAddress: CONTRACT_ADDRESS,
    abi: MINT_ABI,
    chainId: 8453, // Base mainnet
    args: [
      user.wallet,                         // to
      idea.id,                             // ideaId
      idea.name,                           // projectName
      idea.category,                       // category
      idea.chain || "N/A",                 // chain
      Math.min(r.overall_score || 0, 255), // overallScore (uint8)
      r.verdict || "CAUTIOUS",             // verdict
      Math.min(r.scores?.market || 0, 255),
      Math.min(r.scores?.tokenomics || 0, 255),
      Math.min(r.scores?.tech || 0, 255),
      Math.min(r.scores?.team_execution || 0, 255),
      Math.min(r.scores?.timing || 0, 255),
    ],
    // For display
    projectName: idea.name,
    score: r.overall_score,
    verdict: r.verdict,
    mintedTxHash: idea.mintTxHash || null,
    mintTokenId: idea.mintTokenId || null,
  });
}

// Save mint transaction after user mints
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { txHash, tokenId } = await req.json();
  if (!txHash) return NextResponse.json({ error: "Missing txHash" }, { status: 400 });

  await prisma.idea.updateMany({
    where: { id: params.id, userId: user.id },
    data: { mintTxHash: txHash, mintTokenId: tokenId?.toString() || null },
  });

  return NextResponse.json({ success: true });
}
