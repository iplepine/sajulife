import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { refreshConsultBasis } from "@/lib/consult/summarize";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import {
  childrenStatusLabel,
  currentConcernLabel,
  occupationLabel,
  profileContextForPrompt,
  relationshipStatusLabel,
} from "@/lib/profile/context";
import { computeBalanceWithDayun, formatBalanceForPrompt } from "@/lib/saju/balance";
import { calculateSaju } from "@/lib/saju/calculator";
import {
  ageBandPriority,
  formatCurrentDayunSpiritForPrompt,
  formatDayPillar,
  formatDayunForPrompt,
  formatMonthSeasonForPrompt,
  formatOhengForPrompt,
  formatSajuForPrompt,
  formatStemForPrompt,
  formatTenSpiritsForPrompt,
} from "@/lib/saju/format";
import { PERSONAL_REPORT_SCHEMA } from "@/lib/saju/reportSchema";
import { actionsFromReportJson } from "@/lib/report/actions";
import { getProfile } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const saved = await getSavedReport(userId, "personal");
  return NextResponse.json({ saved });
}

export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [profile, prompt] = await Promise.all([
    getProfile(userId),
    getPrompt("personal-saju"),
  ]);

  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });

  const saju = calculateSaju(profile);
  const nowVars = getNowVars();
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);
  const balance = computeBalanceWithDayun(saju, currentAge);

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    occupation: occupationLabel(profile),
    relationshipStatus: relationshipStatusLabel(profile.relationshipStatus),
    childrenStatus: childrenStatusLabel(profile.childrenStatus),
    currentConcern: currentConcernLabel(profile),
    profileContext: profileContextForPrompt(profile),
    note: currentConcernLabel(profile),
    currentAge: String(currentAge),
    agePriority: ageBandPriority(currentAge),
    sajuTable: formatSajuForPrompt(saju),
    dayMaster: `${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
    shengXiao: `${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
    dayPillar: formatDayPillar(saju),
    sajuBalance: formatBalanceForPrompt(balance),
    stemMetaphor: formatStemForPrompt(saju),
    monthSeasonPhrase: formatMonthSeasonForPrompt(saju),
    ohengMap: formatOhengForPrompt(saju),
    dayunTable: formatDayunForPrompt(saju, currentAge),
    tenSpiritMap: formatTenSpiritsForPrompt(saju),
    currentDayunSpirit: formatCurrentDayunSpiritForPrompt(saju, currentAge),
    ...nowVars,
  });

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, {
      temperature: prompt.temperature,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: PERSONAL_REPORT_SCHEMA,
    });

    const actions = actionsFromReportJson(report);
    const generatedAt = new Date().toISOString();

    await saveReport(userId, "personal", {
      report,
      generatedAt,
      provider: ai.name,
      model: ai.model,
      meta: { saju },
      actions,
    });
    // 상담 근거 갱신 (요약 실패는 리포트 응답을 막지 않음).
    await refreshConsultBasis(userId, "personal", report, generatedAt);

    return NextResponse.json({
      report,
      saju,
      actions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
