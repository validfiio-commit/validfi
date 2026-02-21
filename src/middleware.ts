import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("validfi-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/?connect=true", req.url));
  }
  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/?connect=true", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/ideas/:path*"],
};
