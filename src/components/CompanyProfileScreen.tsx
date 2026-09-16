"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  INDUSTRY_OPTIONS,
  PREFECTURES,
  loadCompanyProfile,
  saveCompanyProfile,
  type CompanyProfile,
} from "@/lib/companyProfile";

const EMPTY_FORM = {
  companyName: "",
  industry: "",
  employeeCount: "",
  prefecture: "",
  establishedYear: "",
  annualRevenue: "",
  representativeName: "",
};

type FormState = typeof EMPTY_FORM;

function profileToForm(p: CompanyProfile): FormState {
  return {
    companyName: p.companyName,
    industry: p.industry,
    employeeCount: p.employeeCount != null ? String(p.employeeCount) : "",
    prefecture: p.prefecture,
    establishedYear: p.establishedYear != null ? String(p.establishedYear) : "",
    annualRevenue: p.annualRevenue != null ? String(p.annualRevenue) : "",
    representativeName: p.representativeName,
  };
}

export default function CompanyProfileScreen() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = loadCompanyProfile();
    setProfile(existing);
    setForm(existing ? profileToForm(existing) : EMPTY_FORM);
    setEditing(!existing);
    setHydrated(true);
  }, []);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    if (!form.companyName.trim()) {
      setError("会社名を入力してください。");
      return;
    }
    if (!form.prefecture) {
      setError("所在地（都道府県）を選択してください。");
      return;
    }
    if (!form.employeeCount || Number.isNaN(Number(form.employeeCount))) {
      setError("従業員数を入力してください。");
      return;
    }
    setError(null);

    const next = saveCompanyProfile({
      companyName: form.companyName.trim(),
      industry: form.industry,
      employeeCount: Number(form.employeeCount),
      prefecture: form.prefecture,
      establishedYear: form.establishedYear ? Number(form.establishedYear) : null,
      annualRevenue: form.annualRevenue ? Number(form.annualRevenue) : null,
      representativeName: form.representativeName.trim(),
    });

    setProfile(next);
    setEditing(false);
    setSaved(true);
  }

  if (!hydrated) return null;

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto max-w-2xl px-6 py-5">
          <p className="text-xs font-bold tracking-wide text-accent-ink">STEP 2 / 7</p>
          <h1 className="mt-1 text-2xl font-black text-ink">企業基本情報</h1>
          <p className="mt-2 text-sm text-ink-soft">
            一度登録すると、以降の書類作成で毎回入力しなくて済みます。この情報はこのブラウザにのみ保存されます。
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-2xl flex-1 px-6 py-8">
        {!editing && profile ? (
          <div className="rounded-lg border border-line bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-ink">{profile.companyName}</h2>
              <button
                onClick={() => {
                  setEditing(true);
                  setSaved(false);
                }}
                className="shrink-0 rounded-md border border-line px-4 py-2 text-xs font-bold text-accent-ink transition hover:border-accent"
              >
                編集する
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <ProfileField label="業種" value={profile.industry || "—"} />
              <ProfileField label="所在地" value={profile.prefecture} />
              <ProfileField label="従業員数" value={`${profile.employeeCount}名`} />
              <ProfileField
                label="設立年"
                value={profile.establishedYear ? `${profile.establishedYear}年` : "—"}
              />
              <ProfileField
                label="直近売上高"
                value={profile.annualRevenue ? `¥${profile.annualRevenue.toLocaleString("ja-JP")}` : "—"}
              />
              <ProfileField label="代表者名" value={profile.representativeName || "—"} />
            </dl>

            {saved && (
              <p className="mt-4 text-xs font-bold text-accent-ink">✓ 保存しました。以降の画面で自動的に使用されます。</p>
            )}

            <Link
              href="/structure"
              className="mt-5 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              次へ：構成を確認する →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-card p-6 shadow-card">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="会社名" required>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </Field>

              <Field label="代表者名">
                <input
                  type="text"
                  value={form.representativeName}
                  onChange={(e) => handleChange("representativeName", e.target.value)}
                  className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </Field>

              <Field label="業種">
                <select
                  value={form.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="">選択してください</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>

              <Field label="所在地（都道府県）" required>
                <select
                  value={form.prefecture}
                  onChange={(e) => handleChange("prefecture", e.target.value)}
                  className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="">選択してください</option>
                  {PREFECTURES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <Field label="従業員数" required>
                <input
                  type="number"
                  min={0}
                  value={form.employeeCount}
                  onChange={(e) => handleChange("employeeCount", e.target.value)}
                  className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </Field>

              <Field label="設立年">
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.establishedYear}
                  onChange={(e) => handleChange("establishedYear", e.target.value)}
                  placeholder="例：2010"
                  className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </Field>

              <Field label="直近売上高（円）">
                <input
                  type="number"
                  min={0}
                  value={form.annualRevenue}
                  onChange={(e) => handleChange("annualRevenue", e.target.value)}
                  placeholder="例：50000000"
                  className="w-full rounded-md border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </Field>
            </div>

            {error && (
              <p className="mt-4 rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="rounded-md bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
              >
                保存する
              </button>
              {profile && (
                <button
                  onClick={() => {
                    setForm(profileToForm(profile));
                    setEditing(false);
                    setError(null);
                  }}
                  className="rounded-md border border-line px-5 py-2.5 text-sm font-bold text-ink-soft transition hover:border-accent"
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-bold text-ink">
        {label}
        {required && <span className="ml-1 text-warn">*</span>}
      </span>
      {children}
    </label>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}
