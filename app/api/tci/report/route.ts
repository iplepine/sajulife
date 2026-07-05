import { after, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { resolveScopeOrNull } from "@/lib/store/session";
import { refreshConsultBasis } from "@/lib/consult/summarize";
import { getNowVars } from "@/lib/datetime";
import {
  childrenStatusLabel,
  currentConcernLabel,
  occupationLabel,
  profileContextForPrompt,
  relationshipStatusLabel,
} from "@/lib/profile/context";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { actionsFromReportJson } from "@/lib/report/actions";
import { parsePersonalReport } from "@/lib/report/types";
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
import { TCI_REPORT_SCHEMA } from "@/lib/tci/reportSchema";
import { formatScoresForPrompt, scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";
// 생성이 요청과 분리돼 after()로 백그라운드에서 도는 동안 함수가 살아있어야 한다.
// (Vercel Hobby는 60초로 캡됨 — Pro 이상에서만 이 값이 실효)
export const maxDuration = 300;

/** 구조화 JSON 리포트에서 유연성(0~100 정수)을 뽑는다. 없으면 undefined. */
function flexibilityFromReportJson(report: string): number | undefined {
  const trimmed = report.trim();
  if (!trimmed.startsWith("{")) return undefined;
  try {
    const obj = JSON.parse(trimmed) as { flexibility?: unknown };
    if (typeof obj.flexibility !== "number" || !Number.isFinite(obj.flexibility)) return undefined;
    return Math.min(100, Math.max(0, Math.round(obj.flexibility)));
  } catch {
    return undefined;
  }
}

/** 채점 실패해도 레이더 없이 진행할 수 있게 null 허용. */
async function computeScores(userId: string) {
  const tci = await getTci(userId);
  if (!tci) return null;
  try {
    return await scoreTciByVariant(tci.variant, tci.answers);
  } catch {
    return null;
  }
}

/**
 * GET — 상태 폴링(개인 사주와 동일 규약) + 레이더용 점수(scores).
 * 점수는 설문 답변에서 바로 계산해 함께 내려준다(AI 비용 없음) — 생성 전·중에도 레이더를 그린다.
 * - generating / error / idle. 어느 경우든 saved·scores를 함께 실어 하위호환 유지.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;

  const [saved, scores, job] = await Promise.all([
    getSavedReport(userId, "tci"),
    computeScores(userId),
    getReportJob(userId, "tci"),
  ]);

  if (job?.status === "generating") {
    if (isReportJobStale(job)) {
      await clearReportJob(userId, "tci");
      return NextResponse.json({ saved, scores, status: "error", error: "풀이 생성이 지연되고 있어요. 다시 시도해 주세요." });
    }
    return NextResponse.json({ saved, scores, status: "generating", startedAt: job.startedAt });
  }
  if (job?.status === "error" && !isReportErrorExpired(job)) {
    return NextResponse.json({ saved, scores, status: "error", error: job.error ?? "풀이 생성에 실패했어요." });
  }
  return NextResponse.json({ saved, scores, status: "idle" });
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

  const existing = await getReportJob(userId, "tci");
  if (existing?.status === "generating" && !isReportJobStale(existing)) {
    return NextResponse.json({ status: "generating", startedAt: existing.startedAt }, { status: 202 });
  }

  const [profile, tci] = await Promise.all([getProfile(userId), getTci(userId)]);
  if (!profile) return NextResponse.json({ error: "프로필을 먼저 입력하세요." }, { status: 400 });
  if (!tci) return NextResponse.json({ error: "기질 설문을 먼저 완료하세요." }, { status: 400 });

  const startedAt = new Date().toISOString();
  await setReportJob(userId, "tci", { status: "generating", startedAt });

  after(async () => {
    try {
      await runTciGeneration(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setReportJob(userId, "tci", { status: "error", startedAt, error: `응답 생성 실패: ${message}` });
    }
  });

  return NextResponse.json({ status: "generating", startedAt }, { status: 202 });
}

/**
 * 실제 기질 풀이 생성 — 7차원 점수만 해석 근거로 한다(사주 계산 없음).
 * 성공하면 저장본을 쓰고 작업 레코드를 지운다. 실패는 throw해 호출부(after)가 error로 기록한다.
 */
async function runTciGeneration(userId: string): Promise<void> {
  const [profile, tci, prompt] = await Promise.all([
    getProfile(userId),
    getTci(userId),
    getPrompt("tci-report"),
  ]);
  if (!profile) throw new Error("프로필을 먼저 입력하세요.");
  if (!tci) throw new Error("기질 설문을 먼저 완료하세요.");

  const scores = await scoreTciByVariant(tci.variant, tci.answers);

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
    tciScores: formatScoresForPrompt(scores),
    ...getNowVars(),
  });

  // 개인 사주 리포트와 동일하게 구조화 JSON으로 받는다(같은 StructuredReport 렌더 경로 공유).
  const ai = getAIProvider();
  const report = await ai.generate(rendered, {
    temperature: prompt.temperature,
    maxOutputTokens: 65536,
    responseMimeType: "application/json",
    responseSchema: TCI_REPORT_SCHEMA,
  });
  if (!parsePersonalReport(report)) {
    throw new Error("기질 리포트 JSON 구조가 완성되지 않았습니다.");
  }

  const flexibility = flexibilityFromReportJson(report);
  if (flexibility === undefined) throw new Error("기질 리포트 유연성 값이 누락되었습니다.");
  const actions = actionsFromReportJson(report);
  const generatedAt = new Date().toISOString();

  await saveReport(userId, "tci", {
    report,
    generatedAt,
    provider: ai.name,
    model: ai.model,
    meta: { scores, flexibility },
    actions,
  });
  await clearReportJob(userId, "tci");
  // 상담 근거는 상담 진입 시 백필도 가능하므로, 생성 완료를 막지 않는다.
  void refreshConsultBasis(userId, "tci", report, generatedAt);
}
