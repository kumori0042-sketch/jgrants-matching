import { NextResponse } from "next/server";

export const COOKIE_NAME = "jg_session";

// UAT에서 발견: SESSION_SECRET 미설정 시 내부 설정값 이름을 그대로 고객에게
// 노출하고 있었다 - 일반 안내로 바꾸고 원인은 서버 로그에만 남긴다.
export function authUnavailableResponse() {
  console.error("SESSION_SECRET is not configured");
  return NextResponse.json(
    { error: "現在ログイン機能をご利用いただけません。しばらくしてから再度お試しください。" },
    { status: 503 }
  );
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30일
};
