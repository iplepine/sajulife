import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { resolveScopeOrNull } from "@/lib/store/session";
import { getFamily, saveFamily } from "@/lib/store/guest";
import type { FamilyMember, SajuProfile } from "@/lib/store/types";
import { MAX_FAMILY_REPORT_MEMBERS } from "@/lib/saju/familyReportSelection";

export const runtime = "nodejs";

type AddMemberBody = { relation: string; profile: Partial<SajuProfile> };
type EditMemberBody = { id: string; relation: string; profile: Partial<SajuProfile> };
type RemoveBody = { id: string };
type UpdateReportMembersBody = { reportMemberIds: unknown };

function isValidProfile(p: Partial<SajuProfile>): p is SajuProfile {
  return !!(p.name && p.birthDate && p.gender && p.calendar);
}

export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
  const family = await getFamily(userId);
  return NextResponse.json({ family });
}

export async function POST(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
  const body = (await req.json()) as AddMemberBody;
  if (!body.relation || !isValidProfile(body.profile ?? {})) {
    return NextResponse.json({ error: "relation 또는 profile 누락/불완전" }, { status: 400 });
  }
  const family = await getFamily(userId);
  const member: FamilyMember = {
    id: `m_${randomUUID().slice(0, 8)}`,
    relation: body.relation,
    profile: body.profile as SajuProfile,
  };
  family.members.push(member);
  await saveFamily(userId, family);
  return NextResponse.json({ family });
}

export async function PUT(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
  const body = (await req.json()) as EditMemberBody;
  if (!body.id || !body.relation || !isValidProfile(body.profile ?? {})) {
    return NextResponse.json({ error: "id 또는 relation 또는 profile 누락/불완전" }, { status: 400 });
  }
  const family = await getFamily(userId);
  const idx = family.members.findIndex((m) => m.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "구성원을 찾을 수 없어요" }, { status: 404 });
  }
  family.members[idx] = {
    id: body.id,
    relation: body.relation,
    profile: body.profile as SajuProfile,
  };
  await saveFamily(userId, family);
  return NextResponse.json({ family });
}

/** 가족은 계속 저장하되, 가족 리포트에 넣을 구성원만 최대 3명 선택한다(본인 포함 4명). */
export async function PATCH(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;
  const body = (await req.json()) as UpdateReportMembersBody;
  if (!Array.isArray(body.reportMemberIds) || !body.reportMemberIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "리포트에 포함할 가족 목록이 올바르지 않아요." }, { status: 400 });
  }

  const uniqueIds = [...new Set(body.reportMemberIds)];
  if (uniqueIds.length > MAX_FAMILY_REPORT_MEMBERS) {
    return NextResponse.json({ error: "가족 리포트에는 본인을 포함해 최대 4명까지 넣을 수 있어요." }, { status: 400 });
  }

  const family = await getFamily(userId);
  const availableIds = new Set(family.members.map((member) => member.id));
  if (uniqueIds.some((id) => !availableIds.has(id))) {
    return NextResponse.json({ error: "목록에 없는 가족은 리포트에 포함할 수 없어요." }, { status: 400 });
  }

  family.reportMemberIds = uniqueIds;
  await saveFamily(userId, family);
  return NextResponse.json({ family });
}

export async function DELETE(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
  const body = (await req.json()) as RemoveBody;
  const family = await getFamily(userId);
  family.members = family.members.filter((m) => m.id !== body.id);
  if (family.reportMemberIds) {
    family.reportMemberIds = family.reportMemberIds.filter((id) => id !== body.id);
  }
  await saveFamily(userId, family);
  return NextResponse.json({ family });
}
