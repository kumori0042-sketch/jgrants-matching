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
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

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

export async function generateText({ system, user, maxTokens, temperature = 0.3 }: GenerateArgs): Promise<string> {
  const provider = aiProvider();

  if (provider === "groq") {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AiError(`Groq ${res.status}: ${detail.slice(0, 300)}`, res.status);
    }
    const data = await res.json();
    return String(data?.choices?.[0]?.message?.content ?? "").trim();
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
