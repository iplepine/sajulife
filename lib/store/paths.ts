import path from "node:path";

export const DATA_DIR = process.env.SAJULIFE_DATA_DIR
  ? path.resolve(process.env.SAJULIFE_DATA_DIR)
  : path.resolve(process.cwd(), "data");

export const PROMPTS_FILE = path.join(DATA_DIR, "prompts.json");
export const GUESTS_DIR = path.join(DATA_DIR, "guests");

export function guestDir(guestId: string): string {
  return path.join(GUESTS_DIR, guestId);
}

export function guestFile(guestId: string, name: string): string {
  return path.join(guestDir(guestId), name);
}
