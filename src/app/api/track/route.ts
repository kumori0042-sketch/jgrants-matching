import { NextRequest, NextResponse } from "next/server";
import { writeAppendOnly } from "@/lib/blobStore";

const ALLOWED_EVENTS = new Set([
  "search_performed",
  "start_application_click",
  "draft_all_sections_completed",
  "checklist_reevaluated",
  "content_report",
]);

// 계측 전용 엔드포인트. 실패해도 절대 화면을 막으면 안 되므로 항상 200에 가깝게 응답한다.
export async function POST(req: NextRequest) {
  let body: { event?: string; meta?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.event || !ALLOWED_EVENTS.has(body.event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    await writeAppendOnly(`events/${body.event}/`, {
      meta: body.meta ?? null,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[track] failed to write event:", err instanceof Error ? err.message : err);
  }
  return NextResponse.json({ ok: true });
}
