import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkAndRecordUsage } from "@/lib/usageLimit";
import { aiUnavailableResponse } from "@/lib/aiUnavailable";
import type { CompanyProfile } from "@/lib/companyProfile";

// 화면1: 企業情報(화면2에서 등록한 선택 항목 포함)를 바탕으로 jGrants 검색에 쓸
// 키워드를 제안받는다. 실재하지 않는 보조금명을 지어내지 않도록, "검색 키워드"만
// 제안하게 하고 실제 결과는 항상 기존 jGrants 공식 API(/api/subsidies)로 조회한다.
const SYSTEM_PROMPT = `あなたは日本の中小企業向け補助金・助成金の検索アシスタントです。
企業の情報をもとに、jGrants（補助金検索システム）で検索するのに適したキーワードを提案してください。

厳守事項：
- 実在しない補助金名を作り出さないこと。あくまで検索に使う一般的なキーワード（例：「設備投資」「IT導入」「海外展開」）を提案すること。
- 2〜4個のキーワードを、日本語の単語または短いフレーズで提案すること。
- 出力は必ず次のJSON配列形式のみ。前置き・説明文・コードブロックは一切付けないこと。

[{"keyword":"...","reason":"..."}, ...]

reasonは日本語で1文、企業のどの情報に基づく提案かを簡潔に述べること。`;

function buildUserPrompt(profile: CompanyProfile) {
  return `【企業情報】
業種: ${profile.industry || "未記入"}
従業員数: ${profile.employeeCount ?? "未記入"}名
所在地: ${profile.prefecture || "未記入"}
経営課題: ${(profile.businessChallenges ?? []).join("、") || "未記入"}
投資予定分野: ${(profile.investmentAreas ?? []).join("、") || "未記入"}

上記の企業に適した補助金を探すための検索キーワードを、指定のJSON形式で提案してください。`;
}

type RecommendRequestBody = {
  companyProfile: CompanyProfile;
};

function parseRecommendJson(raw: string) {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("not an array");
  return parsed
    .filter(
      (item) =>
        item && typeof item.keyword === "string" && item.keyword.trim().length >= 2 && typeof item.reason === "string"
    )
    .slice(0, 4)
    .map((item) => ({ keyword: item.keyword.trim(), reason: item.reason as string }));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return aiUnavailableResponse("recommend");
  }

  let body: RecommendRequestBody;
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
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(body.companyProfile) }],
    });

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const keywords = parseRecommendJson(text);
    return NextResponse.json({ keywords });
  } catch {
    return NextResponse.json({ error: "AI提案中にエラーが発生しました。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
