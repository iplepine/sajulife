import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { refreshConsultBasis } from "@/lib/consult/summarize";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { FAMILY_REPORT_SCHEMA } from "@/lib/saju/familyReportSchema";
import { actionsFromReportJson } from "@/lib/report/actions";
import { familyMemberContextForPrompt } from "@/lib/profile/context";
import { formatDayunForPrompt, formatSajuForPrompt } from "@/lib/saju/format";
import { getFamily, getProfile } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";
import type { FamilyMember } from "@/lib/store/types";

export const runtime = "nodejs";

function formatMemberBlock(m: FamilyMember, saju: SajuResult, today: string): string {
  const g = m.profile.gender === "male" ? "남성" : "여성";
  const c = m.profile.calendar === "lunar" ? "음력" : "양력";
  const t = m.profile.birthTime || "시각 모름";
  const currentAge = calculateCurrentAge(m.profile.birthDate, today);
  return [
    `■ ${m.relation} · ${m.profile.name} (${g}, ${m.profile.birthDate} ${t} ${c})`,
    `  ${familyMemberContextForPrompt(m.profile)}`,
    `  현재 만 나이: ${currentAge}세`,
    `  일간: ${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
    `  띠: ${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
    formatSajuForPrompt(saju)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n"),
    `  대운 흐름:\n${formatDayunForPrompt(saju, currentAge)
      .split("\n")
      .map((l) => `    ${l}`)
      .join("\n")}`,
  ].join("\n");
}

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const saved = await getSavedReport(userId, "family");
  return NextResponse.json({ saved });
}

export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [profile, family, prompt] = await Promise.all([
    getProfile(userId),
    getFamily(userId),
    getPrompt("family-saju"),
  ]);

  if (!profile) return NextResponse.json({ error: "본인 사주 정보를 먼저 입력하세요." }, { status: 400 });
  if (family.members.length === 0) {
    return NextResponse.json({ error: "가족 구성원을 1명 이상 추가하세요." }, { status: 400 });
  }

  const selfSaju = calculateSaju(profile);
  const memberSajus = family.members.map((m) => ({ member: m, saju: calculateSaju(m.profile) }));
  const nowVars = getNowVars();
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);

  const familyTable = memberSajus.map(({ member, saju }) => formatMemberBlock(member, saju, nowVars.today)).join("\n\n");

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || "시각 모름",
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    profileContext: familyMemberContextForPrompt(profile),
    sajuTable: formatSajuForPrompt(selfSaju),
    dayMaster: `${selfSaju.dayMaster.ko}(${selfSaju.dayMaster.hanja}) · ${selfSaju.dayMaster.wuxing} · ${selfSaju.dayMaster.yinyang}`,
    currentAge: String(currentAge),
    selfDayunTable: formatDayunForPrompt(selfSaju, currentAge),
    familyTable,
    ...nowVars,
  });

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, {
      temperature: prompt.temperature,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: FAMILY_REPORT_SCHEMA,
    });

    const sajuPayload = {
      self: selfSaju,
      members: memberSajus.map(({ member, saju }) => ({ id: member.id, saju })),
    };

    const actions = actionsFromReportJson(report);
    const generatedAt = new Date().toISOString();

    await saveReport(userId, "family", {
      report,
      generatedAt,
      provider: ai.name,
      model: ai.model,
      meta: { saju: sajuPayload },
      actions,
    });
    // 상담 근거 갱신 (요약 실패는 리포트 응답을 막지 않음).
    await refreshConsultBasis(userId, "family", report, generatedAt);

    return NextResponse.json({
      report,
      saju: sajuPayload,
      actions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
