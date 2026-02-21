import { NextRequest, NextResponse } from "next/server";
import {
  generateNonce, getNonce, consumeNonce, buildSignMessage,
  verifySignature, createToken, verifyToken, getOrCreateUser, COOKIE_NAME,
} from "@/lib/auth";

// GET /api/auth — check current session
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ wallet: null });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ wallet: null });

  return NextResponse.json({ wallet: payload.wallet });
}

// POST /api/auth — nonce, verify, logout
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "nonce") {
    const { wallet } = body;
    if (!wallet) return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    const nonce = generateNonce(wallet);
    const message = buildSignMessage(nonce);
    return NextResponse.json({ message, nonce });
  }

  if (action === "verify") {
    const { wallet, signature } = body;
    if (!wallet || !signature) {
      return NextResponse.json({ error: "Missing wallet or signature" }, { status: 400 });
    }

    const nonce = getNonce(wallet);
    if (!nonce) {
      return NextResponse.json({ error: "Nonce expired. Please try again." }, { status: 400 });
    }

    const message = buildSignMessage(nonce);
    const recovered = verifySignature(message, signature);

    if (!recovered || recovered !== wallet.toLowerCase()) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    consumeNonce(wallet);
    await getOrCreateUser(wallet);
    const token = await createToken(wallet.toLowerCase());

    const res = NextResponse.json({ success: true, wallet: wallet.toLowerCase() });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ success: true });
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
