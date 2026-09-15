import DraftScreen from "@/components/DraftScreen";
import { MOCK_ANSWERS } from "@/lib/mockAnswers";

// 화면5 디자인/연동 확인용 프리뷰 라우트. 화면4의 답변이 실제로 저장되는
// 세션/DB가 아직 없어서, 정밀가공 부품 제조업체라는 하나의 스토리로 맞춘
// 샘플 답변(mockAnswers.ts)을 넣어 AI 생성까지 통짜로 테스트한다.
export default function DraftPreviewPage() {
  return <DraftScreen answers={MOCK_ANSWERS} />;
}
