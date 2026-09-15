// AI 초안생성 호출 횟수를 하루 단위로 제한하는 안전장치(비용 폭주 방지용).
// 지금은 DB가 없어서, 다른 프로젝트들(portfolio-kuu의 방문자수/Q&A)에서 이미
// 검증된 "append-only Blob 파일" 패턴을 그대로 재사용한다 — 같은 Blob 값을
// 덮어쓰면 CDN에 즉시 반영 안 되는 문제를 그때 겪었기 때문에, 카운트도
// 파일 하나 덮어쓰는 대신 이벤트마다 새 파일을 쓰고 list()로 개수를 센다.
//
// 이건 정식 사용자별 쿼터가 아니라 "하루 전체 호출 수 상한"이다. 사용자별 쿼터는
// 인증/DB가 생기는 화면2(기업 프로필) 이후 단계에서 제대로 구현할 것.

import { list, put } from "@vercel/blob";

const DAILY_LIMIT = 40; // 베타 테스트(3~5개사) 단계 기준 — 필요시 조정

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export async function checkAndRecordUsage(): Promise<{ ok: boolean; remaining: number }> {
  const prefix = `ai-usage/${todayKey()}/`;
  const { blobs } = await list({ prefix });

  if (blobs.length >= DAILY_LIMIT) {
    return { ok: false, remaining: 0 };
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await put(`${prefix}${id}.json`, JSON.stringify({ ts: new Date().toISOString() }), {
    access: "public",
    addRandomSuffix: false,
  });

  return { ok: true, remaining: DAILY_LIMIT - blobs.length - 1 };
}
