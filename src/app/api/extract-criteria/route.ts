import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
// pdf-parse의 패키지 진입점(index.js)은 번들러 환경에서 module.parent 감지가
// 어긋나 "디버그 모드"로 빠지며 존재하지 않는 테스트 PDF를 읽으려 시도하는
// 알려진 문제가 있다 - 내부 lib 파일을 직접 불러와서 우회한다.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import { checkAndRecordUsage } from "@/lib/usageLimit";

// Vercel 서버리스 기본 실행시간(10초)로는 PDF 여러 개 파싱+AI 호출이 빠듯할 수 있어 연장.
// (Hobby 플랜에서 Fluid Compute가 꺼져있으면 실제로는 여전히 10초로 제한될 수 있음 —
// 그 경우 이 라우트만 타임아웃날 수 있는데, 화면3에서는 실패해도 참고 심사기준으로
// 계속 진행 가능하므로 서비스 전체가 막히지는 않는다.)
export const maxDuration = 60;

const JGRANTS_DETAIL = "https://api.jgrants-portal.go.jp/exp/v1/public/subsidies/id";
const MAX_COMBINED_CHARS = 40000;

type Attachment = { name?: string; data?: string };

// 화면1에서 어떤 보조금을 선택하든 심사기준은 지금까지 "ものづくり補助金"
// 참고셋 고정이었던 한계를 푸는 라우트. jGrants 상세 API의 application_guidelines
// 필드에 공모요령 PDF가 base64로 직접 들어있다는 걸 실제 API 호출로 확인하고 만듦.
// 문서 이름이 파일마다 제각각이라 "이게 진짜 공모요령이다" 식으로 하나만 고르지 않고,
// 용량이 큰 첨부부터 순서대로 텍스트를 뽑아 합친 뒤(최대 4만자) AI가 그 안에서
// 심사기준을 찾게 한다 — 신뢰도가 100%는 아니라서 화면3에서 "実験的機能"으로 노출.
const SYSTEM_PROMPT = `あなたは日本の補助金公募要領を分析するアシスタントです。
渡されたテキストは、ある補助金の公募要領・実施要領等のPDFから抽出したものです。
その中から、実際の審査基準・評価項目（審査でどのような観点から評価されるか）を抽出してください。

厳守事項：
- テキストに実際に書かれている内容だけを抽出すること。書かれていない基準を作り出さないこと。
- テキスト中に審査基準らしきものが見つからない場合は、空配列を返すこと（無理に何かを作らない）。
- 各基準について、label（短い見出し、15文字程度）、description（何を評価するか、1文）、
  sourceQuote（該当箇所の原文、100文字程度まで）を含めること。
- 最大15項目まで。
- 出力は必ず次のJSON配列形式のみ。前置き・説明文・コードブロックは一切付けないこと。

[{"label":"...","description":"...","sourceQuote":"..."}, ...]`;

function slugify(label: string, index: number): string {
  const base = label.replace(/[^\p{L}\p{N}]+/gu, "").slice(0, 12);
  return `extracted-${index}-${base || index}`;
}

function parseCriteriaJson(raw: string) {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("not an array");
  return parsed
    .filter((item) => item && typeof item.label === "string" && typeof item.description === "string")
    .slice(0, 15)
    .map((item, i) => ({
      id: slugify(item.label, i),
      label: item.label as string,
      description: item.description as string,
      sourceQuote: typeof item.sourceQuote === "string" ? item.sourceQuote : undefined,
    }));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "サーバーにANTHROPIC_API_KEYが設定されていません。Vercelの環境変数を確認してください。" },
      { status: 500 }
    );
  }

  let body: { subsidyId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }
  if (!body.subsidyId) {
    return NextResponse.json({ error: "subsidyIdが必要です。" }, { status: 400 });
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

  let attachments: Attachment[];
  try {
    const detailRes = await fetch(`${JGRANTS_DETAIL}/${encodeURIComponent(body.subsidyId)}`, {
      headers: { Accept: "application/json" },
    });
    if (!detailRes.ok) {
      return NextResponse.json({ error: `jGrants詳細取得エラー (${detailRes.status})` }, { status: 502 });
    }
    const detail = await detailRes.json();
    attachments = detail?.result?.[0]?.application_guidelines ?? [];
  } catch {
    return NextResponse.json({ error: "jGrants詳細の取得に失敗しました。" }, { status: 502 });
  }

  if (attachments.length === 0) {
    return NextResponse.json(
      { error: "この補助金には公募要領などの添付ファイルが登録されていません。参考の審査基準を引き続きご利用ください。" },
      { status: 404 }
    );
  }

  const sorted = [...attachments].sort((a, b) => (b.data?.length ?? 0) - (a.data?.length ?? 0));
  let combinedText = "";
  let usedCount = 0;
  for (const att of sorted) {
    if (combinedText.length >= MAX_COMBINED_CHARS || !att.data) continue;
    try {
      const buf = Buffer.from(att.data, "base64");
      const parsed = await pdfParse(buf);
      if (parsed.text?.trim()) {
        combinedText += `\n\n--- ${att.name || "文書"} ---\n${parsed.text}`;
        usedCount += 1;
      }
    } catch {
      // 개별 파일 파싱 실패는 스킵하고 나머지 계속 시도
    }
  }
  combinedText = combinedText.slice(0, MAX_COMBINED_CHARS);

  if (!combinedText.trim()) {
    return NextResponse.json(
      { error: "添付PDFからテキストを抽出できませんでした（画像スキャンの可能性があります）。参考の審査基準を引き続きご利用ください。" },
      { status: 422 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: combinedText }],
    });
    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const criteria = parseCriteriaJson(text);

    if (criteria.length === 0) {
      return NextResponse.json(
        { error: "PDFから審査基準を見つけられませんでした。参考の審査基準を引き続きご利用ください。" },
        { status: 422 }
      );
    }

    return NextResponse.json({ criteria, documentsUsed: usedCount });
  } catch {
    return NextResponse.json({ error: "AI抽出中にエラーが発生しました。時間をおいて再度お試しください。" }, { status: 502 });
  }
}
