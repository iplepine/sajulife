import { after, NextResponse } from "next/server";
import { getAIProvider, safetyIdentifierForUser } from "@/lib/ai";
import {
  aiGenerationErrorKind,
  aiGenerationRejection,
  assertAIGenerationEnabled,
  createAIGenerationTelemetry,
  logAIGeneration,
  logAIGenerationRejection,
  publicAIGenerationError,
  reserveAIGeneration,
} from "@/lib/ai/generationGuard";
import { resolveScopeOrNull } from "@/lib/store/session";
import { refreshConsultBasis } from "@/lib/consult/summarize";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { COMPAT_REPORT_SCHEMA } from "@/lib/saju/compatReportSchema";
import { actionsFromReportJson } from "@/lib/report/actions";
import { generateStructuredReportWithRepair } from "@/lib/report/generate";
import { parseFamilyReport } from "@/lib/report/types";
import { familyMemberContextForPrompt } from "@/lib/profile/context";
import { formatDayunForPrompt, formatSajuForPrompt } from "@/lib/saju/format";
import { compatReportBasisSignature, selectedCompatPartner } from "@/lib/saju/compatReport";
import { getCompat, getProfile } from "@/lib/store/guest";
import {
  clearReportJob,
  getReportJob,
  getSavedReport,
  isReportErrorExpired,
  isReportJobStale,
  saveReport,
  setReportJob,
} from "@/lib/store/reports";
import type { CompatPartner } from "@/lib/store/types";

export const runtime = "nodejs";
// 생성이 요청과 분리돼 after()로 백그라운드에서 도는 동안 함수가 살아있어야 한다.
// (Vercel Hobby는 60초로 캡됨 — Pro 이상에서만 이 값이 실효)
export const maxDuration = 300;

function formatPartnerBlock(p: CompatPartner, saju: SajuResult, today: string): string {
  const g = p.profile.gender === "male" ? "남성" : "여성";
  const c = p.profile.calendar === "lunar" ? "음력" : "양력";
  const t = p.profile.birthTime || "시각 모름";
  const currentAge = calculateCurrentAge(p.profile.birthDate, today);
  return [
    `■ ${p.relation} · ${p.profile.name} (${g}, ${p.profile.birthDate} ${t} ${c})`,
    `  ${familyMemberContextForPrompt(p.profile)}`,
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

/**
 * GET — 상태 폴링(가족·개인 사주와 동일 규약). generating / error / idle.
 * 어느 경우든 saved(이전/최신 저장본)를 함께 실어 하위호환을 유지한다.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;

  const [saved, job] = await Promise.all([
    getSavedReport(userId, "compat"),
    getReportJob(userId, "compat"),
  ]);

  if (job?.status === "generating") {
    if (isReportJobStale(job)) {
      await clearReportJob(userId, "compat");
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
  const telemetry = createAIGenerationTelemetry("/api/compat/report", "compat");

  const existing = await getReportJob(userId, "compat");
  if (existing?.status === "generating" && !isReportJobStale(existing)) {
    return NextResponse.json({ status: "generating", startedAt: existing.startedAt }, { status: 202 });
  }

  const [profile, compat] = await Promise.all([getProfile(userId), getCompat(userId)]);
  if (!profile) return NextResponse.json({ error: "본인 사주 정보를 먼저 입력하세요." }, { status: 400 });
  if (!selectedCompatPartner(compat)) {
    return NextResponse.json({ error: "궁합을 볼 상대를 먼저 추가하세요." }, { status: 400 });
  }

  const allowance = await reserveAIGeneration(scope.userId, "compat");
  if (!allowance.allowed) {
    logAIGenerationRejection(telemetry, allowance);
    const rejected = aiGenerationRejection(allowance);
    return NextResponse.json(
      { error: rejected.error },
      { status: rejected.status, headers: { ...rejected.headers, "X-Request-Id": telemetry.requestId } },
    );
  }

  const startedAt = new Date().toISOString();
  await setReportJob(userId, "compat", { status: "generating", startedAt });
  logAIGeneration(telemetry, "accepted", {
    limit: allowance.limit,
    remaining: allowance.remaining,
    accountLimit: allowance.accountLimit,
    accountRemaining: allowance.accountRemaining,
  });

  after(async () => {
    logAIGeneration(telemetry, "started");
    try {
      const result = await runCompatGeneration(userId, safetyIdentifierForUser(scope.userId));
      if (result.qualityIssueCount > 0) {
        logAIGeneration(telemetry, "quality_warning", {
          provider: result.provider,
          model: result.model,
          fallback: result.usedFallback,
          qualityIssueCount: result.qualityIssueCount,
        });
      }
      logAIGeneration(telemetry, "succeeded", {
        provider: result.provider,
        model: result.model,
        fallback: result.usedFallback,
      });
    } catch (err) {
      logAIGeneration(telemetry, "failed", { errorKind: aiGenerationErrorKind(err) });
      await setReportJob(userId, "compat", { status: "error", startedAt, error: publicAIGenerationError(err) });
    }
  });

  return NextResponse.json(
    { status: "generating", startedAt },
    { status: 202, headers: { "X-Request-Id": telemetry.requestId } },
  );
}

/**
 * 실제 궁합 풀이 생성 — 본인 + 선택한 상대 1명의 사주를 근거로.
 * 성공하면 저장본을 쓰고 작업 레코드를 지운다. 실패는 throw해 호출부(after)가 error로 기록한다.
 */
async function runCompatGeneration(
  userId: string,
  safetyIdentifier: string,
): Promise<{ provider: string; model: string; qualityIssueCount: number; usedFallback: boolean }> {
  const [profile, compat, prompt] = await Promise.all([
    getProfile(userId),
    getCompat(userId),
    getPrompt("compat-saju"),
  ]);
  if (!profile) throw new Error("본인 사주 정보를 먼저 입력하세요.");
  const partner = selectedCompatPartner(compat);
  if (!partner) throw new Error("궁합을 볼 상대를 먼저 추가하세요.");

  const selfSaju = calculateSaju(profile);
  const partnerSaju = calculateSaju(partner.profile);
  const nowVars = getNowVars();
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);

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
    relationLabel: partner.relation,
    partnerName: partner.profile.name,
    partnerTable: formatPartnerBlock(partner, partnerSaju, nowVars.today),
    ...nowVars,
  });

  // 생성 → 품질 게이트(궁합도 가족과 같이 한자 전면 금지) → 결함 시 1회 자가교정.
  assertAIGenerationEnabled("compat");
  const ai = getAIProvider();
  const { report, parsed, quality, provider, model, usedFallback } = await generateStructuredReportWithRepair({
    ai,
    rendered,
    opts: {
      temperature: prompt.temperature,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: COMPAT_REPORT_SCHEMA,
      safetyIdentifier,
    },
    kind: "compat",
    // 궁합도 sections가 비면 구조 미완성으로 본다 → parse에서 null 처리해 리페어를 유발.
    parse: (raw) => {
      const p = parseFamilyReport(raw);
      return p && p.sections.length > 0 ? p : null;
    },
  });
  if (!parsed) {
    throw new Error("궁합 리포트 JSON 구조가 완성되지 않았습니다.");
  }

  const actions = actionsFromReportJson(report);
  const generatedAt = new Date().toISOString();

  await saveReport(userId, "compat", {
    report,
    generatedAt,
    provider,
    model,
    meta: {
      saju: { self: selfSaju, partner: partnerSaju },
      compatSignature: compatReportBasisSignature(profile, compat),
      relation: partner.relation,
    },
    actions,
  });
  await clearReportJob(userId, "compat");
  // 상담 근거는 상담 진입 시 백필도 가능하므로, 생성 완료를 막지 않는다.
  void refreshConsultBasis(userId, "compat", report, generatedAt);
  return { provider, model, qualityIssueCount: quality.errors.length, usedFallback };
}
