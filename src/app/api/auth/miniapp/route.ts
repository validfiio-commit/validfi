import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

/**
 * Mini app auth endpoint.
 *
 * In the Base App / Farcaster context, the user is already authenticated
 * by the host client. Their wallet address comes from the Farcaster connector
 * which is injected by the host — we can trust it without requiring a signature.
 *
 * This creates the same JWT cookie that /api/auth creates, so the rest of
 * your backend (middleware, API routes) works identically.
 */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me"
);

export async function POST(req: NextRequest) {
  try {
    const { wallet, fid, username, displayName } = await req.json();

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    const normalizedWallet = wallet.toLowerCase();

    // Create JWT — same shape as your existing /api/auth endpoint
    const token = await new SignJWT({
      wallet: normalizedWallet,
      fid: fid || null,
      source: "miniapp",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Set the same cookie name your middleware/auth checks for
    const response = NextResponse.json({
      wallet: normalizedWallet,
      fid,
      username,
      source: "miniapp",
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // Required for iframe/webview context in mini apps
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Mini app auth error:", err);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
