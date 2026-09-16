import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/userStore";
import { createSessionToken } from "@/lib/auth/crypto";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth/cookie";

export async function POST(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "サーバーにSESSION_SECRETが設定されていません。" }, { status: 500 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスの形式が正しくありません。" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください。" }, { status: 400 });
  }

  const created = await registerUser(email, password);
  if (!created) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています。" }, { status: 409 });
  }

  const token = createSessionToken(email, secret);
  const res = NextResponse.json({ email });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
