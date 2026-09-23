// jGrants 공식 API는 가끔 일시적으로 실패한다 (네트워크 오류, 5xx, 타임아웃).
// 이런 경우에만 짧은 대기 후 최대 2회 재시도한다. 4xx(요청 자체 문제)는 재시도하지 않는다.
const MAX_RETRIES = 2;
const BACKOFF_MS = [300, 800];

function isTransient(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * fetch를 감싸, 네트워크 오류나 5xx 응답에 한해 최대 MAX_RETRIES회 재시도한다.
 * 4xx 응답은 즉시 그대로 반환한다 (재시도해도 결과가 같으므로).
 */
export async function fetchJgrants(url: string, init?: RequestInit): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || !isTransient(res.status) || attempt === MAX_RETRIES) {
        return res;
      }
      lastError = new Error(`jGrants API ${res.status}`);
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) throw err;
    }
    await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt] ?? 800));
  }
  throw lastError;
}
