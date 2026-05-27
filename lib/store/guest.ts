import fs from "node:fs/promises";
import { readJson, writeJson } from "./fs";
import { guestDir, guestFile } from "./paths";
import type { FamilyStore, SajuProfile, TciAnswers } from "./types";

export async function ensureGuestDir(guestId: string): Promise<void> {
  await fs.mkdir(guestDir(guestId), { recursive: true });
}

export async function getProfile(guestId: string): Promise<SajuProfile | null> {
  return readJson<SajuProfile | null>(guestFile(guestId, "profile.json"), null);
}

export async function saveProfile(guestId: string, profile: SajuProfile): Promise<void> {
  await writeJson(guestFile(guestId, "profile.json"), profile);
}

export async function getTci(guestId: string): Promise<TciAnswers | null> {
  return readJson<TciAnswers | null>(guestFile(guestId, "tci.json"), null);
}

export async function saveTci(guestId: string, data: TciAnswers): Promise<void> {
  await writeJson(guestFile(guestId, "tci.json"), data);
}

export async function getFamily(guestId: string): Promise<FamilyStore> {
  return readJson<FamilyStore>(guestFile(guestId, "family.json"), { members: [] });
}

export async function saveFamily(guestId: string, data: FamilyStore): Promise<void> {
  await writeJson(guestFile(guestId, "family.json"), data);
}
