import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { ensureConsultBasisFresh } from "@/lib/consult/summarize";
import { calculateCurrentAge, getNowVars } from "@/lib/datetime";
import { profileContextForPrompt } from "@/lib/profile/context";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { computeBalanceWithDayun, formatBalanceForPrompt } from "@/lib/saju/balance";
import { calculateSaju } from "@/lib/saju/calculator";
import { formatSajuForPrompt } from "@/lib/saju/format";
import { stripActionsTrailer } from "@/lib/report/actions";
import { consultBasisSources, formatConsultBasisForPrompt } from "@/lib/store/consultBasis";
import { appendConsult, listConsults } from "@/lib/store/consults";
import { getProfile, getTci } from "@/lib/store/guest";
import { getSavedReport } from "@/lib/store/reports";
import type { ReportKind, SajuProfile, SavedConsult } from "@/lib/store/types";
import { formatScoresForPrompt, scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";

/** GET에서 "근거로 쓸 리포트" 노출 순서. */
const REPORT_KINDS: ReportKind[] = ["fusion", "personal", "tci", "family"];

/** 근거 라벨용 짧은 이름. */
const SOURCE_SHORT: Record<ReportKind, string> = {
  fusion: "융합",
  personal: "개인 사주",
  tci: "기질",
  family: "가족 사주",
};

/**
 * 리포트가 하나도 없을 때의 폴백 — 프로필(+기질)로 원본 컨텍스트를 만든다.
 * 첫 사용자도 리포트 생성 전에 바로 상담할 수 있게 한다.
 */
async function rawFallbackContext(
  userId: string,
  profile: SajuProfile,
  today: string,
): Promise<string> {
  const saju = calculateSaju(profile);
  const currentAge = calculateCurrentAge(profile.birthDate, today);
  const balance = computeBalanceWithDayun(saju, currentAge);
  const parts = [
    "[사용자 맥락]",
    profileContextForPrompt(profile),
    "",
    "[사주]",
    formatSajuForPrompt(saju),
    "",
    "[사주 음양·한열 좌표]",
    formatBalanceForPrompt(balance),
  ];
  const tci = await getTci(userId);
  if (tci) {
    parts.push(
      "",
      "[기질 7차원 점수]",
      formatScoresForPrompt(await scoreTciByVariant(tci.variant, tci.answers)),
    );
  }
  return parts.join("\n");
}

/** GET — 히스토리 요약 리스트 + 근거로 쓸 리포트 목록 (입력 폼 안내용). */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [history, profile, present] = await Promise.all([
    listConsults(userId),
    getProfile(userId),
    Promise.all(REPORT_KINDS.map((k) => getSavedReport(userId, k).then((s) => (s ? k : null)))),
  ]);
  const sources = present.filter((k): k is ReportKind => k !== null);
  return NextResponse.json({ history, sources, hasProfile: !!profile });
}

/** POST — 새 상담 리포트 생성 + 히스토리에 저장. */
export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { question?: string };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "질문을 입력하세요." }, { status: 400 });
  if (question.length > 1000) {
    return NextResponse.json({ error: "질문이 너무 깁니다 (최대 1000자)." }, { status: 400 });
  }

  const [profile, prompt] = await Promise.all([getProfile(userId), getPrompt("consult")]);
  if (!profile) return NextResponse.json({ error: "먼저 사주 정보를 입력하세요." }, { status: 400 });

  const nowVars = getNowVars();

  // 근거: 존재하는 모든 리포트 요약을 합쳐 보낸다 (선택 없이). 낡았으면 그 자리에서 백필.
  const doc = await ensureConsultBasisFresh(userId);
  const sources = consultBasisSources(doc);

  let contextBlock: string;
  let basisLabel: string;
  if (sources.length > 0) {
    contextBlock = formatConsultBasisForPrompt(doc);
    basisLabel = `${sources.map((k) => SOURCE_SHORT[k]).join("·")} 리포트 근거`;
  } else {
    // 아직 생성된 리포트가 없음 — 원본 사주·기질 데이터로 폴백.
    contextBlock = await rawFallbackContext(userId, profile, nowVars.today);
    basisLabel = "기본 사주 정보 (리포트 생성 전)";
  }

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
    return NextResponse.json({
      record,
      debug: { prompt: rendered, model: ai.model, provider: ai.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
