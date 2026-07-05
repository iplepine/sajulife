import { after, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { resolveScopeOrNull } from "@/lib/store/session";
import { refreshConsultBasis } from "@/lib/consult/summarize";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { FAMILY_REPORT_SCHEMA } from "@/lib/saju/familyReportSchema";
import { actionsFromReportJson } from "@/lib/report/actions";
import { parseFamilyReport } from "@/lib/report/types";
import { familyMemberContextForPrompt } from "@/lib/profile/context";
import { formatDayunForPrompt, formatSajuForPrompt } from "@/lib/saju/format";
import { familyReportBasisSignature } from "@/lib/saju/familyReportBasis";
import { getFamily, getProfile } from "@/lib/store/guest";
import {
  clearReportJob,
  getReportJob,
  getSavedReport,
  isReportErrorExpired,
  isReportJobStale,
  saveReport,
  setReportJob,
} from "@/lib/store/reports";
import type { FamilyMember } from "@/lib/store/types";

export const runtime = "nodejs";
// 생성이 요청과 분리돼 after()로 백그라운드에서 도는 동안 함수가 살아있어야 한다.
// (Vercel Hobby는 60초로 캡됨 — Pro 이상에서만 이 값이 실효)
export const maxDuration = 300;

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

/**
 * GET — 상태 폴링(개인 사주와 동일 규약). generating / error / idle.
 * 어느 경우든 saved(이전/최신 저장본)를 함께 실어 하위호환을 유지한다.
 */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = scope.scopeId;

  const [saved, job] = await Promise.all([
    getSavedReport(userId, "family"),
    getReportJob(userId, "family"),
  ]);

  if (job?.status === "generating") {
    if (isReportJobStale(job)) {
      await clearReportJob(userId, "family");
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

  const existing = await getReportJob(userId, "family");
  if (existing?.status === "generating" && !isReportJobStale(existing)) {
    return NextResponse.json({ status: "generating", startedAt: existing.startedAt }, { status: 202 });
  }

  const [profile, family] = await Promise.all([getProfile(userId), getFamily(userId)]);
  if (!profile) return NextResponse.json({ error: "본인 사주 정보를 먼저 입력하세요." }, { status: 400 });
  if (family.members.length === 0) {
    return NextResponse.json({ error: "가족 구성원을 1명 이상 추가하세요." }, { status: 400 });
  }

  const startedAt = new Date().toISOString();
  await setReportJob(userId, "family", { status: "generating", startedAt });

  after(async () => {
    try {
      await runFamilyGeneration(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await setReportJob(userId, "family", { status: "error", startedAt, error: `응답 생성 실패: ${message}` });
    }
  });

  return NextResponse.json({ status: "generating", startedAt }, { status: 202 });
}

/**
 * 실제 가족 풀이 생성 — 본인 + 구성원 사주를 근거로.
 * 성공하면 저장본을 쓰고 작업 레코드를 지운다. 실패는 throw해 호출부(after)가 error로 기록한다.
 */
async function runFamilyGeneration(userId: string): Promise<void> {
  const [profile, family, prompt] = await Promise.all([
    getProfile(userId),
    getFamily(userId),
    getPrompt("family-saju"),
  ]);
  if (!profile) throw new Error("본인 사주 정보를 먼저 입력하세요.");
  if (family.members.length === 0) throw new Error("가족 구성원을 1명 이상 추가하세요.");

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

  const ai = getAIProvider();
  const report = await ai.generate(rendered, {
    temperature: prompt.temperature,
    maxOutputTokens: 65536,
    responseMimeType: "application/json",
    responseSchema: FAMILY_REPORT_SCHEMA,
  });
  const parsedReport = parseFamilyReport(report);
  if (!parsedReport || parsedReport.sections.length === 0) {
    throw new Error("가족 리포트 JSON 구조가 완성되지 않았습니다.");
  }

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
    meta: { saju: sajuPayload, familySignature: familyReportBasisSignature(profile, family) },
    actions,
  });
  await clearReportJob(userId, "family");
  // 상담 근거는 상담 진입 시 백필도 가능하므로, 생성 완료를 막지 않는다.
  void refreshConsultBasis(userId, "family", report, generatedAt);
}
