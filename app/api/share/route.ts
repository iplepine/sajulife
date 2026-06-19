import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { canonicalBaseUrl, requestBaseUrl } from "@/lib/baseUrl";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildFamilyCircleMembers } from "@/lib/saju/familyCircle";
import { shareDescription, shareTitle } from "@/lib/share/labels";
import { getFamily, getProfile } from "@/lib/store/guest";
import { getSavedReport } from "@/lib/store/reports";
import { createOrUpdateShare, type ShareSnapshotInput } from "@/lib/store/shares";
import type { ReportKind } from "@/lib/store/types";
import type { TciScore } from "@/lib/tci/scoring";

export const runtime = "nodejs";

const KINDS: ReportKind[] = ["personal", "tci", "fusion", "family"];

function birthYearOf(saju: SajuResult): number {
  return Number(saju.input.birthDate.split("-")[0]) || 0;
}

/**
 * POST — 저장된 리포트를 공개 공유 스냅샷으로 박제하고 링크를 돌려준다.
 * 인증 필요(getUserIdOrNull). 리포트가 아직 없으면 404.
 */
export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { kind?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const kind = body.kind as ReportKind | undefined;
  if (!kind || !KINDS.includes(kind)) {
    return NextResponse.json({ error: "잘못된 리포트 종류예요." }, { status: 400 });
  }

  const [saved, profile] = await Promise.all([getSavedReport(userId, kind), getProfile(userId)]);
  if (!saved) return NextResponse.json({ error: "리포트를 먼저 생성하세요." }, { status: 404 });

  const ownerName = profile?.name?.trim() || "익명";
  const base = {
    ownerName,
    report: saved.report,
    generatedAt: saved.generatedAt,
    currentYear: new Date().getFullYear(),
  };

  let input: ShareSnapshotInput;
  if (kind === "personal") {
    const meta = saved.meta as { saju?: SajuResult } | undefined;
    if (!meta?.saju) return NextResponse.json({ error: "리포트 데이터가 손상됐어요. 다시 생성해주세요." }, { status: 422 });
    input = { ...base, kind, saju: meta.saju, birthYear: birthYearOf(meta.saju) };
  } else if (kind === "tci") {
    const meta = saved.meta as { scores?: TciScore[]; flexibility?: number } | undefined;
    input = { ...base, kind, scores: meta?.scores ?? [], flexibility: meta?.flexibility };
  } else if (kind === "fusion") {
    const meta = saved.meta as { scores?: TciScore[]; flexibility?: number; saju?: SajuResult } | undefined;
    if (!meta?.saju) return NextResponse.json({ error: "리포트 데이터가 손상됐어요. 다시 생성해주세요." }, { status: 422 });
    input = {
      ...base,
      kind,
      scores: meta.scores ?? [],
      flexibility: meta.flexibility,
      saju: meta.saju,
      birthYear: birthYearOf(meta.saju),
    };
  } else {
    const meta = saved.meta as
      | { saju?: { self: SajuResult; members: { id: string; saju: SajuResult }[] } }
      | undefined;
    if (!meta?.saju?.self) return NextResponse.json({ error: "리포트 데이터가 손상됐어요. 다시 생성해주세요." }, { status: 422 });
    const family = await getFamily(userId);
    const sajuById = new Map(meta.saju.members.map((m) => [m.id, m.saju]));
    const circleMembers = buildFamilyCircleMembers(
      { name: ownerName, saju: meta.saju.self },
      family.members.map((m) => ({
        id: m.id,
        name: m.profile.name,
        relation: m.relation,
        saju: sajuById.get(m.id) ?? null,
      })),
    );
    input = { ...base, kind, circleMembers };
  }

  const snapshot = await createOrUpdateShare(userId, input);
  return NextResponse.json({
    token: snapshot.token,
    url: `${requestBaseUrl(req)}/share/${snapshot.token}`,
    ogUrl: `${canonicalBaseUrl(req)}/share/${snapshot.token}/opengraph-image`,
    title: shareTitle(ownerName, kind),
    description: shareDescription(ownerName, kind),
  });
}
