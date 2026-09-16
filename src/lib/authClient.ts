export type AuthUser = { email: string } | null;

export async function fetchCurrentUser(): Promise<AuthUser> {
  try {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    return data.email ? { email: data.email } : null;
  } catch {
    return null;
  }
}

type AuthResult = { ok: true } | { ok: false; error: string };

export async function registerAccount(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "登録に失敗しました。" };
    return { ok: true };
  } catch {
    return { ok: false, error: "登録中にエラーが発生しました。" };
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "ログインに失敗しました。" };
    return { ok: true };
  } catch {
    return { ok: false, error: "ログイン中にエラーが発生しました。" };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    /* noop */
  }
}
