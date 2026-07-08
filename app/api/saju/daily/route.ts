import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { getNowVars } from "@/lib/datetime";
import { calculateSaju } from "@/lib/saju/calculator";
import { computeDailyFlow } from "@/lib/saju/dailyFlow";
import { getProfile } from "@/lib/store/guest";

export const runtime = "nodejs";

/**
 * 오늘의 흐름(데일리 훅). 일진×원국×용신을 결정론으로 계산해 매일 열어볼 이유를 만든다.
 * AI를 호출하지 않으므로 비용 없이 즉시 응답한다. 프로필이 없으면 flow=null.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(scope.scopeId);
  if (!profile) return NextResponse.json({ flow: null });

  const saju = calculateSaju(profile);
  const { today } = getNowVars();
  return NextResponse.json({
    flow: computeDailyFlow(saju, today),
    name: profile.name,
  });
}
