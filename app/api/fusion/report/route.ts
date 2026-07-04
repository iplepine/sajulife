import { NextResponse } from "next/server";
import { getAIProvider, type AIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { refreshConsultBasis } from "@/lib/consult/summarize";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import {
  formatFusionBalanceForPrompt,
  formatFusionDayMasterForPrompt,
  formatFusionDayunForPrompt,
  formatFusionSajuForPrompt,
  formatFusionScoresForPrompt,
  formatFusionZodiacForPrompt,
} from "@/lib/fusion/promptFormat";
import { buildFusionRepairPrompt, parseFusionReportOutput } from "@/lib/fusion/reportOutput";
import {
  childrenStatusLabel,
  currentConcernLabel,
  occupationLabel,
  profileContextForPrompt,
  relationshipStatusLabel,
} from "@/lib/profile/context";
import { computeBalanceWithDayun } from "@/lib/saju/balance";
import { calculateSaju } from "@/lib/saju/calculator";
import { getProfile, getTci } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";
import { scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";

async function generateFusionWithRepair(
  ai: AIProvider,
  rendered: string,
  temperature: number,
): Promise<ReturnType<typeof parseFusionReportOutput>> {
  let parsed = parseFusionReportOutput(
    await ai.generate(rendered, { temperature }),
  );
  if (parsed.errors.length > 0) {
    parsed = parseFusionReportOutput(
      await ai.generate(buildFusionRepairPrompt(rendered, parsed.errors), {
        temperature: Math.max(0.35, temperature - 0.2),
      }),
    );
  }
  return parsed;
}

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
  const nowVars = getNowVars();
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);
  const balance = computeBalanceWithDayun(saju, currentAge);

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || "(시각 모름)",
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    occupation: occupationLabel(profile),
    relationshipStatus: relationshipStatusLabel(profile.relationshipStatus),
    childrenStatus: childrenStatusLabel(profile.childrenStatus),
    currentConcern: currentConcernLabel(profile),
    profileContext: profileContextForPrompt(profile),
    sajuTable: formatFusionSajuForPrompt(saju),
    dayMaster: formatFusionDayMasterForPrompt(saju),
    shengXiao: formatFusionZodiacForPrompt(saju),
    sajuBalance: formatFusionBalanceForPrompt(balance),
    currentAge: String(currentAge),
    dayunTable: formatFusionDayunForPrompt(saju, currentAge),
    tciScores: formatFusionScoresForPrompt(scores),
    ...nowVars,
  });

  try {
    const ai = getAIProvider();
    const parsed = await generateFusionWithRepair(ai, rendered, prompt.temperature);
    if (parsed.errors.length > 0) {
      throw new Error(`융합 풀이 품질 검증 실패: ${parsed.errors.join(" / ")}`);
    }
    const { report, actions, flexibility } = parsed;
    const generatedAt = new Date().toISOString();

    await saveReport(userId, "fusion", {
      report,
      generatedAt,
      provider: ai.name,
      model: ai.model,
      meta: { scores, saju, flexibility },
      actions,
    });
    // 상담 근거 갱신 (요약 실패는 풀이 응답을 막지 않음).
    try {
      await refreshConsultBasis(userId, "fusion", report, generatedAt);
    } catch (err) {
      console.warn("Failed to refresh fusion consult basis", err);
    }

    return NextResponse.json({
      report,
      scores,
      saju,
      flexibility,
      actions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `응답 생성 실패: ${message}` }, { status: 502 });
  }
}
