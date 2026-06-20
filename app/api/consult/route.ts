import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { computeBalanceWithDayun, formatBalanceForPrompt } from "@/lib/saju/balance";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { formatSajuForPrompt } from "@/lib/saju/format";
import { stripActionsTrailer } from "@/lib/report/actions";
import { appendConsult, listConsults } from "@/lib/store/consults";
import { getFamily, getProfile, getTci } from "@/lib/store/guest";
import type { ConsultBasis, FamilyMember, SavedConsult } from "@/lib/store/types";
import { formatScoresForPrompt, scoreTciByVariant } from "@/lib/tci/scoring";

export const runtime = "nodejs";

const VALID_BASES: ConsultBasis[] = ["tci", "saju", "fusion", "family"];

const BASIS_LABEL: Record<ConsultBasis, string> = {
  tci: "기질 검사 결과 (TCI 7차원)",
  saju: "사주 (만세력 4기둥·오행)",
  fusion: "기질 + 사주 통합",
  family: "본인 + 가족 사주",
};

function isBasis(v: unknown): v is ConsultBasis {
  return typeof v === "string" && (VALID_BASES as string[]).includes(v);
}

function familyBlock(self: SajuResult, members: { m: FamilyMember; saju: SajuResult }[]): string {
  const memberLines = members.map(({ m, saju }) => {
    const t = m.profile.birthTime || "시각 모름";
    const head = `■ ${m.relation} · ${m.profile.name} (${m.profile.birthDate} ${t})`;
    const body = formatSajuForPrompt(saju)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n");
    return `${head}\n${body}`;
  });
  return ["[본인 사주]", formatSajuForPrompt(self), "", "[가족 구성원 사주]", ...memberLines].join("\n");
}

/** GET — 히스토리 요약 리스트 (사이드바용). */
export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const history = await listConsults(userId);
  return NextResponse.json({ history });
}

/** POST — 새 상담 리포트 생성 + 히스토리에 저장. */
export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    basis?: string;
  };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "질문을 입력하세요." }, { status: 400 });
  if (question.length > 1000) {
    return NextResponse.json({ error: "질문이 너무 깁니다 (최대 1000자)." }, { status: 400 });
  }
  if (!isBasis(body.basis)) {
    return NextResponse.json({ error: "유효한 baseline (tci / saju / fusion / family)을 선택하세요." }, { status: 400 });
  }
  const basis: ConsultBasis = body.basis;

  // 공통: 프로필 + 프롬프트 로드
  const [profile, prompt] = await Promise.all([getProfile(userId), getPrompt("consult")]);
  if (!profile) return NextResponse.json({ error: "먼저 사주 정보를 입력하세요." }, { status: 400 });

  // 베이스별 컨텍스트 블록 구성
  const nowVars = getNowVars();
  const birthYear = Number(profile.birthDate.split("-")[0]) || 0;
  let contextBlock: string;
  if (basis === "tci") {
    const tci = await getTci(userId);
    if (!tci) return NextResponse.json({ error: "기질 검사를 먼저 완료하세요." }, { status: 400 });
    contextBlock = formatScoresForPrompt(await scoreTciByVariant(tci.variant, tci.answers));
  } else if (basis === "saju") {
    const saju = calculateSaju(profile);
    const balance = computeBalanceWithDayun(saju, Number(nowVars.currentYear), birthYear);
    contextBlock = [
      "[사주]",
      formatSajuForPrompt(saju),
      "",
      "[사주 음양·한열 좌표]",
      formatBalanceForPrompt(balance),
    ].join("\n");
  } else if (basis === "fusion") {
    const tci = await getTci(userId);
    if (!tci) return NextResponse.json({ error: "기질 검사를 먼저 완료하세요." }, { status: 400 });
    const saju = calculateSaju(profile);
    const balance = computeBalanceWithDayun(saju, Number(nowVars.currentYear), birthYear);
    contextBlock = [
      "[사주]",
      formatSajuForPrompt(saju),
      "",
      "[사주 음양·한열 좌표]",
      formatBalanceForPrompt(balance),
      "",
      "[기질 7차원 점수]",
      formatScoresForPrompt(await scoreTciByVariant(tci.variant, tci.answers)),
    ].join("\n");
  } else {
    // family
    const family = await getFamily(userId);
    if (family.members.length === 0) {
      return NextResponse.json({ error: "가족 구성원을 1명 이상 추가하세요." }, { status: 400 });
    }
    const self = calculateSaju(profile);
    const members = family.members.map((m) => ({ m, saju: calculateSaju(m.profile) }));
    contextBlock = familyBlock(self, members);
  }

  const rendered = renderTemplate(prompt.template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || "(시각 모름)",
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    basisLabel: BASIS_LABEL[basis],
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
      basis,
      basisLabel: BASIS_LABEL[basis],
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
