// 화면6 UI를 지금 바로 눈으로 확인하기 위한 샘플 데이터.
// 기준(criteria)은 実際の「ものづくり補助金」第23次公募要領에서 추출한 실제 텍스트
// (monozukuriCriteria.ts 참고). status/comment는 아직 AI평가 로직이 없어서
// 화면 검증용으로 임의 배정한 것 — 화면5(초안생성)+AI평가가 만들어지면 이 자리를
// 실제 평가 결과로 교체한다.

import type { ChecklistResult } from "./application";
import { MONOZUKURI_CRITERIA } from "./monozukuriCriteria";

export const MOCK_CRITERIA = MONOZUKURI_CRITERIA;

export const MOCK_CHECKLIST_RESULTS: ChecklistResult[] = [
  {
    criterionId: "mgmt-goal",
    status: "sufficient",
    comment: "「3年で売上を2割伸ばす」という経営目標が現状把握セクションに具体的に記載されています。",
    relatedSection: "current_situation",
  },
  {
    criterionId: "mgmt-strategy-fit",
    status: "needs_improvement",
    comment: "自社の強みは書かれていますが、外部環境（市場動向）との関連づけが弱いです。",
    relatedSection: "current_situation",
  },
  {
    criterionId: "biz-target-feasibility",
    status: "needs_improvement",
    comment: "売上目標はありますが、その数値の算出根拠が明記されていません。",
    relatedSection: "business_effect",
  },
  {
    criterionId: "biz-issue-solution",
    status: "sufficient",
    comment: "現在の課題（老朽化した設備）と、その解決手段（新設備の導入）が明確に対応しています。",
    relatedSection: "issue",
  },
  {
    criterionId: "biz-market-analysis",
    status: "missing",
    comment: "対象市場の規模や今後の成長性についての記述が見当たりません。「現状把握」セクションに追加してください。",
    relatedSection: "current_situation",
  },
  {
    criterionId: "biz-customer-value",
    status: "sufficient",
    comment: "想定顧客と、その顧客が選ぶ理由が「解決手段」セクションに具体的に書かれています。",
    relatedSection: "solution",
  },
  {
    criterionId: "biz-competitive-diff",
    status: "missing",
    comment: "競合他社との比較・差別化ポイントの記述がありません。「解決手段」セクションに追加しましょう。",
    relatedSection: "solution",
  },
  {
    criterionId: "feas-tech",
    status: "sufficient",
    comment: "自社が保有する技術・実績が具体的に記載され、優位性が伝わります。",
    relatedSection: "solution",
  },
  {
    criterionId: "feas-org-funding",
    status: "needs_improvement",
    comment: "自己資金の割合は書かれていますが、借入予定の有無が不明です。",
    relatedSection: "financial_plan",
  },
  {
    criterionId: "feas-schedule",
    status: "sufficient",
    comment: "実施スケジュールが月単位で明記されています。",
    relatedSection: "financial_plan",
  },
  {
    criterionId: "feas-cost-effectiveness",
    status: "needs_improvement",
    comment: "投資額は明記されていますが、想定される売上・収益規模との対応関係が薄いです。",
    relatedSection: "financial_plan",
  },
  {
    criterionId: "policy-regional-impact",
    status: "needs_improvement",
    comment: "雇用創出について触れられていますが、具体的な人数や職種が不足しています。",
    relatedSection: "business_effect",
  },
  {
    criterionId: "policy-innovation",
    status: "sufficient",
    comment: "デジタル技術の活用による新しい取り組みである点が明記されています。",
    relatedSection: "business_effect",
  },
];
