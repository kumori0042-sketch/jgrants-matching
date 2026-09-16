"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DRAFT_SECTION_LABELS, type DraftSectionKey } from "@/lib/application";
import { loadCompanyProfile, type CompanyProfile } from "@/lib/companyProfile";

const SECTION_ORDER: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

export default function StructureScreen() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [guidance, setGuidance] = useState<Partial<Record<DraftSectionKey, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setProfile(loadCompanyProfile());
    setHydrated(true);
  }, []);

  async function generate() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyProfile: profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました。");
      setGuidance(data.sections ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  if (!profile) {
    return (
      <main className="min-h-screen">
        <header className="border-b border-line bg-card">
          <div className="mx-auto max-w-2xl px-6 py-5">
            <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 3 / 7</p>
            <h1 className="mt-1 text-2xl font-black text-ink">構成の確認</h1>
          </div>
        </header>
        <section className="mx-auto max-w-2xl px-6 py-8">
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">
              先に企業情報を登録してください。企業情報をもとに構成を提案します。
            </p>
            <Link
              href="/profile"
              className="mt-4 inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              企業情報を登録する →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const hasGuidance = SECTION_ORDER.some((s) => guidance[s]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 3 / 7</p>
          <h1 className="mt-1 text-2xl font-black text-ink">構成の確認</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {profile.companyName}様の情報をもとに、事業計画書の構成案を提案します。この構成でよいか確認してください。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-2xl flex-1 px-6 py-8">
        {!hasGuidance && !loading && (
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">AIが企業情報に合わせた構成案を提案します。</p>
            <button
              onClick={generate}
              className="mt-4 rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              構成案を生成する
            </button>
          </div>
        )}

        {loading && <p className="py-10 text-center text-sm text-ink-faint">生成中...</p>}

        {error && (
          <p className="rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
        )}

        {hasGuidance && (
          <>
            <div className="flex flex-col gap-3">
              {SECTION_ORDER.map((section, i) => (
                <div key={section} className="rounded-lg border border-line bg-card p-5 shadow-card">
                  <h2 className="text-base font-bold text-ink">
                    {i + 1}. {DRAFT_SECTION_LABELS[section]}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {guidance[section] ?? "—"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-line bg-card p-5 shadow-card">
              <label className="block text-sm font-bold text-ink" htmlFor="structure-feedback">
                この構成で気になる点があれば教えてください（任意）
              </label>
              <textarea
                id="structure-feedback"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="例：収支計画よりも、海外展開について詳しく書きたい"
                className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />
              {feedback.trim() && (
                <button
                  onClick={generate}
                  disabled={loading}
                  className="mt-3 rounded-md border border-line px-5 py-2 text-xs font-bold text-accent-ink transition hover:border-accent disabled:opacity-50"
                >
                  この内容を踏まえて再生成する
                </button>
              )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-8 text-center">
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                この構成で進めます
              </label>
              <Link
                href="/question-preview"
                aria-disabled={!confirmed}
                className={`rounded-md px-6 py-3 text-sm font-bold text-white transition ${
                  confirmed ? "bg-accent hover:brightness-110" : "pointer-events-none bg-line text-ink-faint"
                }`}
              >
                質問に答えて書類を作る →
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
