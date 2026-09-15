import type { Subsidy } from "@/lib/jgrants";
import { formatYen, formatDate, daysUntil } from "@/lib/jgrants";

export default function SubsidyCard({ subsidy }: { subsidy: Subsidy }) {
  const remaining = daysUntil(subsidy.acceptance_end_datetime);
  const urgent = remaining !== null && remaining >= 0 && remaining <= 14;

  return (
    <a
      href={`https://www.jgrants-portal.go.jp/subsidy/${subsidy.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-lg border border-line bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-bold text-ink group-hover:text-accent-ink">
          {subsidy.title}
        </h3>
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
    </a>
  );
}
