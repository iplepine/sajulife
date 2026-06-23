import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { occupationLabel } from "@/lib/profile/context";
import { calculateSaju } from "@/lib/saju/calculator";
import { getProfile } from "@/lib/store/guest";

export const runtime = "nodejs";

/**
 * 사주 도식 데이터(만세력 4기둥 · 일간 · 오행 분포 · 대운)를 반환한다.
 * AI를 호출하지 않고 결정론적 계산만 하므로 /saju 화면이 즉시 차트를 그릴 수 있다.
 */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ saju: null });

  const saju = calculateSaju(profile);
  const nowVars = getNowVars();
  return NextResponse.json({
    saju,
    name: profile.name,
    gender: profile.gender === "male" ? "남성" : "여성",
    occupation: occupationLabel(profile),
    currentAge: calculateCurrentAge(profile.birthDate, nowVars.today),
    currentYear: Number(nowVars.currentYear),
  });
}
