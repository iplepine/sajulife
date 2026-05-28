import { readJson, writeJson } from "../store/kv";
import { PROMPTS_KEY } from "../store/keys";
import type { PromptConfig, PromptKey, PromptsStore } from "../store/types";
import { DEFAULT_PROMPTS } from "./defaults";

export async function getAllPrompts(): Promise<PromptsStore> {
  const stored = await readJson<Partial<PromptsStore>>(PROMPTS_KEY, {});
  return {
    "tci-report": stored["tci-report"] ?? DEFAULT_PROMPTS["tci-report"],
    "personal-saju": stored["personal-saju"] ?? DEFAULT_PROMPTS["personal-saju"],
    "family-saju": stored["family-saju"] ?? DEFAULT_PROMPTS["family-saju"],
    "tci-saju-fusion": stored["tci-saju-fusion"] ?? DEFAULT_PROMPTS["tci-saju-fusion"],
    "consult": stored["consult"] ?? DEFAULT_PROMPTS["consult"],
  };
}

export async function getPrompt(key: PromptKey): Promise<PromptConfig> {
  const all = await getAllPrompts();
  return all[key];
}

export async function savePrompt(key: PromptKey, config: PromptConfig): Promise<void> {
  const all = await getAllPrompts();
  all[key] = { ...config, updatedAt: new Date().toISOString() };
  await writeJson(PROMPTS_KEY, all);
}

export async function resetPrompt(key: PromptKey): Promise<PromptConfig> {
  const all = await getAllPrompts();
  all[key] = DEFAULT_PROMPTS[key];
  await writeJson(PROMPTS_KEY, all);
  return all[key];
}
