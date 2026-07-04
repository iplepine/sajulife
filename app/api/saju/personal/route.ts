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
import { computeCautionMonths, formatCautionMonthsForPrompt } from "@/lib/saju/cautionMonths";
import { computeYongsin, formatYongsinForPrompt } from "@/lib/saju/yongsin";
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
import { parsePersonalReport } from "@/lib/report/types";
import { getProfile } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";

export const runtime = "nodejs";
export const maxDuration = 60;

const PERSONAL_REPORT_MAX_OUTPUT_TOKENS = 32768;

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
  const cautionMonths = computeCautionMonths(saju, Number(nowVars.currentYear));

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
    cautionMonths: formatCautionMonthsForPrompt(cautionMonths, Number(nowVars.currentYear), Number(nowVars.currentMonth.slice(-2))),
    yongsin: formatYongsinForPrompt(computeYongsin(saju)),
    ...nowVars,
  });

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, {
      temperature: prompt.temperature,
      maxOutputTokens: PERSONAL_REPORT_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      responseSchema: PERSONAL_REPORT_SCHEMA,
    });
    if (!parsePersonalReport(report)) {
      throw new Error("개인 사주 리포트 JSON 구조가 완성되지 않았습니다.");
    }

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
    // 상담 근거는 상담 진입 시 백필도 가능하므로, 긴 사주 생성 응답을 막지 않는다.
    void refreshConsultBasis(userId, "personal", report, generatedAt);

    return NextResponse.json({
      report,
      saju,
      actions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `응답 생성 실패: ${message}` }, { status: 502 });
  }
}
