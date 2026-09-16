"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StepNav from "./StepNav";
import { DRAFT_SECTION_LABELS, type ApplicationSession, type DraftSectionKey, type SectionQA } from "@/lib/application";
import { SECTION_QUESTIONS } from "@/lib/questionBank";
import { MONOZUKURI_CRITERIA } from "@/lib/monozukuriCriteria";
import { loadSession, updateDraftSection } from "@/lib/session";
import { pushToCloud } from "@/lib/cloudSync";

const SECTION_ORDER: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

const criteriaById = new Map(MONOZUKURI_CRITERIA.map((c) => [c.id, c]));

function answersFromSession(session: ApplicationSession, key: DraftSectionKey): Record<string, string> {
  const qa = session.draftSections.find((s) => s.key === key)?.qa ?? [];
  const questions = SECTION_QUESTIONS[key];
  const out: Record<string, string> = {};
  questions.forEach((q, i) => {
    out[q.id] = qa[i]?.answer ?? "";
  });
  return out;
}

export default function QuestionScreen() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<ApplicationSession | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const s = loadSession();
    setSession(s);
    if (s) setAnswers(answersFromSession(s, SECTION_ORDER[0]));
    setHydrated(true);
  }, []);

  function persistSection(key: DraftSectionKey, currentAnswers: Record<string, string>) {
    if (!session) return session;
    const qa: SectionQA[] = SECTION_QUESTIONS[key].map((q) => ({
      question: q.prompt,
      answer: currentAnswers[q.id] ?? "",
    }));
    const next = updateDraftSection(session, key, { qa });
    setSession(next);
    pushToCloud({ session: next }); // 섹션 넘어갈 때마다 체크포인트 동기화 (키 입력마다는 안 함)
    return next;
  }

  function goToSection(nextIndex: number) {
    const key = SECTION_ORDER[sectionIndex];
    const next = persistSection(key, answers);
    const clamped = Math.max(0, Math.min(SECTION_ORDER.length - 1, nextIndex));
    setSectionIndex(clamped);
    if (next) setAnswers(answersFromSession(next, SECTION_ORDER[clamped]));
  }

  function finish() {
    persistSection(SECTION_ORDER[sectionIndex], answers);
    router.push("/draft");
  }

  if (!hydrated) return null;

  if (!session) {
    return (
      <main className="min-h-screen">
        <StepNav current={4} />
        <header className="border-b border-line bg-card">
          <div className="mx-auto max-w-2xl px-6 py-5">
            <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 4 / 7</p>
            <h1 className="mt-1 text-2xl font-black text-ink">質問</h1>
          </div>
        </header>
        <section className="mx-auto max-w-2xl px-6 py-8">
          <div className="rounded-lg border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">先にSTEP 3で構成を確認してください。</p>
            <Link
              href="/structure"
              className="mt-4 inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              構成の確認へ →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const sectionKey = SECTION_ORDER[sectionIndex];
  const questions = SECTION_QUESTIONS[sectionKey];
  const isLast = sectionIndex === SECTION_ORDER.length - 1;
  const isFirst = sectionIndex === 0;
  const answeredInSection = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;

  return (
    <main className="min-h-screen">
      <StepNav current={4} />
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">
            STEP 4 / 7 &middot; {sectionIndex + 1} / {SECTION_ORDER.length} セクション
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink">
            {DRAFT_SECTION_LABELS[sectionKey]}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            短く答えるだけで大丈夫です。あとでAIが審査員に伝わる文章に整えます。
          </p>
          <SectionProgress current={sectionIndex} total={SECTION_ORDER.length} />
        </div>
      </header>

      <section className="mx-auto max-w-2xl flex-1 px-6 py-8">
        <div className="flex flex-col gap-5">
          {questions.map((q) => (
            <div key={q.id} className="rounded-lg border border-line bg-card p-5 shadow-card">
              <label htmlFor={q.id} className="block text-sm font-bold text-ink">
                {q.prompt}
              </label>
              {q.helper && <p className="mt-1 text-xs text-ink-faint">{q.helper}</p>}

              <textarea
                id={q.id}
                rows={3}
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="思いつくままで構いません…"
                className="mt-3 w-full rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-accent"
              />

              <div className="mt-2 flex flex-wrap gap-1.5">
                {q.coversCriteria.map((cid) => {
                  const c = criteriaById.get(cid);
                  if (!c) return null;
                  return (
                    <span
                      key={cid}
                      className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold text-accent-ink"
                      title={c.description}
                    >
                      審査：{c.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => goToSection(sectionIndex - 1)}
            disabled={isFirst}
            className="rounded-md border border-line px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-accent disabled:opacity-40"
          >
            ← 前のセクション
          </button>

          <p className="text-xs text-ink-faint">
            {answeredInSection} / {questions.length} 件回答済み
          </p>

          <button
            onClick={() => goToSection(sectionIndex + 1)}
            disabled={isLast}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            次のセクション →
          </button>
        </div>

        {isLast && (
          <div className="mt-8 rounded-lg border border-dashed border-line px-6 py-8 text-center">
            <p className="text-sm text-ink-soft">
              すべてのセクションに回答したら、AIが下書き文章を生成します（STEP 5）。
            </p>
            <button
              onClick={finish}
              className="mt-3 rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110"
            >
              下書きを生成する →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function SectionProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mt-4 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i <= current ? "bg-accent" : "bg-line"}`}
        />
      ))}
    </div>
  );
}
