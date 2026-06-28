import { GoogleGenAI, type Schema } from "@google/genai";
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

  async generate(prompt: string, opts: AIGenerateOptions = {}): Promise<string> {
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
        if (!text.trim()) throw new Error("응답이 비어 있습니다.");
        return text;
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

function isTransientAIError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const status = typeof err === "object" && err !== null && "status" in err ? String(err.status) : "";
  return /429|500|502|503|504|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|try again later/i.test(`${status} ${message}`);
}
