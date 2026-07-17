import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { canonicalBaseUrl, requestBaseUrl } from "@/lib/baseUrl";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { occupationLabel } from "@/lib/profile/context";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildFamilyCircleMembers } from "@/lib/saju/familyCircle";
import { familyReportBasisSignature } from "@/lib/saju/familyReportBasis";
import { selectedFamilyReportMembers } from "@/lib/saju/familyReportSelection";
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
 * POST — 저장된 풀이를 공개 공유 스냅샷으로 박제하고 링크를 돌려준다.
 * 인증 필요(getUserIdOrNull). 풀이가 아직 없으면 404.
 */
export async function POST(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;

  let body: { kind?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const kind = body.kind as ReportKind | undefined;
  if (!kind || !KINDS.includes(kind)) {
    return NextResponse.json({ error: "잘못된 풀이 종류예요." }, { status: 400 });
  }

  const [saved, profile] = await Promise.all([getSavedReport(userId, kind), getProfile(userId)]);
  if (!saved) return NextResponse.json({ error: "풀이를 먼저 생성하세요." }, { status: 404 });

  const ownerName = profile?.name?.trim() || "익명";
  const nowVars = getNowVars();
  const base = {
    ownerName,
    report: saved.report,
    generatedAt: saved.generatedAt,
    currentYear: Number(nowVars.currentYear),
  };

  let input: ShareSnapshotInput;
  if (kind === "personal") {
    const meta = saved.meta as { saju?: SajuResult } | undefined;
    if (!meta?.saju) return NextResponse.json({ error: "풀이 데이터가 손상됐어요. 다시 생성해주세요." }, { status: 422 });
    input = {
      ...base,
      kind,
      saju: meta.saju,
      birthYear: birthYearOf(meta.saju),
      gender: profile?.gender === "male" ? "남성" : profile?.gender === "female" ? "여성" : undefined,
      occupation: profile ? occupationLabel(profile) : undefined,
      currentAge: profile ? calculateCurrentAge(profile.birthDate, nowVars.today) : undefined,
    };
  } else if (kind === "tci") {
    const meta = saved.meta as { scores?: TciScore[]; flexibility?: number } | undefined;
    input = { ...base, kind, scores: meta?.scores ?? [], flexibility: meta?.flexibility };
  } else if (kind === "fusion") {
    const meta = saved.meta as { scores?: TciScore[]; flexibility?: number; saju?: SajuResult } | undefined;
    if (!meta?.saju) return NextResponse.json({ error: "풀이 데이터가 손상됐어요. 다시 생성해주세요." }, { status: 422 });
    input = {
      ...base,
      kind,
      scores: meta.scores ?? [],
      flexibility: meta.flexibility,
      saju: meta.saju,
      birthYear: birthYearOf(meta.saju),
      gender: profile?.gender === "male" ? "남성" : profile?.gender === "female" ? "여성" : undefined,
      occupation: profile ? occupationLabel(profile) : undefined,
      currentAge: profile ? calculateCurrentAge(profile.birthDate, nowVars.today) : undefined,
    };
  } else {
    const meta = saved.meta as
      | { saju?: { self: SajuResult; members: { id: string; saju: SajuResult }[] }; familySignature?: string }
      | undefined;
    if (!meta?.saju?.self) return NextResponse.json({ error: "풀이 데이터가 손상됐어요. 다시 생성해주세요." }, { status: 422 });
    const family = await getFamily(userId);
    if (
      profile &&
      typeof meta.familySignature === "string" &&
      meta.familySignature !== familyReportBasisSignature(profile, family)
    ) {
      return NextResponse.json({ error: "가족 정보가 바뀌었어요. 풀이를 다시 생성한 뒤 공유해주세요." }, { status: 409 });
    }
    const sajuById = new Map(meta.saju.members.map((m) => [m.id, m.saju]));
    const circleMembers = buildFamilyCircleMembers(
      { name: ownerName, saju: meta.saju.self, occupation: profile ? occupationLabel(profile) : undefined },
      selectedFamilyReportMembers(family).map((m) => ({
        id: m.id,
        name: m.profile.name,
        relation: m.relation,
        occupation: m.profile.occupation,
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
