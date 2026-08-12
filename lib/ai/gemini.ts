import { GoogleGenAI, type Schema } from "@google/genai";
import { EmptyAIResponseError, isTransientAIError } from "./errors";
import type { AIGenerateOptions, AIProvider } from "./types";

const RETRY_DELAYS_MS = [800, 1800];

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  readonly model: string;
  private client: GoogleGenAI;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(prompt: string, opts: AIGenerateOptions = {}) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: prompt,
          config: {
            temperature: opts.temperature,
            maxOutputTokens: opts.maxOutputTokens,
            systemInstruction: opts.systemInstruction,
            responseMimeType: opts.responseMimeType,
            responseSchema: opts.responseSchema as Schema | undefined,
          },
        });
        const text = response.text ?? "";
        // 빈 응답은 과부하 순간 흔한 일시적 증상 — 전이 실패로 보고 재시도한다.
        if (!text.trim()) throw new EmptyAIResponseError("Gemini");
        return { text: text.trim(), provider: this.name, model: this.model, fallback: false };
      } catch (err) {
        lastError = err;
        if (attempt >= RETRY_DELAYS_MS.length || !isTransientAIError(err)) break;
        await delay(RETRY_DELAYS_MS[attempt]);
      }
    }
    throw lastError;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
