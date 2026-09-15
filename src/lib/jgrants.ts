export type Subsidy = {
  id: string;
  name: string;
  title: string;
  target_area_search: string;
  subsidy_max_limit: number;
  acceptance_start_datetime: string;
  acceptance_end_datetime: string;
  target_number_of_employees: string;
  institution_name: string | null;
};

export type SubsidySearchResponse = {
  metadata?: { type?: string; resultset?: { count?: number } };
  result: Subsidy[];
};

export function formatYen(amount: number): string {
  if (!amount) return "—";
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function daysUntil(iso: string): number | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
}
