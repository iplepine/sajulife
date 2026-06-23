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
import { formatDayunForPrompt, formatSajuForPrompt } from "@/lib/saju/format";
import { stripActionsTrailer } from "@/lib/report/actions";
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
    sajuTable: formatSajuForPrompt(saju),
    dayMaster: `${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
    shengXiao: `${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
    sajuBalance: formatBalanceForPrompt(balance),
    currentAge: String(currentAge),
    dayunTable: formatDayunForPrompt(saju, currentAge),
    tciScores: formatScoresForPrompt(scores),
    ...nowVars,
  });

  try {
    const ai = getAIProvider();
    const raw = await ai.generate(rendered, { temperature: prompt.temperature });

    // 유연성(8번째 축)은 본문 끝 "FLEX=NN" 한 줄로 받는다 — 화면엔 안 보이게 떼어낸다.
    const flexMatch = raw.match(/^\s*FLEX\s*=\s*(\d{1,3})\s*$/m);
    const flexibility = flexMatch ? Math.min(100, Math.max(0, Number(flexMatch[1]))) : undefined;
    const withoutFlex = raw.replace(/^\s*FLEX\s*=\s*\d{1,3}\s*$/m, "").trimEnd();
    // 코칭 액션 플랜은 본문 끝 "ACTIONS=[...]" 한 줄로 받는다 — 떼어내 별도 저장.
    const { body: report, actions } = stripActionsTrailer(withoutFlex);
    const generatedAt = new Date().toISOString();

    await saveReport(userId, "fusion", {
      report,
      generatedAt,
      provider: ai.name,
      model: ai.model,
      meta: { scores, saju, flexibility },
      actions,
    });
    // 상담 근거 갱신 (요약 실패는 리포트 응답을 막지 않음).
    await refreshConsultBasis(userId, "fusion", report, generatedAt);

    return NextResponse.json({
      report,
      scores,
      saju,
      flexibility,
      actions,
      debug: { prompt: rendered, model: ai.model, provider: ai.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
