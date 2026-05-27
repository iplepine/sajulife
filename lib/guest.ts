import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { ensureGuestDir } from "./store/guest";

export const GUEST_COOKIE = "sajulife_guest";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getGuestIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(GUEST_COOKIE)?.value ?? null;
}

export async function requireGuestId(): Promise<string> {
  const id = await getGuestIdFromCookie();
  if (!id) throw new Error("게스트 세션이 없습니다.");
  await ensureGuestDir(id);
  return id;
}

export async function createGuest(): Promise<string> {
  const id = `g_${randomUUID().slice(0, 8)}`;
  const jar = await cookies();
  jar.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  await ensureGuestDir(id);
  return id;
}
