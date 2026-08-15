import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { canonicalBaseUrl, requestBaseUrl } from "@/lib/baseUrl";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { occupationLabel } from "@/lib/profile/context";
import type { SajuResult } from "@/lib/saju/calculator";
import { compatReportBasisSignature, selectedCompatPartner } from "@/lib/saju/compatReport";
import { buildFamilyCircleMembers } from "@/lib/saju/familyCircle";
import { familyReportBasisSignature } from "@/lib/saju/familyReportBasis";
import { selectedFamilyReportMembers } from "@/lib/saju/familyReportSelection";
import { shareDescription, shareTitle } from "@/lib/share/labels";
import { getCompat, getFamily, getProfile } from "@/lib/store/guest";
import { getSavedReport } from "@/lib/store/reports";
import {
  createOrUpdateShare,
  getShare,
  getShareStatusFor,
  revokeShare,
  shareExpiresAt,
  type ShareExpiry,
  type ShareSnapshot,
  type ShareSnapshotInput,
} from "@/lib/store/shares";
import type { ReportKind } from "@/lib/store/types";
import type { TciScore } from "@/lib/tci/scoring";

export const runtime = "nodejs";

const KINDS: ReportKind[] = ["personal", "tci", "fusion", "family", "compat"];
const EXPIRIES: ShareExpiry[] = ["30d", "never"];

type ShareRequestBody = { kind?: unknown; expiry?: unknown; mode?: unknown };

function validKind(value: unknown): value is ReportKind {
  return typeof value === "string" && KINDS.includes(value as ReportKind);
}

function validExpiry(value: unknown): value is ShareExpiry {
  return typeof value === "string" && EXPIRIES.includes(value as ShareExpiry);
}

function shareResponse(req: Request, snapshot: ShareSnapshot) {
  const base = requestBaseUrl(req);
  const canonical = canonicalBaseUrl(req);
  return {
    state: "active" as const,
    token: snapshot.token,
    createdAt: snapshot.createdAt,
    expiresAt: shareExpiresAt(snapshot),
    url: `${base}/share/${snapshot.token}`,
    ogUrl: `${canonical}/share/${snapshot.token}/opengraph-image`,
    title: shareTitle(snapshot.ownerName, snapshot.kind),
    description: shareDescription(snapshot.ownerName, snapshot.kind),
  };
}

async function readBody(req: Request): Promise<ShareRequestBody> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function birthYearOf(saju: SajuResult): number {
  return Number(saju.input.birthDate.split("-")[0]) || 0;
}

/**
 * GET — 인증된 소유자에게 리포트별 최신 공유 링크 상태를 돌려준다.
 */
export async function GET(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind");
  if (!validKind(kind)) {
    return NextResponse.json({ error: "잘못된 풀이 종류예요." }, { status: 400 });
  }

  const status = await getShareStatusFor(scope.scopeId, kind);
  if (status.state !== "active") return NextResponse.json(status);

  // 상태 조회와 응답 사이에 폐기될 수 있으므로 공개 조회로 한 번 더 확인한다.
  const snapshot = await getShare(status.token);
  if (!snapshot) return NextResponse.json(await getShareStatusFor(scope.scopeId, kind));
  return NextResponse.json(shareResponse(req, snapshot));
}

/**
 * POST — 저장된 풀이를 공개 공유 스냅샷으로 박제하고 링크를 돌려준다.
 * 인증 필요. 기본 30일 만료이며, mode=reissue는 기존 활성 링크를 즉시 폐기한다.
 */
export async function POST(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;

  const body = await readBody(req);
  if (!validKind(body.kind)) {
    return NextResponse.json({ error: "잘못된 풀이 종류예요." }, { status: 400 });
  }
  if (body.expiry !== undefined && !validExpiry(body.expiry)) {
    return NextResponse.json({ error: "잘못된 링크 만료 설정이에요." }, { status: 400 });
  }
  if (body.mode !== undefined && body.mode !== "create" && body.mode !== "reissue") {
    return NextResponse.json({ error: "잘못된 공유 요청이에요." }, { status: 400 });
  }
  const kind = body.kind;

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
  } else if (kind === "compat") {
    const meta = saved.meta as
      | { saju?: { self: SajuResult; partner: SajuResult }; compatSignature?: string; relation?: string }
      | undefined;
    if (!meta?.saju?.self || !meta.saju.partner) {
      return NextResponse.json({ error: "풀이 데이터가 손상됐어요. 다시 생성해주세요." }, { status: 422 });
    }
    const compat = await getCompat(userId);
    const partner = selectedCompatPartner(compat);
    if (
      profile &&
      typeof meta.compatSignature === "string" &&
      meta.compatSignature !== compatReportBasisSignature(profile, compat)
    ) {
      return NextResponse.json({ error: "상대 정보가 바뀌었어요. 풀이를 다시 생성한 뒤 공유해주세요." }, { status: 409 });
    }
    const circleMembers = buildFamilyCircleMembers(
      { name: ownerName, saju: meta.saju.self, occupation: profile ? occupationLabel(profile) : undefined },
      partner
        ? [{
            id: partner.id,
            name: partner.profile.name,
            relation: partner.relation,
            occupation: partner.profile.occupation,
            saju: meta.saju.partner,
          }]
        : [],
    );
    input = { ...base, kind, circleMembers, relation: partner?.relation ?? meta.relation ?? "" };
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

  const snapshot = await createOrUpdateShare(userId, input, {
    expiry: body.expiry ?? "30d",
    reissue: body.mode === "reissue",
  });
  return NextResponse.json(shareResponse(req, snapshot));
}

/** DELETE — 인증된 소유자가 해당 리포트의 최신 공유 링크를 즉시 폐기한다. */
export async function DELETE(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await readBody(req);
  if (!validKind(body.kind)) {
    return NextResponse.json({ error: "잘못된 풀이 종류예요." }, { status: 400 });
  }
  return NextResponse.json(await revokeShare(scope.scopeId, body.kind));
}
