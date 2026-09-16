// Vercel Blob을 간단한 사용자별 저장소로 쓰기 위한 공용 헬퍼.
// portfolio-kuu의 Q&A/주문 데이터에서 배운 교훈 재적용: 같은 경로를 덮어쓰면
// CDN에 변경사항이 즉시 반영되지 않는 경우가 있어서, 자주 갱신되는 데이터는
// "매번 새 파일을 추가하고 최신 것만 읽기" 방식(append-only)으로 저장한다.
// 계정 레코드처럼 생성 후 절대 변경되지 않는 데이터는 단일 경로 그대로 둬도 안전하다.

import { list, put } from "@vercel/blob";

export async function writeAppendOnly(prefix: string, data: unknown): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await put(`${prefix}${id}.json`, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
  });
}

export async function readLatestAppendOnly<T>(prefix: string): Promise<T | null> {
  const { blobs } = await list({ prefix });
  if (blobs.length === 0) return null;
  // 파일명이 타임스탬프로 시작하므로 문자열 내림차순 정렬 = 최신순 정렬
  const latest = [...blobs].sort((a, b) => b.pathname.localeCompare(a.pathname))[0];
  const res = await fetch(latest.url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

/** 한 번 쓰면 이후 절대 변경되지 않는 데이터(예: 계정 레코드)용 - 단일 경로. */
export async function readSingle<T>(pathname: string): Promise<T | null> {
  const { blobs } = await list({ prefix: pathname });
  const match = blobs.find((b) => b.pathname === pathname);
  if (!match) return null;
  const res = await fetch(match.url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function writeSingleIfAbsent(pathname: string, data: unknown): Promise<boolean> {
  const existing = await readSingle(pathname);
  if (existing) return false;
  await put(pathname, JSON.stringify(data), { access: "public", addRandomSuffix: false });
  return true;
}
