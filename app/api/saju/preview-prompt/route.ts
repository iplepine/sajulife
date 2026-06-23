import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { getNowVars } from "@/lib/datetime";
import { DEFAULT_PROMPTS } from "@/lib/prompts/defaults";
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
import { getProfile } from "@/lib/store/guest";

/**
 * 로컬 defaults.ts의 personal-saju 템플릿을 현재 사용자 프로필로 렌더해 반환.
 * - AI 호출 없음 (비용 0)
 * - KV에 저장된 옛 프롬프트가 아닌 코드의 defaults.ts를 기준 — 프롬프트 반복 작업용
 * - Gem 외부 테스트에 그대로 붙여넣을 수 있는 완전 렌더 텍스트
 */
export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });

  const saju = calculateSaju(profile);
  const nowVars = getNowVars();
  const birthYear = Number(profile.birthDate.split("-")[0]) || 0;
  const currentAge = Math.max(0, Number(nowVars.currentYear) - birthYear);
  const balance = computeBalanceWithDayun(saju, Number(nowVars.currentYear), birthYear);

  const rendered = renderTemplate(DEFAULT_PROMPTS["personal-saju"].template, {
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

  return NextResponse.json({ prompt: rendered });
}
