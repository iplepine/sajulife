import { GeminiProvider } from "./gemini";
import type { AIProvider } from "./types";

export type { AIProvider, AIGenerateOptions } from "./types";

export function getAIProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER ?? "gemini";

  if (providerName === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    return new GeminiProvider(apiKey, model);
  }

  throw new Error(`Unknown AI_PROVIDER: ${providerName}`);
}
