import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { buildManseryeok } from "@/lib/saju/manseryeok";
import { getProfile } from "@/lib/store/guest";

export const runtime = "nodejs";

/**
 * 만세력 원본(원국·대운·세운·월운)을 반환한다. AI 없이 결정론적 계산만 하므로
 * 계정의 '내 만세력' 화면이 즉시 표를 그린다.
 * ?wy=YYYY 로 월운 연도를 바꿔 다시 요청할 수 있다(기본: 올해).
 */
export async function GET(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ manseryeok: null });

  const nowVars = getNowVars();
  const currentYear = Number(nowVars.currentYear);
  const currentMonth = Number(nowVars.today.slice(5, 7));
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);

  const wyRaw = Number(new URL(req.url).searchParams.get("wy"));
  const wolwoonYear = Number.isInteger(wyRaw) && wyRaw >= 1900 && wyRaw <= 2200 ? wyRaw : currentYear;

  const manseryeok = buildManseryeok(profile, {
    currentYear,
    currentAge,
    currentMonth,
    wolwoonYear,
  });

  return NextResponse.json({ manseryeok });
}
