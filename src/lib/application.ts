// 신청서 작성 플로우(화면1~7) 전체를 관통하는 데이터 모델.
// 화면6(체크리스트)부터 설계하는 이유: 어떤 기준으로 검증할지 먼저 정해야
// 화면4~5(대화형 질문)에서 무엇을 물어봐야 하는지가 역산된다.

// ---------- 화면1: 공모요령 PDF에서 AI가 추출 ----------

/** 심사위원이 실제로 채점하는 기준 하나. PDF의 "審査項目" 표에서 추출. */
export type ScoringCriterion = {
  id: string;
  label: string; // 예: "事業の独自性・革新性"
  description: string; // 심사위원이 이 항목에서 구체적으로 무엇을 보는지
  weight?: number; // 배점이 명시된 경우(예: 30점 만점 중 10점). 없으면 undefined
  sourceQuote?: string; // PDF 원문 발췌 — AI가 지어내지 않았다는 근거, 사용자가 원문 대조 가능
};

/** 제출 필요 서류 하나. */
export type RequiredDocument = {
  id: string;
  label: string;
  required: boolean; // 필수 vs 해당시에만
};

// ---------- 화면3: AI가 제시하는 사업계획서 구조(뼈대) ----------

export type DraftSectionKey =
  | "current_situation" // 현상파악
  | "issue" // 과제도출
  | "solution" // 해결수단
  | "business_effect" // 사업효과
  | "financial_plan"; // 수지계획

export const DRAFT_SECTION_LABELS: Record<DraftSectionKey, string> = {
  current_situation: "現状把握",
  issue: "課題抽出",
  solution: "解決手段",
  business_effect: "事業効果",
  financial_plan: "収支計画",
};

// ---------- 화면4~5: 대화형으로 채워지는 초안 ----------

/** 화면4에서 AI가 던진 질문 하나 + 사용자의 답변. */
export type SectionQA = {
  question: string;
  answer: string;
};

export type DraftSection = {
  key: DraftSectionKey;
  qa: SectionQA[]; // 화면4: 사용자가 짧게 답한 원본
  content: string; // 화면5: AI가 심사위원이 읽기 좋게 재작성한 최종 문장
};

// ---------- 화면6: 기준별 체크 결과 ----------

export type ChecklistStatus = "sufficient" | "needs_improvement" | "missing";

export const CHECKLIST_STATUS_META: Record<
  ChecklistStatus,
  { label: string; order: number }
> = {
  missing: { label: "未対応", order: 0 },
  needs_improvement: { label: "要改善", order: 1 },
  sufficient: { label: "十分", order: 2 },
};

export type ChecklistResult = {
  criterionId: string;
  status: ChecklistStatus;
  comment: string; // AI가 남긴 구체적 코멘트 (왜 이 상태인지)
  relatedSection?: DraftSectionKey; // 관련 섹션 — 있으면 "이 부분 보러가기" 링크 제공
};

// ---------- 전체 신청 세션 ----------

/** 화면1~7 전체를 관통하는 하나의 신청 세션. 실제로는 서버측 DB(예: Blob append-only 또는
 *  실제 DB)에 저장되고, 화면 간 이동 시 이 구조를 불러와 이어서 작업한다. */
export type ApplicationSession = {
  id: string;
  subsidyId: string; // jGrants의 id (화면1/2에서 선택한 보조금)
  criteria: ScoringCriterion[];
  requiredDocuments: RequiredDocument[];
  draftSections: DraftSection[];
  checklistResults: ChecklistResult[];
  updatedAt: string;
};

/** 화면6 요약 통계. */
export function summarizeChecklist(results: ChecklistResult[]) {
  return {
    total: results.length,
    missing: results.filter((r) => r.status === "missing").length,
    needsImprovement: results.filter((r) => r.status === "needs_improvement").length,
    sufficient: results.filter((r) => r.status === "sufficient").length,
  };
}
