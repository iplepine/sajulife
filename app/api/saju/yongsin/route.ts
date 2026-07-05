import { after, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { currentConcernLabel, occupationLabel, profileContextForPrompt } from "@/lib/profile/context";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju } from "@/lib/saju/calculator";
import { buildYongsinView, formatYongsinReadingForPrompt } from "@/lib/saju/yongsinView";
import { getProfile } from "@/lib/store/guest";
import { isReportErrorExpired, isReportJobStale } from "@/lib/store/reports";
import { resolveScopeOrNull } from "@/lib/store/session";
import {
  clearYongsinJob,
  getYongsinJob,
  getYongsinReading,
  saveYongsinReading,
  setYongsinJob,
} from "@/lib/store/yongsinReading";

export const runtime = "nodejs";
// 생성이 요청과 분리돼 after()로 백그라운드에서 도는 동안 함수가 살아있어야 한다.
export const maxDuration = 300;

const YONGSIN_MAX_OUTPUT_TOKENS = 16384;

/**
 * GET — 상태 폴링. 개인 사주와 동일한 규약:
 * - generating: 백그라운드 생성 중 (stale하면 error로 격하하고 죽은 작업 정리)
 * - error: 생성 실패 (오래된 실패는 무시하고 idle)
 * - idle: 진행 중 작업 없음. saved가 있으면 최신 저장본.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;

  const [saved, job] = await Promise.all([getYongsinReading(userId), getYongsinJob(userId)]);

  if (job?.status === "generating") {
    if (isReportJobStale(job)) {
      await clearYongsinJob(userId);
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
 * 실제 AI 생성은 after()로 백그라운드에서 돌린다(클라이언트는 폴링으로 완료 확인).
 * 이미 생성 중이면 중복 시작 없이 현재 상태를 반환한다(멱등).
 */
export async function POST() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;

  const existing = await getYongsinJob(userId);
  if (existing?.status === "generating" && !isReportJobStale(existing)) {
    return NextResponse.json({ status: "generating", startedAt: existing.startedAt }, { status: 202 });
  }

  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });

  const startedAt = new Date().toISOString();
  await setYongsinJob(userId, { status: "generating", startedAt });

  after(async () => {
    try {
      await runYongsinGeneration(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setYongsinJob(userId, { status: "error", startedAt, error: `응답 생성 실패: ${message}` });
    }
  });

  return NextResponse.json({ status: "generating", startedAt }, { status: 202 });
}

/**
 * 실제 용신 풀이 생성 — 격국·억부·조후·종합·흐름은 코드로 계산해 사실로 주입하고, LLM은 해석만 한다.
 * 성공하면 저장본을 쓰고 작업 레코드를 지운다. 실패는 throw해 호출부(after)가 error로 기록한다.
 */
async function runYongsinGeneration(userId: string): Promise<void> {
  const [profile, prompt] = await Promise.all([getProfile(userId), getPrompt("yongsin-saju")]);
  if (!profile) throw new Error("사주 정보를 먼저 입력하세요.");

  const saju = calculateSaju(profile);
  const nowVars = getNowVars();
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);
  const view = buildYongsinView(saju, currentAge, Number(nowVars.currentYear));

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    gender: profile.gender === "male" ? "남성" : "여성",
    currentAge: String(currentAge),
    occupation: occupationLabel(profile),
    profileContext: profileContextForPrompt(profile),
    currentConcern: currentConcernLabel(profile),
    yongsinFacts: formatYongsinReadingForPrompt(view),
    ...nowVars,
  });

  const ai = getAIProvider();
  const report = await ai.generate(rendered, {
    temperature: prompt.temperature,
    maxOutputTokens: YONGSIN_MAX_OUTPUT_TOKENS,
  });
  if (!report.trim()) throw new Error("빈 응답이 반환되었습니다.");

  await saveYongsinReading(userId, {
    report,
    generatedAt: new Date().toISOString(),
    provider: ai.name,
    model: ai.model,
  });
  await clearYongsinJob(userId);
}
