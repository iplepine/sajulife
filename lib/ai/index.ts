import { GeminiProvider } from "./gemini";
import type { AIProvider } from "./types";

export type { AIProvider, AIGenerateOptions } from "./types";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GEMINI_DEEP_MODEL = "gemini-2.5-pro";

export function configuredAIModel(): string {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export function configuredAIDeepModel(): string {
  return process.env.GEMINI_DEEP_MODEL ?? DEFAULT_GEMINI_DEEP_MODEL;
}

/**
 * AI 프로바이더 인스턴스.
 * @param overrideModel 모델 강제 지정 (예: 요약용 저가 모델). 생략 시 GEMINI_MODEL → 기본 flash.
 */
export function getAIProvider(overrideModel?: string): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? "gemini";

  if (providerName === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const model = overrideModel ?? configuredAIModel();
    return new GeminiProvider(apiKey, model);
  }

  throw new Error(`Unknown AI_PROVIDER: ${providerName}`);
}
