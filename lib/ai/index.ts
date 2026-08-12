import { GeminiProvider } from "./gemini";
import { FallbackAIProvider } from "./fallback";
import { OpenAIProvider } from "./openai";
export { safetyIdentifierForUser } from "./safety";
import type { AIProvider } from "./types";

export type { AIProvider, AIGenerateOptions, AIGenerationResult } from "./types";

const DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GEMINI_DEEP_MODEL = "gemini-2.5-pro";

type ProviderName = "openai" | "gemini";

export function configuredAIModel(): string {
  return configuredProviderName() === "openai"
    ? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL
    : process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export function configuredAIDeepModel(): string {
  return configuredProviderName() === "openai"
    ? process.env.OPENAI_DEEP_MODEL ?? DEFAULT_OPENAI_MODEL
    : process.env.GEMINI_DEEP_MODEL ?? DEFAULT_GEMINI_DEEP_MODEL;
}

export function configuredAISummaryModel(): string {
  return configuredProviderName() === "openai"
    ? process.env.OPENAI_SUMMARY_MODEL ?? configuredAIModel()
    : process.env.GEMINI_SUMMARY_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export function configuredProviderName(): ProviderName {
  const value = process.env.AI_PROVIDER?.trim().toLowerCase() ?? "openai";
  if (value === "openai" || value === "gemini") return value;
  throw new Error(`Unknown AI_PROVIDER: ${value}`);
}

export function configuredAIFallbackProviderName(): ProviderName | null {
  const primary = configuredProviderName();
  const configured = process.env.AI_FALLBACK_PROVIDER?.trim().toLowerCase();
  if (!configured) return primary === "openai" ? "gemini" : null;
  if (configured === "none" || configured === "off") return null;
  if (configured === "openai" || configured === "gemini") return configured === primary ? null : configured;
  throw new Error(`Unknown AI_FALLBACK_PROVIDER: ${configured}`);
}

export function getAIConfigurationStatus() {
  const provider = configuredProviderName();
  const fallbackProvider = configuredAIFallbackProviderName();
  const hasPrimaryKey = hasProviderKey(provider);
  const hasFallbackKey = fallbackProvider ? hasProviderKey(fallbackProvider) : false;
  const fallbackModel = fallbackProvider ? modelFor(fallbackProvider) : null;
  return {
    provider,
    model: configuredAIModel(),
    deepModel: configuredAIDeepModel(),
    fallbackProvider,
    fallbackModel,
    hasPrimaryKey,
    hasFallbackKey,
    effectiveProvider: hasPrimaryKey ? provider : hasFallbackKey && fallbackProvider ? fallbackProvider : provider,
    effectiveModel: hasPrimaryKey ? configuredAIModel() : hasFallbackKey && fallbackModel ? fallbackModel : configuredAIModel(),
  };
}

/**
 * AI 프로바이더 인스턴스. 기본은 GPT-5.6 Luna이며 Gemini는 일시 장애 fallback이다.
 * @param overrideModel 주 공급자 모델 강제 지정 (예: 요약용 저가 모델).
 */
export function getAIProvider(overrideModel?: string): AIProvider {
  const providerName = configuredProviderName();
  const primary = createProvider(providerName, overrideModel);
  const fallbackName = configuredAIFallbackProviderName();
  const fallback = fallbackName ? createProvider(fallbackName) : null;

  // Local setup and an OpenAI outage should not stop a configured Gemini deployment.
  if (!primary && fallback) return fallback;
  if (!primary) {
    throw new Error(`${providerName === "openai" ? "OPENAI_API_KEY" : "GEMINI_API_KEY"} is not set`);
  }
  if (!fallback) return primary;
  return new FallbackAIProvider(primary, fallback);
}

function createProvider(provider: ProviderName, overrideModel?: string): AIProvider | null {
  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    return apiKey ? new OpenAIProvider(apiKey, overrideModel ?? modelFor(provider)) : null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GeminiProvider(apiKey, overrideModel ?? modelFor(provider)) : null;
}

function modelFor(provider: ProviderName): string {
  return provider === "openai"
    ? process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL
    : process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

function hasProviderKey(provider: ProviderName): boolean {
  const key = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.GEMINI_API_KEY;
  return Boolean(key && key !== "your-key-here");
}
