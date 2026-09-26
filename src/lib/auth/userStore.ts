import { emailHash, hashPassword, verifyPassword } from "./crypto";
import { readSingle, writeSingleIfAbsent, readLatestAppendOnly, writeAppendOnly } from "../blobStore";

type UserRecord = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

type PasswordRecord = {
  passwordHash: string;
  changedAt: string;
};

function accountPath(email: string): string {
  return `users/${emailHash(email)}/account.json`;
}

// 계정 레코드(account.json)는 가입 후 절대 바뀌지 않는다는 기존 전제를 그대로 두고,
// 비밀번호 변경은 세션/프로필과 같은 append-only 기록으로 따로 쌓는다 — 최신 것만 읽는다.
function passwordPrefix(email: string): string {
  return `users/${emailHash(email)}/password/`;
}

export function userPrefix(email: string): string {
  return `users/${emailHash(email)}/`;
}

/** 이미 있으면 false, 새로 만들었으면 true. 계정 레코드는 생성 후 변경되지 않으므로
 *  단일 경로에 한 번만 쓰고, 동시에 같은 이메일로 가입 시도하는 극히 드문 경합은
 *  베타 규모에서는 감수한다(첫 요청만 성공, 이후 요청은 "이미 있음"으로 처리됨). */
export async function registerUser(email: string, password: string): Promise<boolean> {
  const record: UserRecord = {
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  return writeSingleIfAbsent(accountPath(email), record);
}

export async function verifyUserCredentials(email: string, password: string): Promise<boolean> {
  const account = await readSingle<UserRecord>(accountPath(email));
  if (!account) return false;
  const latestChange = await readLatestAppendOnly<PasswordRecord>(passwordPrefix(email));
  const currentHash = latestChange?.passwordHash ?? account.passwordHash;
  return verifyPassword(password, currentHash);
}

export async function userExists(email: string): Promise<boolean> {
  const record = await readSingle<UserRecord>(accountPath(email));
  return !!record;
}

/** 로그인 상태에서만 호출된다 (현재 비밀번호는 호출하는 라우트가 먼저 검증). */
export async function changePassword(email: string, newPassword: string): Promise<void> {
  const record: PasswordRecord = {
    passwordHash: hashPassword(newPassword),
    changedAt: new Date().toISOString(),
  };
  await writeAppendOnly(passwordPrefix(email), record);
}
