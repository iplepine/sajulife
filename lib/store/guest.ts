import { readJson, writeJson } from "./kv";
import { userKey } from "./keys";
import type { FamilyStore, SajuProfile, TciAnswers } from "./types";

export async function getProfile(userId: string): Promise<SajuProfile | null> {
  return readJson<SajuProfile | null>(userKey(userId, "profile"), null);
}

export async function saveProfile(userId: string, profile: SajuProfile): Promise<void> {
  await writeJson(userKey(userId, "profile"), profile);
}

export async function getTci(userId: string): Promise<TciAnswers | null> {
  return readJson<TciAnswers | null>(userKey(userId, "tci"), null);
}

export async function saveTci(userId: string, data: TciAnswers): Promise<void> {
  await writeJson(userKey(userId, "tci"), data);
}

export async function getFamily(userId: string): Promise<FamilyStore> {
  return readJson<FamilyStore>(userKey(userId, "family"), { members: [] });
}

export async function saveFamily(userId: string, data: FamilyStore): Promise<void> {
  await writeJson(userKey(userId, "family"), data);
}
