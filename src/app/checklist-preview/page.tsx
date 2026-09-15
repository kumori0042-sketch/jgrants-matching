import ChecklistScreen from "@/components/ChecklistScreen";
import { MOCK_CRITERIA, MOCK_CHECKLIST_RESULTS } from "@/lib/mockChecklist";

// 화면6 디자인 확인용 프리뷰 라우트. 화면1(PDF파싱)~5(초안작성)가 아직 없어서
// 실제 세션 데이터를 연결할 수 없으니, 그 자리에 샘플 데이터를 넣어 UI만 먼저 검증한다.
// 실제 플로우가 만들어지면 /apply/[subsidyId]/checklist 같은 라우트로 대체될 예정.
export default function ChecklistPreviewPage() {
  return <ChecklistScreen criteria={MOCK_CRITERIA} results={MOCK_CHECKLIST_RESULTS} />;
}
