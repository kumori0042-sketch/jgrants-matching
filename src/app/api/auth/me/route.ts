import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/crypto";
import { COOKIE_NAME } from "@/lib/auth/cookie";

export async function GET(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !token) {
    return NextResponse.json({ email: null });
  }
  const payload = verifySessionToken(token, secret);
  return NextResponse.json({ email: payload?.email ?? null });
}
