import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { resolveScopeOrNull } from "@/lib/store/session";
import { ensureConsultBasisFresh } from "@/lib/consult/summarize";
import { getNowVars } from "@/lib/datetime";
import { profileContextForPrompt } from "@/lib/profile/context";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { stripActionsTrailer } from "@/lib/report/actions";
import { consultBasisSources, formatConsultBasisForPrompt } from "@/lib/store/consultBasis";
import { appendConsult, listConsults } from "@/lib/store/consults";
import { getProfile } from "@/lib/store/guest";
import { getSavedReport } from "@/lib/store/reports";
import type { ReportKind, SavedConsult } from "@/lib/store/types";

export const runtime = "nodejs";

/** GET에서 "근거로 쓸 풀이" 노출 순서. */
const REPORT_KINDS: ReportKind[] = ["fusion", "personal", "tci", "family"];

/** 근거 라벨용 짧은 이름. */
const SOURCE_SHORT: Record<ReportKind, string> = {
  fusion: "융합",
  personal: "개인 사주",
  tci: "기질",
  family: "가족 사주",
};

/** GET — 히스토리 요약 리스트 + 근거로 쓸 풀이 목록 (입력 폼 안내용). */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;

  const [history, profile, present] = await Promise.all([
    listConsults(userId),
    getProfile(userId),
    Promise.all(REPORT_KINDS.map((k) => getSavedReport(userId, k).then((s) => (s ? k : null)))),
  ]);
  const sources = present.filter((k): k is ReportKind => k !== null);
  return NextResponse.json({ history, sources, hasProfile: !!profile });
}

/** POST — 새 상담 풀이 생성 + 히스토리에 저장. */
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
  if (!profile) return NextResponse.json({ error: "먼저 사주 정보를 입력하세요." }, { status: 400 });

  const nowVars = getNowVars();

  // 근거: 존재하는 모든 풀이 요약을 합쳐 보낸다 (선택 없이). 낡았으면 그 자리에서 백필.
  const doc = await ensureConsultBasisFresh(userId);
  const sources = consultBasisSources(doc);
  const hasRequiredReports = sources.includes("personal") && sources.includes("tci") && sources.includes("fusion");
  if (!hasRequiredReports) {
    return NextResponse.json(
      { error: "상담은 사주와 기질, 융합 사주를 모두 완료한 뒤 시작할 수 있어요." },
      { status: 400 },
    );
  }
  const contextBlock = formatConsultBasisForPrompt(doc);
  const basisLabel = `${sources.map((k) => SOURCE_SHORT[k]).join("·")} 풀이 근거`;

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
      sources,
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
