import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DRAFT_SECTION_LABELS, type DraftSectionKey, type SectionQA } from "@/lib/application";
import { MONOZUKURI_CRITERIA } from "@/lib/monozukuriCriteria";
import { checkAndRecordUsage } from "@/lib/usageLimit";
import { aiUnavailableResponse } from "@/lib/aiUnavailable";

type DraftRequestBody = {
  section: DraftSectionKey;
  qa: SectionQA[];
  criteriaIds?: string[];
};

// 화면3~5 전체를 관통하는 핵심 설계 원칙(jgrants_matching_service 메모리 참고):
// "한 번에 다 써줘" 버튼은 士業 업무 대행처럼 보여 법적으로 애매하다. 그래서 이
// 프롬프트는 사용자가 실제로 답한 내용만 재료로 쓰고, 없는 사실은 만들어내지 않는다.
const SYSTEM_PROMPT = `あなたは日本の中小企業向け補助金の事業計画書作成を支援するアシスタントです。
以下のルールを必ず守ってください。

1. ユーザーが実際に回答した内容だけを使って文章を作成すること。ユーザーが述べていない事実・数値・実績を新たに作り出さないこと（ハルシネーション厳禁）。
2. 情報が不足している場合、無理に埋めず「詳細は別途ご検討ください」のような形で自然に留めること。
3. 審査員が読みやすいよう、丁寧で具体的なビジネス文書の文体に整えること（口語的な回答を、審査員向けのフォーマルな文章に変換する）。
4. 出力は日本語の段落のみ。見出し・箇条書き記号・前置き（「以下が文章です」等）は一切つけないこと。
5. 200〜400文字程度を目安にすること。`;

function buildUserPrompt(
  section: DraftSectionKey,
  qa: SectionQA[],
  criteria: { label: string; description: string }[]
) {
  const criteriaBlock = criteria.length
    ? `【このセクションで意識すべき審査観点】\n${criteria.map((c) => `- ${c.label}: ${c.description}`).join("\n")}\n\n`
    : "";

  const qaBlock = qa.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join("\n\n");

  return `【作成するセクション】${DRAFT_SECTION_LABELS[section]}\n\n${criteriaBlock}【ユーザーの回答】\n${qaBlock}\n\n上記の回答だけを根拠にして、事業計画書の「${DRAFT_SECTION_LABELS[section]}」セクションの文章を作成してください。`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return aiUnavailableResponse("draft");
  }

  let body: DraftRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const { section, qa, criteriaIds } = body;
  if (!section || !DRAFT_SECTION_LABELS[section] || !Array.isArray(qa) || qa.length === 0) {
    return NextResponse.json({ error: "section と qa は必須です。" }, { status: 400 });
  }
  const answered = qa.filter((item) => item.answer?.trim());
  if (answered.length === 0) {
    return NextResponse.json({ error: "少なくとも1つの質問に回答してください。" }, { status: 400 });
  }

  let usage: { ok: boolean; remaining: number };
  try {
    usage = await checkAndRecordUsage();
  } catch {
    // Blob 토큰 미설정 등으로 사용량 체크 자체가 실패하면, 일단 막지 않고 통과시킨다
    // (베타 단계 안전장치이지 핵심 기능이 아니므로 fail-open으로 둠).
    usage = { ok: true, remaining: -1 };
  }
  if (!usage.ok) {
    return NextResponse.json(
      { error: "本日の生成回数の上限に達しました。明日以降に再度お試しください。" },
      { status: 429 }
    );
  }

  const criteria = MONOZUKURI_CRITERIA.filter((c) => (criteriaIds ?? []).includes(c.id));

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(section, answered, criteria) }],
    });

    const content = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ content, remaining: usage.remaining });
  } catch {
    return NextResponse.json({ error: "AI生成中にエラーが発生しました。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
