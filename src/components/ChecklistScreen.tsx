"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StepNav from "./StepNav";
import type { ApplicationSession, ChecklistResult, ChecklistStatus, ScoringCriterion } from "@/lib/application";
import {
  CHECKLIST_STATUS_META,
  DRAFT_SECTION_LABELS,
  summarizeChecklist,
} from "@/lib/application";
import { loadSession, saveSession, hasAnyDrafts } from "@/lib/session";
import { pushToCloud } from "@/lib/cloudSync";

const STATUS_STYLE: Record<ChecklistStatus, { dot: string; badge: string }> = {
  missing: { dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  needs_improvement: {
    dot: "bg-amber-500",
    badge: "bg-warn-soft text-warn border-amber-200",
  },
  sufficient: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function ChecklistScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<ApplicationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  async function evaluate() {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftSections: session.draftSections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "評価に失敗しました。");
      const next = saveSession({ ...session, checklistResults: data.results ?? [] });
      setSession(next);
      pushToCloud({ session: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  if (!session || !hasAnyDrafts(session)) {
    return (
      <main className="min-h-screen">
        <StepNav current={6} />
        <header className="border-b border-line bg-card">
          <div className="mx-auto max-w-3xl px-6 py-5">
            <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 6 / 7</p>
            <h1 className="mt-1 text-2xl font-black text-ink">審査基準チェックリスト</h1>
          </div>
        </header>
        <section className="mx-auto max-w-3xl px-6 py-8">
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">先にSTEP 5で下書きを作成してください。</p>
            <Link
              href="/draft"
              className="mt-4 inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              下書きを作成する →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const criteria: ScoringCriterion[] = session.criteria;
  const results: ChecklistResult[] = session.checklistResults;
  const byId = new Map(criteria.map((c) => [c.id, c]));
  const summary = summarizeChecklist(results);
  const sorted = [...results].sort(
    (a, b) => CHECKLIST_STATUS_META[a.status].order - CHECKLIST_STATUS_META[b.status].order
  );

  return (
    <main className="min-h-screen">
      <StepNav current={6} />
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 6 / 7</p>
          <h1 className="mt-1 text-2xl font-black text-ink">審査基準チェックリスト</h1>
          <p className="mt-2 text-sm text-ink-soft">
            STEP 1で読み取った審査項目と、ここまでの下書きを照らし合わせて確認します。
          </p>
          <p className="mt-2 text-xs text-ink-faint">対象の補助金：{session.subsidyTitle}</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl flex-1 px-6 py-8">
        <div className="rounded-lg border border-amber-200 bg-warn-soft px-5 py-4 text-sm text-warn">
          <strong className="font-bold">これはAIによる参考チェックです。</strong>
          {" "}最終提出前に、必ずご自身で内容を確認・修正してください。この結果は提出書類の完成や合格を保証するものではありません。
          {session.criteriaSource === "reference" && (
            <>
              {" "}審査基準は「ものづくり・商業・サービス生産性向上促進補助金」を参考にした一般的な項目です（STEP 3で実際の公募要領から読み込み直せます）。
            </>
          )}
        </div>

        {results.length === 0 && !loading && (
          <div className="mt-6 rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">下書きを審査基準と照らし合わせて評価します。</p>
            <button
              onClick={evaluate}
              className="mt-4 rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              評価する
            </button>
          </div>
        )}

        {loading && <p className="py-10 text-center text-sm text-ink-faint">評価中...</p>}

        {error && (
          <p className="mt-4 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
        )}

        {results.length > 0 && (
          <>
            <div className="mt-5 flex flex-wrap gap-3">
              <SummaryTile label="審査項目" value={summary.total} tone="neutral" />
              <SummaryTile label="未対応" value={summary.missing} tone="missing" />
              <SummaryTile label="要改善" value={summary.needsImprovement} tone="needs_improvement" />
              <SummaryTile label="十分" value={summary.sufficient} tone="sufficient" />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={evaluate}
                disabled={loading}
                className="rounded-md border border-line px-4 py-2 text-xs font-bold text-accent-ink transition hover:border-accent disabled:opacity-50"
              >
                最新の下書きで再評価する
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {sorted.map((result) => {
                const criterion = byId.get(result.criterionId);
                if (!criterion) return null;
                const style = STATUS_STYLE[result.status];
                return (
                  <div key={result.criterionId} className="rounded-lg border border-line bg-card p-5 shadow-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                        <div>
                          <h3 className="text-base font-bold text-ink">{criterion.label}</h3>
                          <p className="mt-0.5 text-xs text-ink-faint">{criterion.description}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${style.badge}`}>
                          {CHECKLIST_STATUS_META[result.status].label}
                        </span>
                        {criterion.weight != null && (
                          <span className="text-xs text-ink-faint">配点 {criterion.weight}</span>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 rounded-md bg-paper px-4 py-3 text-sm text-ink-soft">{result.comment}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      {result.relatedSection && (
                        <Link
                          href={`/draft#section-${result.relatedSection}`}
                          className="font-bold text-accent-ink hover:underline"
                        >
                          {DRAFT_SECTION_LABELS[result.relatedSection]} セクションを見る →
                        </Link>
                      )}
                      {criterion.sourceQuote && (
                        <span className="text-ink-faint">公募要領: {criterion.sourceQuote}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-8 text-center">
              <p className="text-sm text-ink-soft">
                {summary.missing > 0
                  ? `未対応の項目が${summary.missing}件あります。可能であれば先に見直すことをおすすめします。`
                  : "主要項目は一通り確認できています。"}
              </p>
              <Link
                href="/export"
                className="mt-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
              >
                書類のダウンロードへ進む →
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | ChecklistStatus;
}) {
  const toneClass =
    tone === "missing"
      ? "text-red-600"
      : tone === "needs_improvement"
        ? "text-warn"
        : tone === "sufficient"
          ? "text-emerald-600"
          : "text-ink";
  return (
    <div className="flex-1 min-w-[110px] rounded-lg border border-line bg-card px-4 py-3 text-center shadow-card">
      <div className={`text-2xl font-black ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs text-ink-faint">{label}</div>
    </div>
  );
}
