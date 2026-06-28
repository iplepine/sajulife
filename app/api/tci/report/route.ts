import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
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
import { getProfile, getTci } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";
import { TCI_REPORT_SCHEMA } from "@/lib/tci/reportSchema";
import { formatScoresForPrompt, scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";

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

/**
 * GET — 저장된 풀이 반환. 없으면 null (404 아님 — 프론트가 단순 분기 가능).
 */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const saved = await getSavedReport(userId, "tci");
  return NextResponse.json({ saved });
}

/**
 * POST — 새 풀이 생성 후 저장 (덮어쓰기).
 *
 * 주의: 기질 풀이는 TCI 7차원 점수만을 해석 근거로 한다. 사주 계산은 하지 않으며
 * 프로필 맥락은 직업·관계·현재 고민에 맞는 사례 선택 힌트로만 주입한다.
 */
export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [profile, tci, prompt] = await Promise.all([
    getProfile(userId),
    getTci(userId),
    getPrompt("tci-report"),
  ]);

  if (!profile) return NextResponse.json({ error: "프로필을 먼저 입력하세요." }, { status: 400 });
  if (!tci) return NextResponse.json({ error: "기질 설문을 먼저 완료하세요." }, { status: 400 });

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

  try {
    const ai = getAIProvider();
    // 개인 사주 리포트와 동일하게 구조화 JSON으로 받는다(같은 StructuredReport 렌더 경로 공유).
    const report = await ai.generate(rendered, {
      temperature: prompt.temperature,
      maxOutputTokens: 65536,
      responseMimeType: "application/json",
      responseSchema: TCI_REPORT_SCHEMA,
    });

    // 유연성(8번째 축)·코칭 액션은 JSON 필드에서 뽑는다 — 레이더/코칭 탭용.
    const flexibility = flexibilityFromReportJson(report);
    const actions = actionsFromReportJson(report);
    const generatedAt = new Date().toISOString();

    // 영속 저장: TCI 풀이는 점수 + 유연성만 meta로 보관.
    await saveReport(userId, "tci", {
      report,
      generatedAt,
      provider: ai.name,
      model: ai.model,
      meta: { scores, flexibility },
      actions,
    });
    // 상담 근거 갱신 (요약 실패는 풀이 응답을 막지 않음).
    await refreshConsultBasis(userId, "tci", report, generatedAt);

    return NextResponse.json({
      report,
      scores,
      flexibility,
      actions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `응답 생성 실패: ${message}` }, { status: 502 });
  }
}
