"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StepNav from "./StepNav";
import { DRAFT_SECTION_LABELS, type ApplicationSession, type DraftSectionKey } from "@/lib/application";
import { SECTION_QUESTIONS } from "@/lib/questionBank";
import { loadSession, updateDraftSection, hasAnyAnswers } from "@/lib/session";
import { pushToCloud } from "@/lib/cloudSync";

const SECTION_ORDER: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

export default function DraftScreen() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<ApplicationSession | null>(null);
  const [loading, setLoading] = useState<Partial<Record<DraftSectionKey, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<DraftSectionKey, string>>>({});

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  async function generate(section: DraftSectionKey) {
    if (!session) return;
    setLoading((p) => ({ ...p, [section]: true }));
    setErrors((p) => ({ ...p, [section]: undefined }));
    try {
      const qa = session.draftSections.find((s) => s.key === section)?.qa ?? [];
      const criteriaIds = SECTION_QUESTIONS[section].flatMap((q) => q.coversCriteria);
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, qa, criteriaIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました。");
      const next = updateDraftSection(session, section, { content: data.content });
      setSession(next);
      pushToCloud({ session: next });
    } catch (err) {
      setErrors((p) => ({
        ...p,
        [section]: err instanceof Error ? err.message : "エラーが発生しました。",
      }));
    } finally {
      setLoading((p) => ({ ...p, [section]: false }));
    }
  }

  function editContent(section: DraftSectionKey, value: string) {
    if (!session) return;
    setSession(updateDraftSection(session, section, { content: value }));
  }

  if (!hydrated) return null;

  if (!session || !hasAnyAnswers(session)) {
    return (
      <main className="min-h-screen">
        <StepNav current={5} />
        <header className="border-b border-line bg-card">
          <div className="mx-auto max-w-2xl px-6 py-5">
            <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 5 / 7</p>
            <h1 className="mt-1 text-2xl font-black text-ink">下書き生成・編集</h1>
          </div>
        </header>
        <section className="mx-auto max-w-2xl px-6 py-8">
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">先にSTEP 4の質問に回答してください。</p>
            <Link
              href="/question"
              className="mt-4 inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              質問に回答する →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const generatedCount = session.draftSections.filter((s) => s.content?.trim()).length;

  return (
    <main className="min-h-screen">
      <StepNav current={5} />
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 5 / 7</p>
          <h1 className="mt-1 text-2xl font-black text-ink">下書き生成・編集</h1>
          <p className="mt-2 text-sm text-ink-soft">
            STEP 4での回答をもとに、AIがセクションごとに文章を作成します。内容はいつでも直接編集できます。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-2xl flex-1 px-6 py-8">
        <div className="flex flex-col gap-5">
          {SECTION_ORDER.map((section, i) => {
            const draftSection = session.draftSections.find((s) => s.key === section);
            const draft = draftSection?.content ?? "";
            const isLoading = loading[section];
            const error = errors[section];
            return (
              <div key={section} id={`section-${section}`} className="rounded-lg border border-line bg-card p-5 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-ink">
                    {i + 1}. {DRAFT_SECTION_LABELS[section]}
                  </h2>
                  <button
                    onClick={() => generate(section)}
                    disabled={isLoading}
                    className="shrink-0 rounded-md border border-line px-4 py-2 text-xs font-bold text-accent-ink transition hover:border-accent disabled:opacity-50"
                  >
                    {isLoading ? "生成中..." : draft ? "この部分だけ作り直す" : "文章を生成する"}
                  </button>
                </div>

                {error && (
                  <p className="mt-3 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
                    {error}
                  </p>
                )}

                {draft ? (
                  <textarea
                    rows={6}
                    value={draft}
                    onChange={(e) => editContent(section, e.target.value)}
                    className="mt-3 w-full rounded-md border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none focus:border-accent"
                  />
                ) : (
                  !isLoading && (
                    <p className="mt-3 text-sm text-ink-faint">
                      まだ生成していません。「文章を生成する」を押してください。
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-6 py-8 text-center">
          <p className="text-sm text-ink-soft">
            {generatedCount} / {SECTION_ORDER.length} セクション生成済み
          </p>
          <button
            onClick={() => {
              if (session) pushToCloud({ session }); // 수동 편집분이 남아있을 수 있어 이동 전 한번 더 동기화
              router.push("/checklist");
            }}
            className="mt-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            チェックリストで確認する →
          </button>
        </div>
      </section>
    </main>
  );
}
