import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireGuestId } from "@/lib/guest";
import { getFamily, saveFamily } from "@/lib/store/guest";
import type { FamilyMember, SajuProfile } from "@/lib/store/types";

export const runtime = "nodejs";

type AddMemberBody = { relation: string; profile: Partial<SajuProfile> };
type RemoveBody = { id: string };

function isValidProfile(p: Partial<SajuProfile>): p is SajuProfile {
  return !!(p.name && p.birthDate && p.gender && p.calendar);
}

export async function GET() {
  const guestId = await requireGuestId();
  const family = await getFamily(guestId);
  return NextResponse.json({ family });
}

export async function POST(req: Request) {
  const guestId = await requireGuestId();
  const body = (await req.json()) as AddMemberBody;
  if (!body.relation || !isValidProfile(body.profile ?? {})) {
    return NextResponse.json({ error: "relation 또는 profile 누락/불완전" }, { status: 400 });
  }
  const family = await getFamily(guestId);
  const member: FamilyMember = {
    id: `m_${randomUUID().slice(0, 8)}`,
    relation: body.relation,
    profile: body.profile as SajuProfile,
  };
  family.members.push(member);
  await saveFamily(guestId, family);
  return NextResponse.json({ family });
}

export async function DELETE(req: Request) {
  const guestId = await requireGuestId();
  const body = (await req.json()) as RemoveBody;
  const family = await getFamily(guestId);
  family.members = family.members.filter((m) => m.id !== body.id);
  await saveFamily(guestId, family);
  return NextResponse.json({ family });
}
