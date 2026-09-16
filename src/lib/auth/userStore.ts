import { emailHash, hashPassword, verifyPassword } from "./crypto";
import { readSingle, writeSingleIfAbsent } from "../blobStore";

type UserRecord = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

function accountPath(email: string): string {
  return `users/${emailHash(email)}/account.json`;
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
  const record = await readSingle<UserRecord>(accountPath(email));
  if (!record) return false;
  return verifyPassword(password, record.passwordHash);
}

export async function userExists(email: string): Promise<boolean> {
  const record = await readSingle<UserRecord>(accountPath(email));
  return !!record;
}
