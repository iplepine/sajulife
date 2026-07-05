import { after, NextResponse } from "next/server";
import { getAIProvider, type AIProvider } from "@/lib/ai";
import { resolveScopeOrNull } from "@/lib/store/session";
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
import {
  clearReportJob,
  getReportJob,
  getSavedReport,
  isReportErrorExpired,
  isReportJobStale,
  saveReport,
  setReportJob,
} from "@/lib/store/reports";
import { scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";
// 생성이 요청과 분리돼 after()로 백그라운드에서 도는 동안 함수가 살아있어야 한다.
// (Vercel Hobby는 60초로 캡됨 — Pro 이상에서만 이 값이 실효)
export const maxDuration = 300;

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

/**
 * GET — 상태 폴링(개인 사주와 동일 규약). generating / error / idle.
 * 어느 경우든 saved(이전/최신 저장본)를 함께 실어 하위호환을 유지한다.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;

  const [saved, job] = await Promise.all([
    getSavedReport(userId, "fusion"),
    getReportJob(userId, "fusion"),
  ]);

  if (job?.status === "generating") {
    if (isReportJobStale(job)) {
      await clearReportJob(userId, "fusion");
      return NextResponse.json({ saved, status: "error", error: "풀이 생성이 지연되고 있어요. 다시 시도해 주세요." });
    }
    return NextResponse.json({ saved, status: "generating", startedAt: job.startedAt });
  }
  if (job?.status === "error" && !isReportErrorExpired(job)) {
    return NextResponse.json({ saved, status: "error", error: job.error ?? "풀이 생성에 실패했어요." });
  }
  return NextResponse.json({ saved, status: "idle" });
}

/**
 * POST — 비동기 생성 시작. 즉시 job=generating을 기록하고 202로 응답한 뒤,
 * 실제 AI 생성(품질검증·1회 리페어 포함)은 after()로 백그라운드에서 돌린다.
 * 이미 생성 중이면 중복 시작 없이 현재 상태를 반환한다(멱등).
 */
export async function POST() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;

  const existing = await getReportJob(userId, "fusion");
  if (existing?.status === "generating" && !isReportJobStale(existing)) {
    return NextResponse.json({ status: "generating", startedAt: existing.startedAt }, { status: 202 });
  }

  const [profile, tci] = await Promise.all([getProfile(userId), getTci(userId)]);
  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });
  if (!tci) return NextResponse.json({ error: "기질 설문을 먼저 완료하세요." }, { status: 400 });

  const startedAt = new Date().toISOString();
  await setReportJob(userId, "fusion", { status: "generating", startedAt });

  after(async () => {
    try {
      await runFusionGeneration(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setReportJob(userId, "fusion", { status: "error", startedAt, error: `응답 생성 실패: ${message}` });
    }
  });

  return NextResponse.json({ status: "generating", startedAt }, { status: 202 });
}

/**
 * 실제 융합 풀이 생성 — 기질 7차원 × 생애 사주 종합. 품질검증 실패 시 1회 리페어.
 * 성공하면 저장본(대표 한마디 headline 포함)을 쓰고 작업 레코드를 지운다.
 * 실패는 throw해 호출부(after)가 error로 기록한다.
 */
async function runFusionGeneration(userId: string): Promise<void> {
  const [profile, tci, prompt] = await Promise.all([
    getProfile(userId),
    getTci(userId),
    getPrompt("tci-saju-fusion"),
  ]);
  if (!profile) throw new Error("사주 정보를 먼저 입력하세요.");
  if (!tci) throw new Error("기질 설문을 먼저 완료하세요.");

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

  const ai = getAIProvider();
  const parsed = await generateFusionWithRepair(ai, rendered, prompt.temperature);
  if (parsed.errors.length > 0) {
    throw new Error(`융합 풀이 품질 검증 실패: ${parsed.errors.join(" / ")}`);
  }
  const { report, actions, flexibility, headline } = parsed;
  const generatedAt = new Date().toISOString();

  await saveReport(userId, "fusion", {
    report,
    generatedAt,
    provider: ai.name,
    model: ai.model,
    meta: { scores, saju, flexibility, headline },
    actions,
  });
  await clearReportJob(userId, "fusion");
  // 상담 근거는 상담 진입 시 백필도 가능하므로, 생성 완료를 막지 않는다.
  void refreshConsultBasis(userId, "fusion", report, generatedAt);
}
