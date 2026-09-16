"use client";

import { useRouter } from "next/navigation";
import type { Subsidy } from "@/lib/jgrants";
import { formatYen, formatDate, daysUntil } from "@/lib/jgrants";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { selectSubsidy } from "@/lib/session";

export default function SubsidyCard({ subsidy, reasons }: { subsidy: Subsidy; reasons?: string[] }) {
  const router = useRouter();
  const remaining = daysUntil(subsidy.acceptance_end_datetime);
  const urgent = remaining !== null && remaining >= 0 && remaining <= 14;
  const officialUrl = `https://www.jgrants-portal.go.jp/subsidy/${subsidy.id}`;

  function startApplication() {
    selectSubsidy({ id: subsidy.id, title: subsidy.title, url: officialUrl });
    const hasProfile = !!loadCompanyProfile();
    router.push(hasProfile ? "/structure" : "/profile");
  }

  return (
    <div className="rounded-lg border border-line bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md">
      {reasons && reasons.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {reasons.map((r, i) => (
            <span key={i} className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-ink">
              ✓ {r}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-bold text-ink">{subsidy.title}</h3>
        {remaining !== null && remaining >= 0 && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              urgent ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent-ink"
            }`}
          >
            残り{remaining}日
          </span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-faint">補助上限額</dt>
          <dd className="font-mono font-semibold text-ink">{formatYen(subsidy.subsidy_max_limit)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">対象地域</dt>
          <dd className="text-ink-soft">{subsidy.target_area_search || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">対象従業員数</dt>
          <dd className="text-ink-soft">{subsidy.target_number_of_employees || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">募集期間</dt>
          <dd className="text-ink-soft">
            {formatDate(subsidy.acceptance_start_datetime)} 〜 {formatDate(subsidy.acceptance_end_datetime)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-ink-faint transition hover:text-accent-ink"
        >
          公式サイトで詳細を見る →
        </a>
        <button
          onClick={startApplication}
          className="ml-auto rounded-md bg-accent px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
        >
          この補助金で書類作成を始める →
        </button>
      </div>
    </div>
  );
}
