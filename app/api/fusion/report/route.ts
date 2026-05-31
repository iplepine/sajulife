import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju } from "@/lib/saju/calculator";
import { formatSajuForPrompt } from "@/lib/saju/format";
import { getProfile, getTci } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";
import { formatScoresForPrompt, scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const saved = await getSavedReport(userId, "fusion");
  return NextResponse.json({ saved });
}

export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [profile, tci, prompt] = await Promise.all([
    getProfile(userId),
    getTci(userId),
    getPrompt("tci-saju-fusion"),
  ]);

  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });
  if (!tci) return NextResponse.json({ error: "기질 설문을 먼저 완료하세요." }, { status: 400 });

  const scores = await scoreTciByVariant(tci.variant, tci.answers);
  const saju = calculateSaju(profile);

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || "(시각 모름)",
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    sajuTable: formatSajuForPrompt(saju),
    dayMaster: `${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
    shengXiao: `${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
    tciScores: formatScoresForPrompt(scores),
    ...getNowVars(),
  });

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, { temperature: prompt.temperature });

    await saveReport(userId, "fusion", {
      report,
      generatedAt: new Date().toISOString(),
      provider: ai.name,
      model: ai.model,
      meta: { scores, saju },
    });

    return NextResponse.json({
      report,
      scores,
      saju,
      debug: { prompt: rendered, model: ai.model, provider: ai.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
