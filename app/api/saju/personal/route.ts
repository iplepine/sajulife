import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getNowVars } from "@/lib/datetime";
import { requireGuestId } from "@/lib/guest";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju } from "@/lib/saju/calculator";
import { formatDayPillar, formatSajuForPrompt } from "@/lib/saju/format";
import { getProfile } from "@/lib/store/guest";

export const runtime = "nodejs";

export async function POST() {
  const guestId = await requireGuestId();
  const [profile, prompt] = await Promise.all([
    getProfile(guestId),
    getPrompt("personal-saju"),
  ]);

  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });

  const saju = calculateSaju(profile);

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    note: profile.note ?? "",
    sajuTable: formatSajuForPrompt(saju),
    dayMaster: `${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
    shengXiao: `${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
    dayPillar: formatDayPillar(saju),
    ...getNowVars(),
  });

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, { temperature: prompt.temperature });
    return NextResponse.json({
      report,
      saju,
      debug: { prompt: rendered, model: ai.model, provider: ai.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
