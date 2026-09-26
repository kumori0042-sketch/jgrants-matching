import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/crypto";
import { COOKIE_NAME, authUnavailableResponse } from "@/lib/auth/cookie";
import { verifyUserCredentials, changePassword } from "@/lib/auth/userStore";

export async function POST(req: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return authUnavailableResponse();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token, secret) : null;
  if (!session) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "新しいパスワードは8文字以上で入力してください。" }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "現在のパスワードと同じです。" }, { status: 400 });
  }

  const ok = await verifyUserCredentials(session.email, currentPassword);
  if (!ok) {
    return NextResponse.json({ error: "現在のパスワードが正しくありません。" }, { status: 401 });
  }

  await changePassword(session.email, newPassword);
  return NextResponse.json({ ok: true });
}
