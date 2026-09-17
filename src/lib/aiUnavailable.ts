import { NextResponse } from "next/server";

// 화면3/4/5/6에서 ANTHROPIC_API_KEY 미설정 시 내부 설정값("ANTHROPIC_API_KEY",
// "Vercel"등)을 그대로 고객에게 노출하던 걸 UAT에서 발견 - 고객에게는 일반적인
// 안내만 보여주고, 실제 원인은 서버 로그에만 남긴다(개발자가 Vercel 로그에서 확인).
export function aiUnavailableResponse(routeName: string) {
  console.error(`[${routeName}] ANTHROPIC_API_KEY is not configured`);
  return NextResponse.json(
    { error: "現在この機能はご利用いただけません。しばらくしてから再度お試しください。" },
    { status: 503 }
  );
}
