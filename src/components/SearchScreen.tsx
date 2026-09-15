"use client";

import { useCallback, useState } from "react";
import type { Subsidy, SubsidySearchResponse } from "@/lib/jgrants";
import SubsidyCard from "./SubsidyCard";

const SORT_OPTIONS = [
  { value: "acceptance_end_datetime", label: "締切が近い順" },
  { value: "created_date", label: "新着順" },
  { value: "subsidy_max_limit", label: "補助上限額順" },
];

export default function SearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [acceptanceOnly, setAcceptanceOnly] = useState(true);
  const [sort, setSort] = useState("acceptance_end_datetime");
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC");
  const [results, setResults] = useState<Subsidy[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async () => {
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setError("検索キーワードは2文字以上で入力してください。");
      return;
    }
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        keyword: trimmed,
        sort,
        order,
        acceptance: acceptanceOnly ? "1" : "0",
      });
      const res = await fetch(`/api/subsidies?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "検索に失敗しました。");
      const parsed = data as SubsidySearchResponse;
      setResults(parsed.result ?? []);
      setCount(parsed.metadata?.resultset?.count ?? parsed.result?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "検索に失敗しました。");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [keyword, sort, order, acceptanceOnly]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">JGRANTS 連携</p>
          <h1 className="mt-1 text-2xl font-black text-ink">補助金かんたん検索</h1>
          <p className="mt-2 text-sm text-ink-soft">
            中小企業庁のjGrants公式APIから、募集中の補助金・助成金をリアルタイムで検索します。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl flex-1 px-6 py-8">
        <div className="rounded-lg border border-line bg-card p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="例）IT導入、設備投資、創業支援..."
              className="flex-1 rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              onClick={runSearch}
              disabled={loading}
              className="rounded-md bg-accent px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "検索中..." : "検索する"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-soft">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={acceptanceOnly}
                onChange={(e) => setAcceptanceOnly(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              募集中のみ表示
            </label>

            <label className="flex items-center gap-2">
              並び替え:
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-md border border-line bg-paper px-2 py-1"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => setOrder((o) => (o === "ASC" ? "DESC" : "ASC"))}
              className="rounded-md border border-line px-2 py-1 hover:border-accent"
            >
              {order === "ASC" ? "昇順 ↑" : "降順 ↓"}
            </button>
          </div>
        </div>

        <div className="mt-6">
          {error && (
            <p className="rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
              {error}
            </p>
          )}

          {!error && searched && !loading && results && (
            <p className="mb-4 text-sm text-ink-faint">
              {(count ?? results.length).toLocaleString("ja-JP")}件見つかりました
            </p>
          )}

          {!error && searched && !loading && results && results.length === 0 && (
            <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-sm text-ink-faint">
              条件に一致する補助金が見つかりませんでした。キーワードを変えてお試しください。
            </p>
          )}

          <div className="flex flex-col gap-3">
            {results?.map((s) => (
              <SubsidyCard key={s.id} subsidy={s} />
            ))}
          </div>

          {!searched && (
            <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-sm text-ink-faint">
              キーワードを入力して検索してください。
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
