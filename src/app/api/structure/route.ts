import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DRAFT_SECTION_LABELS, type DraftSectionKey } from "@/lib/application";
import { MONOZUKURI_CRITERIA } from "@/lib/monozukuriCriteria";
import { checkAndRecordUsage } from "@/lib/usageLimit";
import { aiUnavailableResponse } from "@/lib/aiUnavailable";
import type { CompanyProfile } from "@/lib/companyProfile";

const SECTION_KEYS: DraftSectionKey[] = [
  "current_situation",
  "issue",
  "solution",
  "business_effect",
  "financial_plan",
];

type StructureRequestBody = {
  companyProfile: CompanyProfile;
};

// STEP 4(대화형 질문)에 들어가기 전, "이 5개 섹션 구조가 우리 회사 상황과
// 맞는지" 확인시키는 화면3용 API. 실제 기업명이나 수치를 지어내지 않고,
// 일반적인 가이드 문장만 생성하도록 프롬프트에서 제한한다.
const SYSTEM_PROMPT = `あなたは日本の中小企業向け補助金の事業計画書作成を支援するアシスタントです。
企業の基本情報と審査観点をもとに、事業計画書の5つのセクションそれぞれについて
「この企業は具体的に何を書くとよいか」を1〜2文の日本語ガイダンスとして提案してください。

厳守事項：
- 実在しない実績・数値・固有名詞を作り出さないこと。企業の業種や規模など、渡された事実のみを参照すること。
- 断定的な事業内容の提案ではなく、あくまで「何を書くべきか」というガイダンスに留めること。
- 出力は必ず次のJSON形式のみ。前置き・説明文・コードブロックは一切付けないこと。

{"current_situation":"...","issue":"...","solution":"...","business_effect":"...","financial_plan":"..."}`;

function buildUserPrompt(profile: CompanyProfile) {
  const criteriaBlock = MONOZUKURI_CRITERIA.map((c) => `- ${c.label}: ${c.description}`).join("\n");
  return `【企業情報】
業種: ${profile.industry || "未記入"}
従業員数: ${profile.employeeCount ?? "未記入"}名
所在地: ${profile.prefecture || "未記入"}
設立年: ${profile.establishedYear ?? "未記入"}

【この補助金の審査観点】
${criteriaBlock}

【事業計画書のセクション構成】
${SECTION_KEYS.map((k) => `- ${k}: ${DRAFT_SECTION_LABELS[k]}`).join("\n")}

上記を踏まえ、指定のJSON形式でセクションごとのガイダンスを返してください。`;
}

function parseStructureJson(raw: string): Partial<Record<DraftSectionKey, string>> {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  const result: Partial<Record<DraftSectionKey, string>> = {};
  for (const key of SECTION_KEYS) {
    if (typeof parsed[key] === "string") result[key] = parsed[key];
  }
  return result;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return aiUnavailableResponse("structure");
  }

  let body: StructureRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  if (!body.companyProfile || !body.companyProfile.companyName) {
    return NextResponse.json({ error: "企業情報が必要です。先にSTEP 2を完了してください。" }, { status: 400 });
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
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(body.companyProfile) }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const sections = parseStructureJson(text);
    return NextResponse.json({ sections });
  } catch {
    return NextResponse.json({ error: "AI生成中にエラーが発生しました。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
