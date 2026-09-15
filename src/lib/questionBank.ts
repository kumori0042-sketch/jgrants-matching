// 화面4(項目別対話形式入力)의 질문 설계.
//
// 설계 원칙: 화면6에서 정의한 ScoringCriterion을 먼저 놓고, "이 기준을 충족하는
// 답변을 얻으려면 뭘 물어봐야 하는가"를 역산해서 질문을 만들었다. 질문 하나가
// 여러 심사기준을 동시에 커버하기도 한다(예: 차별화 질문은 경쟁분석+고객가치 둘 다 커버).
//
// coversCriteria는 monozukuriCriteria.ts의 id를 참조 — 실제 공모요령 문구에서
// 역산했다는 추적성을 유지하기 위함. 질문 자체는 이 서비스가 새로 설계한 것.

import type { DraftSectionKey } from "./application";

export type SectionQuestion = {
  id: string;
  prompt: string; // 사용자에게 보여줄 질문
  helper?: string; // 입력 힌트(짧게 답해도 된다는 걸 계속 상기시킴)
  coversCriteria: string[]; // monozukuriCriteria.ts의 ScoringCriterion id
};

export const SECTION_QUESTIONS: Record<DraftSectionKey, SectionQuestion[]> = {
  current_situation: [
    {
      id: "cs-1",
      prompt: "この事業を通じて実現したい経営目標は何ですか？",
      helper: "例：新規市場への参入、売上◯%増、後継者への引き継ぎ準備など",
      coversCriteria: ["mgmt-goal"],
    },
    {
      id: "cs-2",
      prompt: "貴社の強み（技術・人材・設備・顧客基盤など）を教えてください。",
      helper: "一言でも構いません。後の質問で詳しく展開します。",
      coversCriteria: ["mgmt-strategy-fit"],
    },
    {
      id: "cs-3",
      prompt: "市場・顧客の動向など、外部環境で意識していることはありますか？",
      coversCriteria: ["mgmt-strategy-fit", "biz-market-analysis"],
    },
  ],

  issue: [
    {
      id: "is-1",
      prompt: "今、事業を進める上で最も大きな課題は何ですか？",
      helper: "「人手不足」「old設備で対応できない」のような一言から始めてOKです。",
      coversCriteria: ["biz-issue-solution"],
    },
    {
      id: "is-2",
      prompt: "その課題を放置すると、今後どんな影響がありますか？",
      coversCriteria: ["biz-issue-solution", "biz-target-feasibility"],
    },
  ],

  solution: [
    {
      id: "sol-1",
      prompt: "本事業で新しく導入・開発する設備・製品・サービスは何ですか？",
      coversCriteria: ["biz-issue-solution", "feas-tech"],
    },
    {
      id: "sol-2",
      prompt: "なぜ他社ではなく貴社がこれを実行できるのですか？（技術力・実績・保有設備など）",
      helper: "自慢話にならなくて大丈夫です。事実を教えてください。",
      coversCriteria: ["feas-tech"],
    },
    {
      id: "sol-3",
      prompt: "競合する他社の製品・サービスと比べて、どこが違いますか？",
      coversCriteria: ["biz-competitive-diff"],
    },
    {
      id: "sol-4",
      prompt: "想定する顧客は誰ですか？その顧客が貴社を選ぶ理由は何だと思いますか？",
      coversCriteria: ["biz-customer-value"],
    },
  ],

  business_effect: [
    {
      id: "be-1",
      prompt: "本事業により、売上・利益はどの程度向上する見込みですか？",
      helper: "「◯年後に売上◯万円」のようにざっくりで構いません。根拠は後で整理します。",
      coversCriteria: ["biz-target-feasibility"],
    },
    {
      id: "be-2",
      prompt: "地域の雇用創出や取引先への波及効果は見込めますか？",
      coversCriteria: ["policy-regional-impact"],
    },
    {
      id: "be-3",
      prompt: "この取り組みに、デジタル技術の活用や環境配慮など「新しさ」と言える要素はありますか？",
      coversCriteria: ["policy-innovation"],
    },
  ],

  financial_plan: [
    {
      id: "fp-1",
      prompt: "本事業に必要な設備投資額はいくらですか？主な内訳も教えてください。",
      coversCriteria: ["feas-cost-effectiveness"],
    },
    {
      id: "fp-2",
      prompt: "自己資金・借入など、補助金以外の資金調達の予定はありますか？",
      coversCriteria: ["feas-org-funding"],
    },
    {
      id: "fp-3",
      prompt: "実施のスケジュール（いつ何をするか）を簡単に教えてください。",
      coversCriteria: ["feas-schedule"],
    },
  ],
};

/** 특정 심사기준을 아직 아무 질문도 커버하지 않는 게 있는지 검증하는 개발용 헬퍼.
 *  질문 설계를 바꿀 때 빠뜨린 기준이 없는지 빠르게 확인하는 용도. */
export function findUncoveredCriteria(allCriteriaIds: string[]): string[] {
  const covered = new Set(
    Object.values(SECTION_QUESTIONS)
      .flat()
      .flatMap((q) => q.coversCriteria)
  );
  return allCriteriaIds.filter((id) => !covered.has(id));
}
