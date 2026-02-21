import { SignJWT, jwtVerify } from "jose";
import { ethers } from "ethers";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
const COOKIE_NAME = "validfi-token";

// In-memory nonce store (production: use Redis)
const nonces = new Map<string, { nonce: string; expires: number }>();

export function generateNonce(wallet: string): string {
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  nonces.set(wallet.toLowerCase(), { nonce, expires: Date.now() + 5 * 60 * 1000 });
  return nonce;
}

export function getNonce(wallet: string): string | null {
  const entry = nonces.get(wallet.toLowerCase());
  if (!entry || entry.expires < Date.now()) {
    nonces.delete(wallet.toLowerCase());
    return null;
  }
  return entry.nonce;
}

export function consumeNonce(wallet: string): void {
  nonces.delete(wallet.toLowerCase());
}

export function buildSignMessage(nonce: string): string {
  return `Sign this message to verify your wallet with ValidFi.\n\nNonce: ${nonce}`;
}

export function verifySignature(message: string, signature: string): string | null {
  try {
    const address = ethers.verifyMessage(message, signature);
    return address.toLowerCase();
  } catch {
    return null;
  }
}

export async function createToken(wallet: string): Promise<string> {
  return new SignJWT({ wallet })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<{ wallet: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return { wallet: payload.wallet as string };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { wallet: payload.wallet } });
  return user;
}

export async function getOrCreateUser(wallet: string) {
  const w = wallet.toLowerCase();
  let user = await prisma.user.findUnique({ where: { wallet: w } });
  if (!user) {
    user = await prisma.user.create({ data: { wallet: w } });
  }
  return user;
}

export { COOKIE_NAME };
