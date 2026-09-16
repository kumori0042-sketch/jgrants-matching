import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { DRAFT_SECTION_LABELS, type ApplicationSession, type DraftSectionKey } from "./application";
import type { CompanyProfile } from "./companyProfile";

const SECTION_ORDER: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

// STEP 7: 지금까지의 초안을 Word(.docx)로 내보낸다. 실제 신청은 대부분 전자신청
// 시스템에 직접 텍스트를 입력하는 방식(공모요령에 그렇게 명시돼있음)이라, 이
// 파일은 "그대로 제출하는 서류"가 아니라 신청 시스템에 복사해 넣을 때 쓰는
// 정리본이다 - 그 취지를 문서 맨 앞에도 명시해둔다.
export async function buildApplicationDocx(
  session: ApplicationSession,
  profile: CompanyProfile | null
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: "事業計画書（下書き）",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "※本ファイルはAIが生成した下書きです。実際の申請システムへ入力する前に、必ずご自身で内容を確認・修正してください。",
          italics: true,
          color: "B45309",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({ text: `対象の補助金：${session.subsidyTitle}`, spacing: { after: 100 } }),
  ];

  if (profile) {
    children.push(
      new Paragraph({ text: `企業名：${profile.companyName}` }),
      new Paragraph({ text: `業種：${profile.industry || "—"} ／ 所在地：${profile.prefecture} ／ 従業員数：${profile.employeeCount}名` }),
      new Paragraph({ text: "", spacing: { after: 200 } })
    );
  }

  for (const key of SECTION_ORDER) {
    const section = session.draftSections.find((s) => s.key === key);
    children.push(
      new Paragraph({ text: DRAFT_SECTION_LABELS[key], heading: HeadingLevel.HEADING_1, spacing: { before: 200 } }),
      new Paragraph({ text: section?.content?.trim() || "（未作成）", spacing: { after: 100 } })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
