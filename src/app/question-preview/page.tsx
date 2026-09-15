import QuestionScreen from "@/components/QuestionScreen";

// 화면4 디자인 확인용 프리뷰 라우트. 실제로는 화면3(구조 제시)을 지나 이 화면에
// 도달하고, 답변은 세션에 저장되어 화면5(초안 생성)로 넘어간다.
export default function QuestionPreviewPage() {
  return <QuestionScreen />;
}
