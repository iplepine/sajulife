import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { currentConcernLabel, occupationLabel, profileContextForPrompt } from "@/lib/profile/context";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju } from "@/lib/saju/calculator";
import { buildYongsinView, formatYongsinReadingForPrompt } from "@/lib/saju/yongsinView";
import { getProfile } from "@/lib/store/guest";
import { getYongsinReading, saveYongsinReading } from "@/lib/store/yongsinReading";

export const runtime = "nodejs";
export const maxDuration = 60;

const YONGSIN_MAX_OUTPUT_TOKENS = 16384;

/** GET — 저장된 용신 풀이 반환. 없으면 null(404 아님 — 프론트 단순 분기). */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const saved = await getYongsinReading(userId);
  return NextResponse.json({ saved });
}

/**
 * POST — 새 용신 풀이 생성 후 저장(덮어쓰기).
 * 격국·억부·조후·종합·흐름은 코드로 계산해 사실로 주입하고, LLM은 해석만 한다.
 */
export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [profile, prompt] = await Promise.all([getProfile(userId), getPrompt("yongsin-saju")]);
  if (!profile) return NextResponse.json({ error: "사주 정보를 먼저 입력하세요." }, { status: 400 });

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

  try {
    const ai = getAIProvider();
    const report = await ai.generate(rendered, {
      temperature: prompt.temperature,
      maxOutputTokens: YONGSIN_MAX_OUTPUT_TOKENS,
    });
    if (!report.trim()) throw new Error("빈 응답이 반환되었습니다.");

    const generatedAt = new Date().toISOString();
    await saveYongsinReading(userId, { report, generatedAt, provider: ai.name, model: ai.model });

    return NextResponse.json({ report, generatedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `응답 생성 실패: ${message}` }, { status: 502 });
  }
}
