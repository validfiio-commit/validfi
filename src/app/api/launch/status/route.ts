import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bankrCheckJob, parseBankrResponse, finalizeLaunch } from "@/lib/bankr";
import { prisma } from "@/lib/prisma";

// GET /api/launch/status?jobId=xxx&launchId=yyy
// Called by frontend every 3s to poll Bankr job status
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  const launchId = req.nextUrl.searchParams.get("launchId");

  if (!jobId || !launchId) {
    return NextResponse.json({ error: "jobId and launchId required" }, { status: 400 });
  }

  try {
    const job = await bankrCheckJob(jobId);

    if (job.status === "processing") {
      return NextResponse.json({ status: "processing" });
    }

    if (job.status === "failed") {
      // Update DB
      await finalizeLaunch(launchId, { success: false, error: job.error });
      return NextResponse.json({ status: "failed", error: job.error });
    }

    if (job.status === "completed" && job.response) {
      // Parse the response for token data
      const result = parseBankrResponse(job.response);

      // Update DB
      const launch = await finalizeLaunch(launchId, result);

      return NextResponse.json({
        status: result.success ? "completed" : "failed",
        launch: {
          id: launch.id,
          tokenName: launch.tokenName,
          tokenSymbol: launch.tokenSymbol,
          tokenAddress: launch.tokenAddress,
          explorerUrl: launch.explorerUrl,
          uniswapUrl: launch.uniswapUrl,
          bankrUrl: launch.bankrUrl,
          status: launch.status,
        },
        error: result.success ? undefined : result.error,
      });
    }

    return NextResponse.json({ status: "processing" });
  } catch (err: any) {
    console.error("Bankr status check error:", err);
    return NextResponse.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}
