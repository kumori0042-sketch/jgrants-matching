// 화면3~6을 하나로 잇는 세션 저장소. 아직 인증/DB가 없어서 companyProfile.ts와
// 같은 이유로 localStorage에 저장한다 - 로그인이 생기면 서버측 사용자별 저장으로
// 옮겨야 한다(companyProfile.ts에 남긴 메모와 동일한 한계).

import type { ApplicationSession, DraftSectionKey, SectionQA } from "./application";
import { MONOZUKURI_CRITERIA } from "./monozukuriCriteria";

const STORAGE_KEY = "jgrants_session_v1";

const SECTION_ORDER: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

// 화면3에서 "実際の公募要領から読み込む"을 실행하기 전까지는, 어떤 보조금을
// 선택해도 심사기준은 이 서비스가 실제로 추출해둔 "ものづくり補助金23次" 것을
// 참고용으로 재사용한다(화면3/6 UI에 그 취지를 항상 안내 문구로 노출함).
const DEFAULT_SUBSIDY = {
  id: "monozukuri-23",
  title: "ものづくり・商業・サービス生産性向上促進補助金（第23次）",
  url: "https://portal.monodukuri-hojo.jp/",
};

function emptySession(): ApplicationSession {
  return {
    id: `local-${Date.now()}`,
    subsidyId: DEFAULT_SUBSIDY.id,
    subsidyTitle: DEFAULT_SUBSIDY.title,
    subsidyUrl: DEFAULT_SUBSIDY.url,
    criteriaSource: "reference",
    criteria: MONOZUKURI_CRITERIA,
    requiredDocuments: [],
    draftSections: SECTION_ORDER.map((key) => ({ key, qa: [] as SectionQA[], content: "" })),
    checklistResults: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadSession(): ApplicationSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApplicationSession;
  } catch {
    return null;
  }
}

export function loadOrCreateSession(): ApplicationSession {
  return loadSession() ?? emptySession();
}

export function saveSession(session: ApplicationSession): ApplicationSession {
  const next: ApplicationSession = { ...session, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* localStorage 접근 불가 환경이면 저장은 스킵 */
  }
  return next;
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function updateDraftSection(
  session: ApplicationSession,
  key: DraftSectionKey,
  patch: Partial<{ qa: SectionQA[]; content: string }>
): ApplicationSession {
  const draftSections = session.draftSections.map((s) => (s.key === key ? { ...s, ...patch } : s));
  return saveSession({ ...session, draftSections });
}

/** 화면1에서 보조금을 고르면 호출 - 기존 답변/초안은 유지한 채 대상 보조금 정보만 갱신한다.
 *  이전에 다른 보조금에서 추출해둔 심사기준이 남아있으면 안 되므로 참고 기본값으로 리셋한다. */
export function selectSubsidy(subsidy: { id: string; title: string; url: string }): ApplicationSession {
  const current = loadOrCreateSession();
  return saveSession({
    ...current,
    subsidyId: subsidy.id,
    subsidyTitle: subsidy.title,
    subsidyUrl: subsidy.url,
    criteriaSource: "reference",
    criteria: MONOZUKURI_CRITERIA,
  });
}

/** 화면3에서 "実際の公募要領から読み込む"이 성공하면 호출 - 추출된 실제 심사기준으로 교체. */
export function applyExtractedCriteria(
  session: ApplicationSession,
  criteria: ApplicationSession["criteria"]
): ApplicationSession {
  return saveSession({ ...session, criteria, criteriaSource: "extracted" });
}

/** 세션에 답변이 하나라도 있는지 - 화면 진입 가드에 사용. */
export function hasAnyAnswers(session: ApplicationSession | null): boolean {
  if (!session) return false;
  return session.draftSections.some((s) => s.qa.some((qa) => qa.answer?.trim()));
}

/** 세션에 생성된 초안이 하나라도 있는지 - 화면 진입 가드에 사용. */
export function hasAnyDrafts(session: ApplicationSession | null): boolean {
  if (!session) return false;
  return session.draftSections.some((s) => s.content?.trim());
}
