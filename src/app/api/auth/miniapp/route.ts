import { NextRequest, NextResponse } from "next/server";
import { createToken, getOrCreateUser, COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/auth/miniapp
 *
 * Authenticates mini app users without requiring a signature.
 * In Base App / Farcaster, the user is already authenticated by the host.
 * The wallet address comes from the Farcaster wagmi connector.
 *
 * Uses the same createToken, getOrCreateUser, and COOKIE_NAME
 * as your existing /api/auth endpoint so the session is identical.
 */
export async function POST(req: NextRequest) {
  try {
    const { wallet, fid, username, displayName } = await req.json();

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const normalizedWallet = wallet.toLowerCase();

    // Create/fetch user in DB — same as your verify flow
    await getOrCreateUser(normalizedWallet);

    // Create JWT — same function as your verify flow
    const token = await createToken(normalizedWallet);

    const res = NextResponse.json({
      success: true,
      wallet: normalizedWallet,
      fid: fid || null,
      source: "miniapp",
    });

    // Set cookie — same name & settings as your verify flow
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // "none" required for mini app webview context
      maxAge: 30 * 24 * 60 * 60, // 30 days, same as your auth
      path: "/",
    });

    console.log(`[MiniApp Auth] ✅ ${normalizedWallet} (fid: ${fid || "none"})`);
    return res;
  } catch (err: any) {
    console.error("[MiniApp Auth] ❌", err.message);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
