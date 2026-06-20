import { readJson, writeJson } from "../store/kv";
import { PROMPTS_KEY } from "../store/keys";
import type { PromptConfig, PromptKey, PromptsStore } from "../store/types";
import { DEFAULT_PROMPTS } from "./defaults";

/**
 * KV에 저장된 프롬프트가 default보다 낮은(또는 없는) 버전이면 default를 쓴다.
 * defaults.ts가 source of truth — 내용을 의미 있게 고쳐 옛 KV 값을 밀어내야 할 때
 * 해당 default의 version을 올리면, 그보다 낡은 KV 값은 자동으로 무효화된다.
 */
function pick(key: PromptKey, stored?: PromptConfig): PromptConfig {
  const def = DEFAULT_PROMPTS[key];
  if (!stored) return def;
  if ((stored.version ?? 0) < (def.version ?? 0)) return def;
  return stored;
}

export async function getAllPrompts(): Promise<PromptsStore> {
  const stored = await readJson<Partial<PromptsStore>>(PROMPTS_KEY, {});
  return {
    "tci-report": pick("tci-report", stored["tci-report"]),
    "personal-saju": pick("personal-saju", stored["personal-saju"]),
    "family-saju": pick("family-saju", stored["family-saju"]),
    "tci-saju-fusion": pick("tci-saju-fusion", stored["tci-saju-fusion"]),
    "consult": pick("consult", stored["consult"]),
    "consult-basis": pick("consult-basis", stored["consult-basis"]),
  };
}

export async function getPrompt(key: PromptKey): Promise<PromptConfig> {
  const all = await getAllPrompts();
  return all[key];
}

export async function savePrompt(key: PromptKey, config: PromptConfig): Promise<void> {
  const all = await getAllPrompts();
  // 관리자가 의도적으로 편집한 값은 현재 default 버전으로 stamp해 둔다.
  // (그래야 다음 read에서 stale로 취급돼 default로 되돌아가지 않는다.)
  all[key] = {
    ...config,
    version: DEFAULT_PROMPTS[key].version ?? 0,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(PROMPTS_KEY, all);
}

export async function resetPrompt(key: PromptKey): Promise<PromptConfig> {
  const all = await getAllPrompts();
  all[key] = DEFAULT_PROMPTS[key];
  await writeJson(PROMPTS_KEY, all);
  return all[key];
}
