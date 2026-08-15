import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { resolveScopeOrNull } from "@/lib/store/session";
import { getCompat, saveCompat } from "@/lib/store/guest";
import { isCompatRelation } from "@/lib/saju/compatReport";
import type { CompatPartner, SajuProfile } from "@/lib/store/types";

export const runtime = "nodejs";

/** 한 계정(인물 스코프)이 저장해둘 수 있는 궁합 상대 수. 리포트는 그중 1명으로만 만든다. */
const MAX_PARTNERS = 8;

type AddPartnerBody = { relation: string; profile: Partial<SajuProfile> };
type EditPartnerBody = { id: string; relation: string; profile: Partial<SajuProfile> };
type SelectPartnerBody = { reportPartnerId: unknown };
type RemoveBody = { id: string };

function isValidProfile(p: Partial<SajuProfile>): p is SajuProfile {
  return !!(p.name && p.birthDate && p.gender && p.calendar);
}

export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const compat = await getCompat(scope.scopeId);
  return NextResponse.json({ compat });
}

export async function POST(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;
  const body = (await req.json()) as AddPartnerBody;
  if (!isCompatRelation(body.relation)) {
    return NextResponse.json({ error: "관계를 골라주세요." }, { status: 400 });
  }
  if (!isValidProfile(body.profile ?? {})) {
    return NextResponse.json({ error: "상대 정보가 불완전해요." }, { status: 400 });
  }

  const compat = await getCompat(userId);
  if (compat.partners.length >= MAX_PARTNERS) {
    return NextResponse.json({ error: `상대는 최대 ${MAX_PARTNERS}명까지 저장할 수 있어요.` }, { status: 400 });
  }
  const partner: CompatPartner = {
    id: `c_${randomUUID().slice(0, 8)}`,
    relation: body.relation,
    profile: body.profile as SajuProfile,
  };
  compat.partners.push(partner);
  // 처음 넣은 상대는 곧바로 이번 리포트 대상이 된다 — 한 번 더 고르게 만들 이유가 없다.
  if (!compat.reportPartnerId) compat.reportPartnerId = partner.id;
  await saveCompat(userId, compat);
  return NextResponse.json({ compat });
}

export async function PUT(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;
  const body = (await req.json()) as EditPartnerBody;
  if (!body.id || !isCompatRelation(body.relation) || !isValidProfile(body.profile ?? {})) {
    return NextResponse.json({ error: "id·관계·상대 정보를 확인해주세요." }, { status: 400 });
  }
  const compat = await getCompat(userId);
  const idx = compat.partners.findIndex((p) => p.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "상대를 찾을 수 없어요" }, { status: 404 });
  compat.partners[idx] = { id: body.id, relation: body.relation, profile: body.profile as SajuProfile };
  await saveCompat(userId, compat);
  return NextResponse.json({ compat });
}

/** 이번 궁합 리포트에 쓸 상대 1명을 고른다. */
export async function PATCH(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;
  const body = (await req.json()) as SelectPartnerBody;
  if (typeof body.reportPartnerId !== "string") {
    return NextResponse.json({ error: "고른 상대가 올바르지 않아요." }, { status: 400 });
  }
  const compat = await getCompat(userId);
  if (!compat.partners.some((p) => p.id === body.reportPartnerId)) {
    return NextResponse.json({ error: "목록에 없는 상대예요." }, { status: 400 });
  }
  compat.reportPartnerId = body.reportPartnerId;
  await saveCompat(userId, compat);
  return NextResponse.json({ compat });
}

export async function DELETE(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;
  const body = (await req.json()) as RemoveBody;
  const compat = await getCompat(userId);
  compat.partners = compat.partners.filter((p) => p.id !== body.id);
  // 고른 상대를 지웠으면 선택을 비운다 — selectedCompatPartner가 남은 첫 상대로 떨어진다.
  if (compat.reportPartnerId === body.id) compat.reportPartnerId = compat.partners[0]?.id;
  await saveCompat(userId, compat);
  return NextResponse.json({ compat });
}
