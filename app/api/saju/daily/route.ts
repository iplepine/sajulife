import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { calculateSaju } from "@/lib/saju/calculator";
import { computeDailyFlow } from "@/lib/saju/dailyFlow";
import { getProfile } from "@/lib/store/guest";

export const runtime = "nodejs";

const WEEKLY_START_OFFSET = -2;
const WEEKLY_END_OFFSET = 3;

function dateAtOffset(today: string, offset: number): string {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

/**
 * 오늘의 흐름(데일리 훅). 일진×원국×용신을 결정론으로 계산해 매일 열어볼 이유를 만든다.
 * AI를 호출하지 않으므로 비용 없이 즉시 응답한다. `range=week`이면 오늘을 중심으로
 * 이틀 전부터 사흘 후까지의 일진을 한 번에 반환한다. 프로필이 없으면 flow=null.
 */
export async function GET(request: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(scope.scopeId);
  if (!profile) return NextResponse.json({ flow: null });

  const saju = calculateSaju(profile);
  const { today } = getNowVars();
  const currentAge = calculateCurrentAge(profile.birthDate, today);
  const flowFor = (date: string) => ({
    ...computeDailyFlow(saju, date),
    currentAge,
  });

  if (new URL(request.url).searchParams.get("range") === "week") {
    const flows = Array.from(
      { length: WEEKLY_END_OFFSET - WEEKLY_START_OFFSET + 1 },
      (_, index) => flowFor(dateAtOffset(today, WEEKLY_START_OFFSET + index)),
    );

    return NextResponse.json({
      flow: flows.find((flow) => flow.date === today) ?? null,
      flows,
      today,
      name: profile.name,
    });
  }

  return NextResponse.json({
    flow: flowFor(today),
    name: profile.name,
  });
}
