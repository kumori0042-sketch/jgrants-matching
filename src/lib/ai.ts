import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// AI 공급자. 무료 티어가 있는 Groq를 우선 쓰고, 없으면 Anthropic(유료) 키가 있을 때만 대체로 쓴다.
export type AiProvider = "groq" | "anthropic";

export function aiProvider(): AiProvider | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

const GROQ_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
// llama-3.3-70b-versatile는 Groq에서 단종됨(2026-09 확인, 404 model_not_found).
// 현재 무료 티어에서 쓸 수 있는 모델 중 gpt-oss-120b가 일본어 품질이 가장 안정적이었음.
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface GenerateArgs {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
}

const MAX_GROQ_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqOnce(args: GenerateArgs): Promise<string> {
  const { system, user, maxTokens, temperature } = args;
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature,
      max_tokens: maxTokens,
      // gpt-oss 계열은 추론 모델이라 reasoning_effort를 안 주면 답변 전에 하는 "생각"이
      // max_tokens를 예측 불가능하게 다 먹어버려 content가 빈 문자열로 오는 경우가 실측 5회 중
      // 3회꼴로 발생했다(finish_reason:"length"). low로 고정하니 5/5 안정적으로 답변이 나옴.
      reasoning_effort: "low",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const retryAfterHeader = res.headers.get("retry-after");
    const err = new AiError(`Groq ${res.status}: ${detail.slice(0, 300)}`, res.status);
    // 실측: 무료 티어는 분당 토큰 한도가 빡빡하지만(8000 TPM) 토큰 버킷이 1초 미만으로
    // 빠르게 다시 차므로, 짧게 기다렸다 재시도하면 대부분 통과한다. Retry-After 헤더가
    // 오면 그 값을 우선한다.
    (err as AiError & { retryAfterMs?: number }).retryAfterMs = retryAfterHeader
      ? Number(retryAfterHeader) * 1000
      : undefined;
    throw err;
  }
  const data = await res.json();
  const content = String(data?.choices?.[0]?.message?.content ?? "").trim();
  if (!content) {
    // reasoning_effort:low로도 드물게 비어 올 수 있다 - 429와 동일하게 재시도 대상으로 다룬다.
    throw new AiError("Groq returned empty content", 429);
  }
  return content;
}

export async function generateText({ system, user, maxTokens, temperature = 0.3 }: GenerateArgs): Promise<string> {
  const provider = aiProvider();

  if (provider === "groq") {
    let lastError: AiError | null = null;
    for (let attempt = 0; attempt <= MAX_GROQ_RETRIES; attempt++) {
      try {
        return await callGroqOnce({ system, user, maxTokens, temperature });
      } catch (err) {
        const aiErr = err instanceof AiError ? err : new AiError(String(err), 502);
        lastError = aiErr;
        const retryable = aiErr.status === 429;
        if (!retryable || attempt === MAX_GROQ_RETRIES) throw aiErr;
        const delay = (aiErr as AiError & { retryAfterMs?: number }).retryAfterMs ?? DEFAULT_RETRY_DELAY_MS * (attempt + 1);
        await sleep(Math.min(delay, 5000));
      }
    }
    // 위 루프는 항상 return이나 throw로 끝나지만, 타입상 도달 가능성을 남겨둔다.
    throw lastError ?? new AiError("Groq call failed", 502);
  }

  if (provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    return message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
  }

  throw new AiError("No AI provider is configured", 503);
}

// AI 호출 실패를 고객용 안내로 바꾼다. 실제 원인은 서버 로그에만 남긴다.
export function aiFailureResponse(routeName: string, err: unknown, fallbackMessage: string) {
  console.error(`[${routeName}] AI call failed:`, err instanceof Error ? err.message : err);
  if (err instanceof AiError && err.status === 429) {
    return NextResponse.json(
      { error: "AIサービスが混み合っています。1分ほど待ってから、もう一度お試しください。" },
      { status: 429 }
    );
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 502 });
}
