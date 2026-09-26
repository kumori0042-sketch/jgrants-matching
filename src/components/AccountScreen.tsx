"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCurrentUser, changePassword, type AuthUser } from "@/lib/authClient";

export default function AccountScreen() {
  const [user, setUser] = useState<AuthUser>(null);
  const [hydrated, setHydrated] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser().then((u) => {
      setUser(u);
      setHydrated(true);
    });
  }, []);

  async function handleSubmit() {
    setError(null);
    setSuccess(false);
    if (!currentPassword || !newPassword) {
      setError("すべての項目を入力してください。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません。");
      return;
    }
    setLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-md px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">アカウント設定</p>
          <h1 className="mt-1 text-2xl font-black text-ink">パスワードを変更</h1>
        </div>
      </header>

      <section className="mx-auto max-w-md flex-1 px-6 py-8">
        {!user ? (
          <div className="rounded-lg border border-line bg-card p-6 text-sm text-ink-soft shadow-card">
            この画面を使うにはログインが必要です。
            <Link href="/login" className="mt-4 block text-center font-bold text-accent-ink hover:underline">
              ログインへ →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-card p-6 shadow-card">
            <p className="mb-4 text-sm text-ink-faint">{user.email}</p>

            <label className="block text-sm">
              <span className="mb-1.5 block font-bold text-ink">現在のパスワード</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block font-bold text-ink">新しいパスワード</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8文字以上"
                className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block font-bold text-ink">新しいパスワード（確認）</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>

            {error && (
              <p className="mt-4 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
            )}
            {success && (
              <p className="mt-4 rounded-md border border-accent-ink/30 bg-accent-soft px-4 py-3 text-sm text-accent-ink">
                パスワードを変更しました。
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-5 w-full rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "処理中..." : "変更する"}
            </button>
          </div>
        )}

        <Link href="/" className="mt-4 block text-center text-xs text-ink-faint hover:underline">
          トップへ戻る →
        </Link>
      </section>
    </main>
  );
}
