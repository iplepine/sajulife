import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { calculateSaju } from "@/lib/saju/calculator";
import { computeTimingCalendar } from "@/lib/saju/timingCalendar";
import { getProfile } from "@/lib/store/guest";

export const runtime = "nodejs";

/**
 * 개인 타이밍 캘린더. 그 해 12개월을 기회/정리/주의/평이로 분류해 지금→미래로 정렬한다.
 * '조심할 달' 결정론 계산(원국×대운×세운×월운)을 재사용하며 AI를 호출하지 않는다.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(scope.scopeId);
  if (!profile) return NextResponse.json({ calendar: null });

  const saju = calculateSaju(profile);
  const nowVars = getNowVars();
  const year = Number(nowVars.currentYear);
  const month = Number(nowVars.currentMonth.split("-")[1]);
  return NextResponse.json({
    calendar: computeTimingCalendar(saju, year, month),
    name: profile.name,
    currentAge: calculateCurrentAge(profile.birthDate, nowVars.today),
  });
}
