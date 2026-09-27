import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

const EVENTS = [
  "search_performed",
  "start_application_click",
  "draft_all_sections_completed",
  "checklist_reevaluated",
  "content_report",
] as const;

// 관리자용 최소 집계. 인증은 없지만 링크로 공개 안내하지 않고, 개인정보는 담지 않는다(이벤트 이름 + meta뿐).
export async function GET() {
  const counts: Record<string, number> = {};

  for (const ev of EVENTS) {
    const { blobs } = await list({ prefix: `events/${ev}/` });
    counts[ev] = blobs.length;
  }

  // "몇 건이 부족→충분으로 개선됐는가"는 checklist_reevaluated의 meta.improvedCount 합산으로 구한다.
  // blob 하나하나를 다 열어보면 비용이 커지니 최근 300건만 본다.
  let checklistImproved = 0;
  const { blobs: reevalBlobs } = await list({ prefix: "events/checklist_reevaluated/" });
  const recent = [...reevalBlobs].sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(0, 300);
  const sums = await Promise.all(
    recent.map(async (b) => {
      try {
        const res = await fetch(b.url, { cache: "no-store" });
        const data = await res.json();
        return Number(data?.meta?.improvedCount) || 0;
      } catch {
        return 0;
      }
    })
  );
  checklistImproved = sums.reduce((a, b) => a + b, 0);

  const activationRate =
    counts.search_performed > 0 ? counts.start_application_click / counts.search_performed : null;

  return NextResponse.json({
    counts,
    checklistImproved,
    activationRate,
    note: "search_performed 대비 start_application_click 비율이 활성화 지표, checklistImproved가 품질 지표, content_report가 신뢰·안전 지표입니다.",
  });
}
