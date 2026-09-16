"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StepNav from "./StepNav";
import { DRAFT_SECTION_LABELS, type ApplicationSession, type DraftSectionKey } from "@/lib/application";
import { loadCompanyProfile, type CompanyProfile } from "@/lib/companyProfile";
import { loadSession, hasAnyDrafts } from "@/lib/session";
import { buildApplicationDocx, downloadBlob } from "@/lib/exportDocx";

const SECTION_ORDER: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

export default function ExportScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<ApplicationSession | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
    setProfile(loadCompanyProfile());
    setHydrated(true);
  }, []);

  async function handleDownload() {
    if (!session) return;
    setDownloading(true);
    setError(null);
    try {
      const blob = await buildApplicationDocx(session, profile);
      const filename = `事業計画書_${profile?.companyName ?? "下書き"}.docx`;
      downloadBlob(blob, filename);
    } catch {
      setError("ダウンロード中にエラーが発生しました。");
    } finally {
      setDownloading(false);
    }
  }

  if (!hydrated) return null;

  if (!session || !hasAnyDrafts(session)) {
    return (
      <main className="min-h-screen">
        <StepNav current={7} />
        <header className="border-b border-line bg-card">
          <div className="mx-auto max-w-2xl px-6 py-5">
            <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 7 / 7</p>
            <h1 className="mt-1 text-2xl font-black text-ink">書類のダウンロード</h1>
          </div>
        </header>
        <section className="mx-auto max-w-2xl px-6 py-8">
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

  return (
    <main className="min-h-screen">
      <StepNav current={7} />
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 7 / 7</p>
          <h1 className="mt-1 text-2xl font-black text-ink">書類のダウンロード</h1>
          <p className="mt-2 text-sm text-ink-soft">
            ここまでの下書きをWord形式でまとめます。対象の補助金：{session.subsidyTitle}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-2xl flex-1 px-6 py-8">
        <div className="rounded-lg border border-amber-200 bg-warn-soft px-5 py-4 text-sm text-warn">
          <strong className="font-bold">これはあくまで下書きです。</strong>
          {" "}多くの補助金は電子申請システムへ直接テキストを入力する方式のため、このファイルは提出書類そのものではなく、入力時に使う下書き・控えとしてご利用ください。提出前に必ずご自身で内容を確認・修正してください。
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {SECTION_ORDER.map((key, i) => {
            const content = session.draftSections.find((s) => s.key === key)?.content;
            return (
              <div key={key} className="rounded-lg border border-line bg-card p-5 shadow-card">
                <h2 className="text-sm font-bold text-ink">
                  {i + 1}. {DRAFT_SECTION_LABELS[key]}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                  {content?.trim() || "（未作成）"}
                </p>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>
        )}

        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-8 text-center">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {downloading ? "作成中..." : "Word形式でダウンロード"}
          </button>
          {session.subsidyUrl && (
            <a
              href={session.subsidyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-accent-ink hover:underline"
            >
              公式の申請サイトへ移動する →
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
