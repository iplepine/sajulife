import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { getProfile, getTci } from "@/lib/store/guest";
import { getSavedReport, saveReport } from "@/lib/store/reports";
import { formatScoresForPrompt, scoreTci } from "@/lib/tci/scoring";

export const runtime = "nodejs";

/**
 * GET — 저장된 리포트 반환. 없으면 null (404 아님 — 프론트가 단순 분기 가능).
 */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const saved = await getSavedReport(userId, "tci");
  return NextResponse.json({ saved });
}

/**
 * POST — 새 리포트 생성 후 저장 (덮어쓰기).
 *
 * 주의: 기질 리포트는 TCI 7차원 점수만을 근거로 한다. 사주 계산은 하지 않으며
 * 프롬프트에도 사주 관련 변수를 주입하지 않는다. (프로필은 이름·성별만 사용.)
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

  const scores = scoreTci(tci.answers);

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    gender: profile.gender === "male" ? "남성" : "여성",
    tciScores: formatScoresForPrompt(scores),
    ...getNowVars(),
  });

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, { temperature: prompt.temperature });

    // 영속 저장: TCI 리포트는 점수만 meta로 보관.
    await saveReport(userId, "tci", {
      report,
      generatedAt: new Date().toISOString(),
      provider: ai.name,
      model: ai.model,
      meta: { scores },
    });

    return NextResponse.json({
      report,
      scores,
      debug: { prompt: rendered, model: ai.model, provider: ai.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
