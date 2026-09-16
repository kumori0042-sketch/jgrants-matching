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

// TODO: 화면1(jGrants 검색)에서 실제로 선택한 보조금과 연결하는 경로가 아직 없음.
// 지금은 이 서비스 전체의 디자인 기반으로 삼고 있는 "ものづくり補助金23次" 고정값.
const DEFAULT_SUBSIDY_ID = "monozukuri-23";

function emptySession(): ApplicationSession {
  return {
    id: `local-${Date.now()}`,
    subsidyId: DEFAULT_SUBSIDY_ID,
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
