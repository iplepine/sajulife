import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { getUserIdOrNull } from "@/lib/auth";
import { getNowVars } from "@/lib/datetime";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { formatSajuForPrompt } from "@/lib/saju/format";
import { getFamily, getProfile, getTci } from "@/lib/store/guest";
import type { ConsultBasis, FamilyMember } from "@/lib/store/types";
import { formatScoresForPrompt, scoreTci } from "@/lib/tci/scoring";

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
  let contextBlock: string;
  if (basis === "tci") {
    const tci = await getTci(userId);
    if (!tci) return NextResponse.json({ error: "기질 검사를 먼저 완료하세요." }, { status: 400 });
    contextBlock = formatScoresForPrompt(scoreTci(tci.answers));
  } else if (basis === "saju") {
    contextBlock = formatSajuForPrompt(calculateSaju(profile));
  } else if (basis === "fusion") {
    const tci = await getTci(userId);
    if (!tci) return NextResponse.json({ error: "기질 검사를 먼저 완료하세요." }, { status: 400 });
    const saju = calculateSaju(profile);
    contextBlock = [
      "[사주]",
      formatSajuForPrompt(saju),
      "",
      "[기질 7차원 점수]",
      formatScoresForPrompt(scoreTci(tci.answers)),
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
    ...getNowVars(),
  });

  try {
    const ai = getAIProvider();
    const answer = await ai.generate(rendered, { temperature: prompt.temperature });
    return NextResponse.json({
      answer,
      basis,
      basisLabel: BASIS_LABEL[basis],
      debug: { prompt: rendered, model: ai.model, provider: ai.name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI 호출 실패: ${message}` }, { status: 502 });
  }
}
