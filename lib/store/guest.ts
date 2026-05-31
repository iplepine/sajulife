import { readJson, writeJson } from "./kv";
import { userKey, userTciKey } from "./keys";
import type {
  FamilyStore,
  SajuProfile,
  TciAnswers,
  TciVariant,
} from "./types";

export async function getProfile(userId: string): Promise<SajuProfile | null> {
  return readJson<SajuProfile | null>(userKey(userId, "profile"), null);
}

export async function saveProfile(userId: string, profile: SajuProfile): Promise<void> {
  await writeJson(userKey(userId, "profile"), profile);
}

/**
 * 특정 variant의 TCI 응답을 가져온다.
 * `short`는 레거시 키(user:{uid}:tci)에 데이터가 남아있을 수 있어 fallback.
 */
export async function getTciByVariant(
  userId: string,
  variant: TciVariant,
): Promise<TciAnswers | null> {
  const fresh = await readJson<TciAnswers | null>(userTciKey(userId, variant), null);
  if (fresh) return fresh;
  if (variant === "short") {
    // 레거시: variant 필드가 도입되기 전 user:{uid}:tci 키에 저장된 약식 응답.
    const legacy = await readJson<TciAnswers | null>(userKey(userId, "tci"), null);
    if (legacy) {
      // variant 필드가 누락돼 있을 수 있어 보정.
      return { ...legacy, variant: legacy.variant ?? "short" };
    }
  }
  return null;
}

export async function saveTciByVariant(
  userId: string,
  variant: TciVariant,
  data: TciAnswers,
): Promise<void> {
  await writeJson(userTciKey(userId, variant), { ...data, variant });
}

/**
 * 가장 최근에 응답을 갱신한 variant의 데이터를 돌려준다.
 * 어디서 TCI를 "가지고 있는지"만 알고 싶고 어떤 variant인지는 무관할 때 사용.
 * 둘 다 있다면 updatedAt이 더 큰 쪽, 하나만 있다면 그쪽.
 */
export async function getTci(userId: string): Promise<TciAnswers | null> {
  const [shortAns, fullAns] = await Promise.all([
    getTciByVariant(userId, "short"),
    getTciByVariant(userId, "full"),
  ]);
  if (shortAns && fullAns) {
    return Date.parse(fullAns.updatedAt) >= Date.parse(shortAns.updatedAt) ? fullAns : shortAns;
  }
  return fullAns ?? shortAns ?? null;
}

export async function saveTci(userId: string, data: TciAnswers): Promise<void> {
  await saveTciByVariant(userId, data.variant, data);
}

export async function getFamily(userId: string): Promise<FamilyStore> {
  return readJson<FamilyStore>(userKey(userId, "family"), { members: [] });
}

export async function saveFamily(userId: string, data: FamilyStore): Promise<void> {
  await writeJson(userKey(userId, "family"), data);
}
