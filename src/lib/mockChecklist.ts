// 화면6 UI를 지금 바로 눈으로 확인하기 위한 샘플 데이터.
// 실제 공모요령 PDF에서 추출한 게 아니라, 일본 보조금 심사에서 흔히 쓰이는
// 항목들(독자성/실현가능성/수익성/지역기여도/실시체제)을 참고해 만든 예시.
// 화면1(PDF 파싱)이 구현되면 이 자리를 실제 추출 결과로 교체한다.

import type { ChecklistResult, ScoringCriterion } from "./application";

export const MOCK_CRITERIA: ScoringCriterion[] = [
  {
    id: "c1",
    label: "事業の独自性・革新性",
    description: "他社にはない技術・アイデア・アプローチが具体的に示されているか。",
    weight: 30,
    sourceQuote: "「本事業の独自性について、既存手法との違いを明確に記載すること」",
  },
  {
    id: "c2",
    label: "実現可能性",
    description: "実施体制・スケジュール・必要な設備/人員が現実的に整っているか。",
    weight: 25,
    sourceQuote: "「実施体制図及び実施スケジュールを添付すること」",
  },
  {
    id: "c3",
    label: "収益性・事業効果",
    description: "補助事業終了後の売上・利益への具体的な効果が数値で示されているか。",
    weight: 25,
    sourceQuote: "「数値目標（売上高、利益率等）を明記すること」",
  },
  {
    id: "c4",
    label: "地域経済への貢献度",
    description: "雇用創出・地域産業との連携など、地域への波及効果があるか。",
    weight: 10,
  },
  {
    id: "c5",
    label: "資金計画の妥当性",
    description: "補助対象経費の内訳と自己資金の調達計画が明確か。",
    weight: 10,
    sourceQuote: "「経費内訳及び資金調達方法を記載すること」",
  },
];

export const MOCK_CHECKLIST_RESULTS: ChecklistResult[] = [
  {
    criterionId: "c1",
    status: "missing",
    comment:
      "既存サービスとの違いが述べられていません。「解決手段」セクションに、競合や従来手法と比較した具体的な差別化ポイントを追加してください。",
    relatedSection: "solution",
  },
  {
    criterionId: "c2",
    status: "needs_improvement",
    comment:
      "実施スケジュールは記載がありますが、担当者や必要な設備についての記述が薄いです。「現状把握」セクションで体制を補強しましょう。",
    relatedSection: "current_situation",
  },
  {
    criterionId: "c3",
    status: "sufficient",
    comment: "売上増加率と利益改善の具体的な数値目標が「事業効果」セクションに明記されています。",
    relatedSection: "business_effect",
  },
  {
    criterionId: "c4",
    status: "needs_improvement",
    comment: "雇用創出について触れられていますが、人数や職種など具体性が不足しています。",
    relatedSection: "business_effect",
  },
  {
    criterionId: "c5",
    status: "sufficient",
    comment: "補助対象経費の内訳と自己資金の割合が「収支計画」セクションに明記されています。",
    relatedSection: "financial_plan",
  },
];
