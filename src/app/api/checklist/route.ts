import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DRAFT_SECTION_LABELS, type ChecklistStatus, type DraftSection } from "@/lib/application";
import { MONOZUKURI_CRITERIA } from "@/lib/monozukuriCriteria";
import { SECTION_QUESTIONS } from "@/lib/questionBank";
import { checkAndRecordUsage } from "@/lib/usageLimit";
import { aiUnavailableResponse } from "@/lib/aiUnavailable";

const VALID_STATUSES: ChecklistStatus[] = ["missing", "needs_improvement", "sufficient"];

// 어떤 기준이 주로 어느 섹션에서 다뤄지는지는 questionBank.ts의 설계에서 이미
// 역산해뒀다(화면4 질문 설계 참고) - AI에게 다시 맡기지 않고 그대로 재사용해서
// "이 기준을 보려면 어느 섹션으로 가야 하는지" 링크를 결정한다.
function primarySectionFor(criterionId: string) {
  for (const [section, questions] of Object.entries(SECTION_QUESTIONS)) {
    if (questions.some((q) => q.coversCriteria.includes(criterionId))) {
      return section as keyof typeof DRAFT_SECTION_LABELS;
    }
  }
  return undefined;
}

const SYSTEM_PROMPT = `あなたは日本の補助金審査を模擬するアシスタントです。
提出された事業計画書の下書き（5セクション）を、審査基準に照らして評価してください。

厳守事項：
- 下書きに実際に書かれている内容だけを根拠に判断すること。書かれていないことを「書かれている」と評価しないこと。
- 各審査基準について、statusは次の3つのいずれか一つだけ：
  "missing"（その観点に全く触れられていない）
  "needs_improvement"（触れてはいるが具体性・根拠が不足している）
  "sufficient"（十分に書かれている）
- commentは日本語で1〜2文、具体的に何が良い/足りないかを述べること。
- 出力は必ず次のJSON配列形式のみ。前置き・説明文・コードブロックは一切付けないこと。

[{"criterionId":"...","status":"missing","comment":"..."}, ...]`;

function buildUserPrompt(draftSections: DraftSection[]) {
  const draftBlock = draftSections
    .map((s) => `【${DRAFT_SECTION_LABELS[s.key]}】\n${s.content?.trim() || "(未記入)"}`)
    .join("\n\n");

  const criteriaBlock = MONOZUKURI_CRITERIA.map((c) => `- id:${c.id} ${c.label}: ${c.description}`).join("\n");

  return `【事業計画書の下書き】\n${draftBlock}\n\n【審査基準一覧】\n${criteriaBlock}\n\n上記の下書きを、審査基準一覧の全項目について評価し、指定のJSON配列形式で返してください。`;
}

type ChecklistRequestBody = {
  draftSections: DraftSection[];
};

function parseChecklistJson(raw: string) {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("not an array");

  const knownIds = new Set(MONOZUKURI_CRITERIA.map((c) => c.id));
  return parsed
    .filter(
      (item) =>
        item &&
        typeof item.criterionId === "string" &&
        knownIds.has(item.criterionId) &&
        VALID_STATUSES.includes(item.status) &&
        typeof item.comment === "string"
    )
    .map((item) => ({
      criterionId: item.criterionId as string,
      status: item.status as ChecklistStatus,
      comment: item.comment as string,
      relatedSection: primarySectionFor(item.criterionId),
    }));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return aiUnavailableResponse("checklist");
  }

  let body: ChecklistRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  if (!Array.isArray(body.draftSections) || body.draftSections.every((s) => !s.content?.trim())) {
    return NextResponse.json({ error: "評価する下書きがありません。先にSTEP 5で下書きを作成してください。" }, { status: 400 });
  }

  let usage: { ok: boolean; remaining: number };
  try {
    usage = await checkAndRecordUsage();
  } catch {
    usage = { ok: true, remaining: -1 };
  }
  if (!usage.ok) {
    return NextResponse.json(
      { error: "本日の生成回数の上限に達しました。明日以降に再度お試しください。" },
      { status: 429 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(body.draftSections) }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const results = parseChecklistJson(text);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "AI評価中にエラーが発生しました。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
