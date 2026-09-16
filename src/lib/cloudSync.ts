import { loadCompanyProfile, restoreCompanyProfile, type CompanyProfile } from "./companyProfile";
import { loadSession, restoreSession } from "./session";
import type { ApplicationSession } from "./application";

type PulledData = { profile: CompanyProfile | null; session: ApplicationSession | null };

export async function pushToCloud(data: { profile?: CompanyProfile; session?: ApplicationSession }): Promise<void> {
  try {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // 오프라인이거나 서버 오류여도 로컬 데이터는 이미 저장돼 있으므로 조용히 무시
    // (다음 체크포인트에서 다시 시도됨)
  }
}

async function pullFromCloud(): Promise<PulledData | null> {
  try {
    const res = await fetch("/api/sync");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** 로그인 직후 호출 - 클라우드와 이 기기의 localStorage 중 더 최신인 쪽으로
 *  맞추고, 반대쪽은 그 값으로 업데이트한다(어느 한쪽 작업이 조용히 사라지지 않게). */
export async function syncOnLogin(): Promise<void> {
  const cloud = await pullFromCloud();
  const localProfile = loadCompanyProfile();
  const localSession = loadSession();

  if (cloud?.profile && (!localProfile || cloud.profile.updatedAt > localProfile.updatedAt)) {
    restoreCompanyProfile(cloud.profile);
  } else if (localProfile) {
    await pushToCloud({ profile: localProfile });
  }

  if (cloud?.session && (!localSession || cloud.session.updatedAt > localSession.updatedAt)) {
    restoreSession(cloud.session);
  } else if (localSession) {
    await pushToCloud({ session: localSession });
  }
}
