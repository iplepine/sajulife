import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getUserIdOrNull } from "@/lib/auth";
import { getFamily, saveFamily } from "@/lib/store/guest";
import type { FamilyMember, SajuProfile } from "@/lib/store/types";

export const runtime = "nodejs";

type AddMemberBody = { relation: string; profile: Partial<SajuProfile> };
type RemoveBody = { id: string };

function isValidProfile(p: Partial<SajuProfile>): p is SajuProfile {
  return !!(p.name && p.birthDate && p.gender && p.calendar);
}

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamily(userId);
  return NextResponse.json({ family });
}

export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

export async function DELETE(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as RemoveBody;
  const family = await getFamily(userId);
  family.members = family.members.filter((m) => m.id !== body.id);
  await saveFamily(userId, family);
  return NextResponse.json({ family });
}
