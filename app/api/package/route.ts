import { NextResponse } from "next/server";
import { SAJU_TCI_PACKAGE } from "@/lib/package/product";
import { paymentAvailability } from "@/lib/package/paymentMode";
import type { PackageJourneyState, ReportProgress } from "@/lib/package/journey";
import { getProfile, getTci } from "@/lib/store/guest";
import { getPackageEntitlement } from "@/lib/store/package";
import { getReportJob, getSavedReport, isReportErrorExpired, isReportJobStale } from "@/lib/store/reports";
import { resolveScopeOrNull } from "@/lib/store/session";
import type { ReportJob } from "@/lib/store/types";
import { tciCompletionFor } from "@/lib/tci/completion";

export const runtime = "nodejs";

/** 개인·융합 풀이 GET과 같은 규약으로 상태를 읽는다 — 오래 멈춘 생성은 진행 중으로 세지 않는다. */
function progressOf(saved: unknown, job: ReportJob | null): ReportProgress {
  let status: ReportProgress["status"] = "idle";
  if (job?.status === "generating") status = isReportJobStale(job) ? "error" : "generating";
  else if (job?.status === "error" && !isReportErrorExpired(job)) status = "error";
  return { saved: Boolean(saved), status };
}

/**
 * GET — 사주+기질 풀이의 진행 상태를 한 번에 돌려준다(조회만, 비용 없음).
 * 홈과 결제 화면이 이 응답 하나로 다음 걸음(lib/package/journey.ts)을 정한다.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scopeId = scope.scopeId;

  const [entitlement, profile, tci, personal, personalJob, fusion, fusionJob] = await Promise.all([
    getPackageEntitlement(scopeId),
    getProfile(scopeId),
    getTci(scopeId),
    getSavedReport(scopeId, "personal"),
    getReportJob(scopeId, "personal"),
    getSavedReport(scopeId, "fusion"),
    getReportJob(scopeId, "fusion"),
  ]);
  const completion = tci ? await tciCompletionFor(tci.variant, tci.answers) : null;

  const state: PackageJourneyState = {
    entitled: entitlement !== null,
    hasProfile: profile !== null,
    personal: progressOf(personal, personalJob),
    tci: {
      complete: completion?.complete ?? false,
      answered: completion?.answered ?? 0,
      total: completion?.total ?? 0,
    },
    fusion: progressOf(fusion, fusionJob),
  };

  return NextResponse.json({
    product: { id: SAJU_TCI_PACKAGE.id, name: SAJU_TCI_PACKAGE.name, price: SAJU_TCI_PACKAGE.price },
    payment: paymentAvailability(),
    purchasedAt: entitlement?.purchasedAt ?? null,
    state,
  });
}
