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
import { stripActionsTrailer } from "@/lib/report/actions";
import { getProfile, getTci } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";
import { formatScoresForPrompt, scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";

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
    const raw = await ai.generate(rendered, { temperature: prompt.temperature });

    // 유연성(8번째 축)은 본문 끝 "FLEX=NN" 한 줄로 받는다 — 화면엔 안 보이게 떼어낸다.
    const flexMatch = raw.match(/^\s*FLEX\s*=\s*(\d{1,3})\s*$/m);
    const flexibility = flexMatch ? Math.min(100, Math.max(0, Number(flexMatch[1]))) : undefined;
    const withoutFlex = raw.replace(/^\s*FLEX\s*=\s*\d{1,3}\s*$/m, "").trimEnd();
    // 코칭 액션 플랜은 본문 끝 "ACTIONS=[...]" 한 줄로 받는다 — 떼어내 별도 저장.
    const { body: report, actions } = stripActionsTrailer(withoutFlex);
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
