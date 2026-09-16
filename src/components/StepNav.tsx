import Link from "next/link";

// 화면 1~6(향후 7)을 관통하는 공통 스텝 내비게이션. 지금까지 화면마다
// "STEP n / 7" 텍스트만 있고 실제로 다른 단계로 돌아가는 길이 없었던 걸
// 디자인 검토 과정에서 발견 - 전 화면에 동일하게 붙여서 일관성과 이동성을 확보.
const STEPS: { n: number; label: string; href: string }[] = [
  { n: 1, label: "検索", href: "/" },
  { n: 2, label: "企業情報", href: "/profile" },
  { n: 3, label: "構成確認", href: "/structure" },
  { n: 4, label: "質問", href: "/question" },
  { n: 5, label: "下書き", href: "/draft" },
  { n: 6, label: "チェック", href: "/checklist" },
  { n: 7, label: "ダウンロード", href: "/export" },
];

export default function StepNav({ current }: { current: number }) {
  return (
    <nav aria-label="進行ステップ" className="border-b border-line bg-paper">
      <ol className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-1.5 gap-y-2 px-6 py-2.5 text-xs">
        {STEPS.map((s, i) => (
          <li key={s.n} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-ink-faint">→</span>}
            <Link
              href={s.href}
              className={`rounded-full px-2.5 py-1 font-bold transition ${
                s.n === current
                  ? "bg-accent text-white"
                  : s.n < current
                    ? "text-accent-ink hover:underline"
                    : "text-ink-faint"
              }`}
            >
              {s.n}. {s.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
