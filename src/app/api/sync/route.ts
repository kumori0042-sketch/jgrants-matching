import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/crypto";
import { COOKIE_NAME } from "@/lib/auth/cookie";
import { userPrefix } from "@/lib/auth/userStore";
import { readLatestAppendOnly, writeAppendOnly } from "@/lib/blobStore";
import type { CompanyProfile } from "@/lib/companyProfile";
import type { ApplicationSession } from "@/lib/application";

function getEmail(req: NextRequest): string | null {
  const secret = process.env.SESSION_SECRET;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !token) return null;
  return verifySessionToken(token, secret)?.email ?? null;
}

// 화면2(기업정보)/화면3~6(세션)에서 로그인한 사용자의 최신 데이터를 불러온다.
// 로그인 안 한 상태에선 그냥 localStorage만 쓰면 되므로, 이 라우트는 로그인
// 사용자에 한해서만 의미가 있다.
export async function GET(req: NextRequest) {
  const email = getEmail(req);
  if (!email) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const prefix = userPrefix(email);
  const [profile, session] = await Promise.all([
    readLatestAppendOnly<CompanyProfile>(`${prefix}profile/`),
    readLatestAppendOnly<ApplicationSession>(`${prefix}session/`),
  ]);

  return NextResponse.json({ profile, session });
}

type SyncBody = {
  profile?: CompanyProfile;
  session?: ApplicationSession;
};

export async function POST(req: NextRequest) {
  const email = getEmail(req);
  if (!email) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  let body: SyncBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const prefix = userPrefix(email);
  const writes: Promise<void>[] = [];
  if (body.profile) writes.push(writeAppendOnly(`${prefix}profile/`, body.profile));
  if (body.session) writes.push(writeAppendOnly(`${prefix}session/`, body.session));

  try {
    await Promise.all(writes);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "同期に失敗しました。" }, { status: 502 });
  }
}
