import { NextResponse } from "next/server";
import { normalizeChildrenStatus, normalizeRelationshipStatus } from "@/lib/profile/context";
import { getProfile, saveProfile } from "@/lib/store/guest";
import { syncPersonMeta } from "@/lib/store/people";
import { resolveScopeOrNull } from "@/lib/store/session";
import type { SajuProfile } from "@/lib/store/types";
import { getNowVars } from "@/lib/datetime";
import { calculateSaju } from "@/lib/saju/calculator";
import { SEASON_THEME_COOKIE, themeForSaju } from "@/lib/saju/seasonTheme";

export const runtime = "nodejs";

export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(scope.scopeId);
  return NextResponse.json({ profile });
}

export async function PUT(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Partial<SajuProfile>;
  const required = ["name", "birthDate", "gender", "calendar"] as const;
  for (const key of required) {
    if (!body[key]) return NextResponse.json({ error: `${key} 누락` }, { status: 400 });
  }
  const currentConcern = body.currentConcern?.trim() || body.note?.trim() || undefined;
  const profile: SajuProfile = {
    name: body.name!,
    birthDate: body.birthDate!,
    birthTime: body.birthTime ?? "",
    gender: body.gender!,
    calendar: body.calendar!,
    occupation: body.occupation?.trim() || undefined,
    relationshipStatus: normalizeRelationshipStatus(body.relationshipStatus),
    childrenStatus: normalizeChildrenStatus(body.childrenStatus),
    currentConcern,
    note: currentConcern,
  };
  await saveProfile(scope.scopeId, profile);
  // 인물 목록의 표시 메타(이름·생일·성별)를 프로필과 동기화 — 전환 UI가 프로필을 안 읽어도 되게.
  await syncPersonMeta(scope.userId, scope.personId, {
    label: profile.name,
    birthDate: profile.birthDate,
    gender: profile.gender,
  });
  // 다음 화면과 새로고침의 첫 페인트도 방금 저장한 개인 계절과 맞춘다.
  const response = NextResponse.json({ profile });
  response.cookies.set(
    SEASON_THEME_COOKIE,
    themeForSaju(calculateSaju(profile), Number(getNowVars().currentYear)),
    { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 400 },
  );
  return response;
}
