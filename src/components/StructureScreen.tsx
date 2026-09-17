"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StepNav from "./StepNav";
import { DRAFT_SECTION_LABELS, type ApplicationSession, type DraftSectionKey, type ScoringCriterion } from "@/lib/application";
import { loadCompanyProfile, type CompanyProfile } from "@/lib/companyProfile";
import { loadOrCreateSession, saveSession, applyExtractedCriteria } from "@/lib/session";
import { pushToCloud } from "@/lib/cloudSync";

const SECTION_ORDER: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

export default function StructureScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [session, setSession] = useState<ApplicationSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [guidance, setGuidance] = useState<Partial<Record<DraftSectionKey, string>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(loadCompanyProfile());
    setSession(loadOrCreateSession());
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

  async function extractRealCriteria() {
    if (!session) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subsidyId: session.subsidyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "読み込みに失敗しました。");
      const criteria = data.criteria as ScoringCriterion[];
      const next = applyExtractedCriteria(session, criteria);
      setSession(next);
      pushToCloud({ session: next });
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setExtracting(false);
    }
  }

  function proceed() {
    // 화면3에서 세션을 초기화/확정해서 화면4부터는 실제 세션 데이터로 이어지게 한다.
    const confirmedSession = loadOrCreateSession();
    saveSession(confirmedSession);
    pushToCloud({ session: confirmedSession });
    router.push("/question");
  }

  if (!hydrated) return null;

  if (!profile) {
    return (
      <main className="min-h-screen">
        <StepNav current={3} />
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
      <StepNav current={3} />
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 3 / 7</p>
          <h1 className="mt-1 text-2xl font-black text-ink">構成の確認</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {profile.companyName}様の情報をもとに、事業計画書の構成案を提案します。この構成でよいか確認してください。
          </p>
          {session && (
            <p className="mt-2 text-xs text-ink-faint">対象の補助金：{session.subsidyTitle}</p>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-2xl flex-1 px-6 py-8">
        {session?.criteriaSource === "extracted" ? (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            ✓ この補助金の公式公募要領から審査基準（{session.criteria.length}件）を読み込みました。
          </div>
        ) : (
          <div className="mb-3 rounded-md border border-amber-200 bg-warn-soft px-4 py-3 text-xs text-warn">
            審査基準は「ものづくり・商業・サービス生産性向上促進補助金」を参考にした一般的な項目です。実際の公募要領は選択した補助金の公式サイトで必ずご確認ください。
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={extractRealCriteria}
            disabled={extracting}
            className="rounded-md border border-line px-4 py-2 text-xs font-bold text-accent-ink transition hover:border-accent disabled:opacity-50"
          >
            {extracting
              ? "読み込み中..."
              : session?.criteriaSource === "extracted"
                ? "もう一度読み込み直す（実験的）"
                : "この補助金の公式公募要領から審査基準を読み込む（実験的）"}
          </button>
        </div>
        {extractError && (
          <p className="mb-6 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-xs text-warn">{extractError}</p>
        )}

        {!hasGuidance && !loading && (
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">AIが企業情報に合わせた構成案を提案します。</p>
            <button
              onClick={generate}
              className="mt-4 rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              構成案を生成する
            </button>
            <div className="mt-4">
              <button onClick={proceed} className="text-xs font-bold text-ink-faint hover:underline">
                提案を使わずにそのまま進める →
              </button>
            </div>
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
              <button
                onClick={proceed}
                disabled={!confirmed}
                className="rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
              >
                質問に答えて書類を作る →
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
