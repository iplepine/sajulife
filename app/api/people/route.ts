import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import {
  addPerson,
  deletePerson,
  getPeopleWithMeta,
  renamePerson,
  setActivePerson,
} from "@/lib/store/people";
import { getNowVars } from "@/lib/datetime";
import { calculateSaju } from "@/lib/saju/calculator";
import { SEASON_THEME_COOKIE, themeForSaju } from "@/lib/saju/seasonTheme";
import { getProfile } from "@/lib/store/guest";
import { scopeIdFor } from "@/lib/store/scope";

export const runtime = "nodejs";

/** 계정의 인물 목록 + 활성 인물. */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const store = await getPeopleWithMeta(userId);
  return NextResponse.json(store);
}

/** 새 인물 추가 → 곧바로 활성으로. 이후 온보딩에서 프로필을 채운다. */
export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { label?: string } = {};
  try {
    body = (await req.json()) as { label?: string };
  } catch {
    /* 바디 없이도 허용 */
  }
  const { store, person } = await addPerson(userId, typeof body.label === "string" ? body.label : "");
  return NextResponse.json({ ...store, added: person });
}

/** 활성 인물 전환({ activeId }) 또는 이름 변경({ id, label }). */
export async function PATCH(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { activeId?: string; id?: string; label?: string };

  if (typeof body.id === "string" && typeof body.label === "string") {
    const store = await renamePerson(userId, body.id, body.label);
    return NextResponse.json(store);
  }
  if (typeof body.activeId === "string") {
    const store = await setActivePerson(userId, body.activeId);
    const profile = await getProfile(scopeIdFor(userId, body.activeId));
    const season = profile
      ? themeForSaju(calculateSaju(profile), Number(getNowVars().currentYear))
      : undefined;
    const response = NextResponse.json(store);
    if (season) {
      response.cookies.set(SEASON_THEME_COOKIE, season, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 400,
      });
    }
    return response;
  }
  return NextResponse.json({ error: "activeId 또는 (id,label)이 필요합니다." }, { status: 400 });
}

/** 인물 삭제(?id=). self는 삭제 불가. */
export async function DELETE(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  const store = await deletePerson(userId, id);
  return NextResponse.json(store);
}
