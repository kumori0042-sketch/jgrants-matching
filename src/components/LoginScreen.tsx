"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, registerAccount } from "@/lib/authClient";
import { syncOnLogin } from "@/lib/cloudSync";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("メールアドレスとパスワードを入力してください。");
      return;
    }
    setLoading(true);
    try {
      const result = mode === "login" ? await login(email, password) : await registerAccount(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await syncOnLogin();
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-md px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">アカウント</p>
          <h1 className="mt-1 text-2xl font-black text-ink">
            {mode === "login" ? "ログイン" : "新規登録"}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            ログインすると、企業情報・作成中の書類を複数の端末で共有できます。ログインしなくても、この端末だけならこれまで通りご利用いただけます。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-md flex-1 px-6 py-8">
        <div className="rounded-lg border border-line bg-card p-6 shadow-card">
          <label className="block text-sm">
            <span className="mb-1.5 block font-bold text-ink">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>

          <label className="mt-4 block text-sm">
            <span className="mb-1.5 block font-bold text-ink">パスワード</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "8文字以上" : ""}
              className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 w-full rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
          </button>

          <button
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setError(null);
            }}
            className="mt-3 w-full text-center text-xs font-bold text-accent-ink hover:underline"
          >
            {mode === "login" ? "アカウントをお持ちでない方はこちら" : "既にアカウントをお持ちの方はこちら"}
          </button>
        </div>

        <Link href="/" className="mt-4 block text-center text-xs text-ink-faint hover:underline">
          ログインせずに続ける →
        </Link>
      </section>
    </main>
  );
}
