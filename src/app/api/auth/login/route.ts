import { NextRequest, NextResponse } from "next/server";
import { verifyUserCredentials } from "@/lib/auth/userStore";
import { createSessionToken } from "@/lib/auth/crypto";
import { COOKIE_NAME, COOKIE_OPTIONS, authUnavailableResponse } from "@/lib/auth/cookie";

export async function POST(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return authUnavailableResponse();
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください。" }, { status: 400 });
  }

  const ok = await verifyUserCredentials(email, password);
  if (!ok) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが違います。" }, { status: 401 });
  }

  const token = createSessionToken(email, secret);
  const res = NextResponse.json({ email });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
