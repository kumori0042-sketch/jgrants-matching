"use client";

import { useEffect, useState } from "react";

type MetricsData = {
  counts: Record<string, number>;
  checklistImproved: number;
  activationRate: number | null;
};

const LABELS: Record<string, string> = {
  search_performed: "検索が実行された回数",
  start_application_click: "「書類作成を始める」クリック数",
  draft_all_sections_completed: "下書き5セクション完了数",
  checklist_reevaluated: "チェックリスト再評価の回数",
  content_report: "「事実と違う」報告数",
};

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("読み込みに失敗しました。"));
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-xs font-bold tracking-wide text-accent-ink">INTERNAL</p>
      <h1 className="mt-1 text-2xl font-black text-ink">成功指標（簡易集計）</h1>
      <p className="mt-2 text-sm text-ink-soft">
        PRDの成功指標に対応する生の件数です。ベータの規模ではこれで十分と考え、ダッシュボードは作っていません。
      </p>

      {error && <p className="mt-6 text-sm text-warn">{error}</p>}
      {!data && !error && <p className="mt-6 text-sm text-ink-faint">読み込み中...</p>}

      {data && (
        <div className="mt-6 space-y-3">
          {Object.entries(LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-line bg-card px-5 py-4">
              <span className="text-sm text-ink-soft">{label}</span>
              <span className="font-mono text-lg font-bold text-ink">{data.counts[key] ?? 0}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent-soft px-5 py-4">
            <span className="text-sm text-ink-soft">活性化率（開始クリック ÷ 検索）</span>
            <span className="font-mono text-lg font-bold text-accent-ink">
              {data.activationRate === null ? "—" : `${(data.activationRate * 100).toFixed(1)}%`}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4">
            <span className="text-sm text-ink-soft">「不足」→「十分」に改善した審査項目の累計</span>
            <span className="font-mono text-lg font-bold text-emerald-700">{data.checklistImproved}</span>
          </div>
        </div>
      )}
    </main>
  );
}
