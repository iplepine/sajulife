import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { resolveScopeOrNull } from "@/lib/store/session";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { profileContextForPrompt } from "@/lib/profile/context";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { stripActionsTrailer } from "@/lib/report/actions";
import { appendConsult, listConsults } from "@/lib/store/consults";
import { getProfile } from "@/lib/store/guest";
import { calculateSaju } from "@/lib/saju/calculator";
import { buildYongsinView, formatYongsinReadingForPrompt } from "@/lib/saju/yongsinView";
import type { SavedConsult } from "@/lib/store/types";

export const runtime = "nodejs";

/** GET — 용신상담 히스토리와 사주 정보 유무. */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;

  const [history, profile] = await Promise.all([
    listConsults(userId),
    getProfile(userId),
  ]);
  return NextResponse.json({ history, hasProfile: !!profile });
}

/** POST — 새 용신상담 생성 + 히스토리에 저장. */
export async function POST(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;

  const body = (await req.json().catch(() => ({}))) as { question?: string };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "질문을 입력하세요." }, { status: 400 });
  if (question.length > 1000) {
    return NextResponse.json({ error: "질문이 너무 깁니다 (최대 1000자)." }, { status: 400 });
  }

  const [profile, prompt] = await Promise.all([getProfile(userId), getPrompt("consult")]);
  if (!profile) return NextResponse.json({ error: "용신상담을 하려면 먼저 사주 정보를 입력하세요." }, { status: 400 });

  const nowVars = getNowVars();

  const saju = calculateSaju(profile);
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);
  const yongsin = buildYongsinView(saju, currentAge, Number(nowVars.currentYear));
  const contextBlock = formatYongsinReadingForPrompt(yongsin);
  const basisLabel = "용신 원국 기준";

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || "(시각 모름)",
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    profileContext: profileContextForPrompt(profile),
    basisLabel,
    contextBlock,
    question,
    ...nowVars,
  });

  try {
    const ai = getAIProvider();
    const raw = await ai.generate(rendered, { temperature: prompt.temperature });
    // 코칭 액션 플랜은 답변 끝 "ACTIONS=[...]" 한 줄로 받는다 — 떼어내 별도 저장.
    const { body: answer, actions } = stripActionsTrailer(raw);
    const record: SavedConsult = {
      id: `c_${randomUUID().slice(0, 8)}`,
      question,
      sources: [],
      basisLabel,
      answer,
      generatedAt: new Date().toISOString(),
      provider: ai.name,
      model: ai.model,
      actions,
    };
    await appendConsult(userId, record);
    return NextResponse.json({ record });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `응답 생성 실패: ${message}` }, { status: 502 });
  }
}
