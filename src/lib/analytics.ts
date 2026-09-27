// PRD의 "성공 지표" 4항목을 실제로 재기 위한 최소 계측. 화면을 막지 않도록 항상
// fire-and-forget이고, 실패해도 조용히 무시한다(핵심 기능이 아니므로).
export type AnalyticsEvent =
  | "search_performed" // 활성화 분모: 검색이 실제로 실행됨
  | "start_application_click" // 활성화 분자: 書類作成を始める 클릭
  | "draft_all_sections_completed" // 핵심 가치: 초안 5섹션 전부 완료
  | "checklist_reevaluated" // 품질: 재평가할 때마다, 몇 건이 '충분'으로 개선됐는지
  | "content_report"; // 신뢰·안전: 사실과 다르다는 신고

export function track(event: AnalyticsEvent, meta?: Record<string, unknown>): void {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, meta: meta ?? null }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // noop — 계측 실패로 사용자 흐름을 막지 않는다
  }
}
