// 화면4(대화형 답변)가 실제로 저장되는 세션/DB가 아직 없어서, 화면5(초안생성)를
// 지금 눈으로 확인하기 위한 샘플 답변. mockChecklist.ts의 코멘트("老朽化した設備",
// "3年で売上を2割伸ばす" 등)와 일관되도록, 정밀가공 부품 제조업체라는 하나의
// 스토리로 맞춰서 작성했다 — 화면4→5→6이 같은 이야기로 이어지는지 확인하기 위함.

import type { DraftSectionKey, SectionQA } from "./application";
import { SECTION_QUESTIONS } from "./questionBank";

function qa(section: DraftSectionKey, answers: string[]): SectionQA[] {
  return SECTION_QUESTIONS[section].map((q, i) => ({
    question: q.prompt,
    answer: answers[i] ?? "",
  }));
}

export const MOCK_ANSWERS: Record<DraftSectionKey, SectionQA[]> = {
  current_situation: qa("current_situation", [
    "3年で売上を2割伸ばしたい。今の主力製品だけだと頭打ちなので、新しく高付加価値の製品ラインを作りたい。",
    "金属の精密加工を30年やってきた技術者が3人いる。地元の取引先との関係も長い。",
    "取引先から、もっと精密な部品を求められることが増えている。市場自体は伸びていると聞く。",
  ]),
  issue: qa("issue", [
    "今使っている加工機が古くて、精密な加工の注文を断らざるを得ないことがある。",
    "このままだと取引先が離れていく可能性がある。若い技術者も入ってきにくい。",
  ]),
  solution: qa("solution", [
    "最新の精密加工機を導入して、今より細かい公差の加工ができるようにしたい。",
    "30年精密加工をやってきた実績があるし、技術者も資格を持っている。",
    "近くの同業者は汎用機しか持っていないので、高精度の仕事はあまり取れていないはず。",
    "今の取引先に加えて、精度に厳しい医療機器部品のメーカーも新たに狙いたい。",
  ]),
  business_effect: qa("business_effect", [
    "3年後に売上を2割くらい増やしたい。今より単価の高い仕事が取れるはず。",
    "新しい仕事が増えれば、1〜2人くらい新規で雇いたい。",
    "新しい機械は加工データをそのまま取り込めるので、今までよりデジタルに管理できるようになる。",
  ]),
  financial_plan: qa("financial_plan", [
    "機械本体でだいたい2000万円くらい。設置工事も含めるともう少し。",
    "半分は自己資金で、残りは地元の信用金庫から借り入れる予定。",
    "発注から納品まで3ヶ月、その後1ヶ月かけて試運転と社員研修をする。",
  ]),
};
