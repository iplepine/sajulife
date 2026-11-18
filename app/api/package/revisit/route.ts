import { NextResponse } from "next/server";
import { SAJU_TCI_PACKAGE } from "@/lib/package/product";
import { paymentAvailability } from "@/lib/package/paymentMode";
import { hasPackage } from "@/lib/store/package";
import { getSavedReport } from "@/lib/store/reports";
import { getActiveRevisitPass, revisitPublicState, startRevisitPass } from "@/lib/store/revisit";
import { resolveScopeOrNull } from "@/lib/store/session";

export const runtime = "nodejs";

/** GET — 진행 중인 다시 보기권과 가격 안내(조회만). */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pass = await getActiveRevisitPass(scope.scopeId);
  return NextResponse.json({ pass: revisitPublicState(pass), payment: paymentAvailability(), price: SAJU_TCI_PACKAGE.price });
}

/**
 * POST — 다시 보기를 시작한다(다시 보기권 1장 사용). 진행 중인 권이 있으면 그것을 그대로 돌려준다.
 * 최종 풀이를 한 번 받은 사람만 다시 볼 수 있다 — 처음 받는 중이면 기존 진행 단계를 따른다.
 */
export async function POST() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPackage(scope.scopeId))) {
    return NextResponse.json({ error: "사주+기질 풀이를 먼저 열어 주세요.", code: "PACKAGE_REQUIRED" }, { status: 402 });
  }
  if (!(await getSavedReport(scope.scopeId, "fusion"))) {
    return NextResponse.json({ error: "최종 풀이를 먼저 받으면 다시 볼 수 있어요.", code: "FUSION_REQUIRED" }, { status: 409 });
  }
  const result = await startRevisitPass(scope.userId, scope.scopeId);
  if (!result.ok) return NextResponse.json({ error: result.error, code: result.code }, { status: 402 });
  return NextResponse.json({ pass: revisitPublicState(result.pass), reused: result.reused });
}
