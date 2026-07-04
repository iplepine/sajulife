import { after, NextResponse } from "next/server";
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
import {
  clearReportJob,
  getReportJob,
  getSavedReport,
  isReportErrorExpired,
  isReportJobStale,
  saveReport,
  setReportJob,
} from "@/lib/store/reports";

export const runtime = "nodejs";
// 생성이 요청과 분리돼 after()로 백그라운드에서 도는 동안 함수가 살아있어야 한다.
// (Vercel Hobby는 60초로 캡됨 — Pro 이상에서만 이 값이 실효)
export const maxDuration = 300;

const PERSONAL_REPORT_MAX_OUTPUT_TOKENS = 32768;

/**
 * 상태 폴링용 GET.
 * - generating: 백그라운드 생성 진행 중 (stale하면 error로 격하하고 죽은 작업 정리)
 * - error: 생성 실패 (오래된 실패는 무시하고 idle로)
 * - idle: 진행 중 작업 없음. saved가 있으면 최신 저장본.
 * 어느 경우든 `saved`(이전/최신 저장본)를 함께 실어 하위호환을 유지한다.
 */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [saved, job] = await Promise.all([
    getSavedReport(userId, "personal"),
    getReportJob(userId, "personal"),
  ]);

  if (job?.status === "generating") {
    if (isReportJobStale(job)) {
      await clearReportJob(userId, "personal");
      return NextResponse.json({
        saved,
        status: "error",
        error: "풀이 생성이 지연되고 있어요. 다시 시도해 주세요.",
      });
    }
    return NextResponse.json({ saved, status: "generating", startedAt: job.startedAt });
  }

  if (job?.status === "error" && !isReportErrorExpired(job)) {
    return NextResponse.json({ saved, status: "error", error: job.error ?? "풀이 생성에 실패했어요." });
  }

  return NextResponse.json({ saved, status: "idle" });
}

/**
 * 생성 시작.
 * 즉시 job=generating을 기록하고 202로 응답한 뒤, 실제 AI 생성은 after()로 백그라운드에서 돌린다.
 * → 클라이언트는 응답을 기다릴 필요 없이 폴링으로 완료를 확인한다(다른 화면으로 이동 가능).
 * 이미 생성 중이면 중복 시작 없이 현재 상태를 반환한다(멱등).
 */
export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getReportJob(userId, "personal");
  if (existing?.status === "generating" && !isReportJobStale(existing)) {
    return NextResponse.json({ status: "generating", startedAt: existing.startedAt }, { status: 202 });
  }

  // 즉각 검증: 프로필이 없으면 백그라운드로 넘기지 않고 바로 알린다.
  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });

  const startedAt = new Date().toISOString();
  await setReportJob(userId, "personal", { status: "generating", startedAt });

  after(async () => {
    try {
      await runPersonalGeneration(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setReportJob(userId, "personal", {
        status: "error",
        startedAt,
        error: `응답 생성 실패: ${message}`,
      });
    }
  });

  return NextResponse.json({ status: "generating", startedAt }, { status: 202 });
}

/**
 * 실제 개인 사주 풀이 생성 — 프로필/프롬프트 로드부터 저장까지.
 * 성공하면 SavedReport를 쓰고 작업 레코드를 지운다. 실패는 throw해 호출부(after)가 error로 기록한다.
 */
async function runPersonalGeneration(userId: string): Promise<void> {
  const [profile, prompt] = await Promise.all([
    getProfile(userId),
    getPrompt("personal-saju"),
  ]);
  if (!profile) throw new Error("사주 정보를 먼저 입력하세요.");

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
  // 성공 → 작업 레코드 제거(최신 SavedReport가 완료 신호가 된다).
  await clearReportJob(userId, "personal");
  // 상담 근거는 상담 진입 시 백필도 가능하므로, 생성 완료를 막지 않는다.
  void refreshConsultBasis(userId, "personal", report, generatedAt);
}
