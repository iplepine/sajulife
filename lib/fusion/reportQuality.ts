import type { SuggestedAction } from "@/lib/store/types";
import { ACTION_TIMEFRAMES, FUSION_ACTION_CATEGORIES } from "@/lib/report/actions";
import { FUSION_FORCE_NAMES, FUSION_SECTION_TITLES, LEGACY_FUSION_SECTION_TITLES } from "./reportContract";
import { findRepeatedParagraphs } from "../report/contentChecks";
export { FUSION_SECTION_TITLES, LEGACY_FUSION_SECTION_TITLES, isFinalFusionReport } from "./reportContract";

const FORBIDDEN_TOP_SECTIONS = [
  "기질구성",
  "기본성향",
  "직업운",
  "금전운",
  "인간관계운",
  "스트레스관리",
  "대운",
  "올해 실행전략",
] as const;

const FORBIDDEN_BODY_PATTERNS: Array<[RegExp, string]> = [
  [/[\u3400-\u4dbf\u4e00-\u9fff]/, "한자 노출"],
  [/\b(?:NS|HA|RD|PS|SD|CO|ST)(?:\d+)?\b/, "TCI 내부 코드 노출"],
  [/(?:갑목|을목|병화|정화|무토|기토|경금|신금|임수|계수|자수|축토|인목|묘목|진토|사화|오화|미토|유금|술토|해수)/, "천간지지식 용어 노출"],
  [/\b(?:FLEX|ACTIONS)\s*=/, "본문 내 시스템 트레일러 노출"],
  // 올해 운세 재료에 판정어가 섞여 들어가므로, 가장 전문적인 두 단어는 리페어 대상으로 막는다.
  [/(?:용신|기신)/, "명리 판정어(용신·기신) 노출"],
];

/** 생활어로 바꾸는 게 맞지만 한 번 나왔다고 유료 풀이를 실패시키지는 않을 말 — 경고만 남긴다. */
const WARN_BODY_PATTERNS: Array<[RegExp, string]> = [
  [/(?:대운|세운|월지|삼형|상형|자형)/, "명리 용어 노출(생활어 권장)"],
];

// 분량을 부풀리게 만드는 목표 하한이 아니라, 빈/잘린 결과를 막는 위생 기준이다.
export const MIN_BODY_CHARS_NO_SPACE = 1800;
export const MAX_BODY_CHARS_NO_SPACE = 12000;

/** 문단(빈 줄로 안 끊긴 덩어리) 안에 이 표시 중 하나도 없으면 구조화 안 된 것으로 본다. */
const STRUCTURE_MARKERS = /[─•▸◆]|[①②③④⑤⑥⑦⑧⑨]/;
const WALL_OF_TEXT_MIN_CHARS = 300;

export type FusionReportQualityResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function compactLength(text: string): number {
  return text.replace(/\s/g, "").length;
}

/** 소제목·불릿 없이 300자 넘게 안 끊긴 "벽돌 문단" 개수 — 가독성 위생 경고용. */
function wallOfTextParagraphCount(report: string): number {
  const blocks = report.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.filter((block) => {
    if (block.startsWith("▣")) return false; // 섹션 제목 줄 자체는 제외
    if (/^(?:FLEX|ACTIONS)\s*=/.test(block)) return false; // 화면에서 떼어내는 트레일러는 제외
    return compactLength(block) > WALL_OF_TEXT_MIN_CHARS && !STRUCTURE_MARKERS.test(block);
  }).length;
}

function hasStructuredAction(action: SuggestedAction): boolean {
  return Boolean(
    action.category?.trim() &&
      action.trigger?.trim() &&
      action.exactAction?.trim() &&
      action.timeLimit?.trim() &&
      action.doneCriteria?.trim() &&
      action.artifact?.trim() &&
      action.blockedLoop?.trim(),
  );
}

function sameSet(actual: Array<string | undefined>, expected: readonly string[]): boolean {
  const actualSet = new Set(actual.filter((v): v is string => Boolean(v)));
  return actualSet.size === expected.length && expected.every((value) => actualSet.has(value));
}

export function validateFusionReportQuality(input: {
  report: string;
  actions: SuggestedAction[];
  flexibility?: number;
  /** 이미 저장된 v30 형식을 검사할 때만 명시한다. 신규 생성은 기본값(final). */
  format?: "final" | "legacy";
}): FusionReportQualityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const report = input.report.trim();
  const legacy = input.format === "legacy";
  const expectedTitles: readonly string[] = legacy ? LEGACY_FUSION_SECTION_TITLES : FUSION_SECTION_TITLES;

  const headings = [...report.matchAll(/^[ \t]*▣[ \t]+[^\r\n]+/gm)];
  const sections = headings.map((heading, index) => ({
    title: heading[0].trim(),
    body: report.slice(heading.index + heading[0].length, headings[index + 1]?.index).trim(),
  }));
  const titles = sections.map(section => section.title);
  if (titles.length !== expectedTitles.length) {
    errors.push(`섹션 수 ${titles.length}개: ${expectedTitles.length}개 필요`);
  }
  expectedTitles.forEach((title, index) => {
    if (titles[index] !== title) {
      errors.push(`필수 섹션 순서/제목 오류 ${index + 1}: ${title}`);
    }
  });
  for (const title of titles) {
    if (!expectedTitles.includes(title)) {
      errors.push(`허용되지 않은 섹션 제목: ${title}`);
    }
  }
  for (const section of FORBIDDEN_TOP_SECTIONS) {
    if (new RegExp(`^▣\\s*${section}(?:\\s|:|$)`, "m").test(report)) {
      errors.push(`단독 리포트식 섹션명 노출: ${section}`);
    }
  }

  const bodyLen = compactLength(report);
  if (bodyLen < (legacy ? 7500 : MIN_BODY_CHARS_NO_SPACE)) {
    errors.push(`본문 길이 부족: 공백 제외 ${bodyLen}자`);
  } else if (bodyLen > (legacy ? 9500 : MAX_BODY_CHARS_NO_SPACE)) {
    errors.push(`본문 길이 초과: 공백 제외 ${bodyLen}자`);
  }

  for (const [pattern, label] of FORBIDDEN_BODY_PATTERNS) {
    if (pattern.test(report)) errors.push(label);
  }
  for (const [pattern, label] of WARN_BODY_PATTERNS) {
    if (pattern.test(report)) warnings.push(label);
  }

  if (legacy && typeof input.flexibility !== "number") {
    errors.push("이전 형식 FLEX 점수 누락");
  } else if (typeof input.flexibility === "number" && (!Number.isInteger(input.flexibility) || input.flexibility < 0 || input.flexibility > 100)) {
    errors.push(`FLEX 점수 범위 오류: ${input.flexibility}`);
  }
  if (!legacy && typeof input.flexibility === "number") {
    errors.push("신규 최종 리포트에는 미측정 FLEX 점수를 출력할 수 없음");
  }
  if (!legacy) {
    for (const { title, body } of sections) {
      if (!body.split("\n").some(line => /[\p{L}\p{N}]/u.test(line) && !/^\s*[─◆]/.test(line))) {
        errors.push(`섹션 본문 누락: ${title}`);
      }
    }
    const forceSection = sections.find(section => section.title === FUSION_SECTION_TITLES[1]);
    if (forceSection) {
      const forces = [...forceSection.body.matchAll(/^[ \t]*─[ \t]+([^\r\n]+)/gm)];
      for (const [index, name] of FUSION_FORCE_NAMES.entries()) {
        const heading = forces[index];
        if (!heading || heading[1].trim() !== name) {
          errors.push(`다섯 가지 힘 소제목 순서/이름 오류: ─ ${name}`);
        } else if (!/[\p{L}\p{N}]/u.test(forceSection.body.slice(heading.index + heading[0].length, forces[index + 1]?.index))) {
          errors.push(`다섯 가지 힘 설명 누락: ${name}`);
        }
      }
      if (forces.length > FUSION_FORCE_NAMES.length) errors.push("다섯 가지 힘 소제목 중복 또는 추가");
    }
    for (const duplicate of findRepeatedParagraphs(sections)) {
      errors.push(`같은 본문 문단 반복: ${duplicate}`);
    }
    const guaranteedOutcome = /(?:무조건|반드시|확실히)[^.!?\n]{0,35}(?:수익|매출|수입)[^.!?\n]{0,15}(?:두\s*배|늘어|증가|오르|벌게)|(?:수익|매출|수입)[^.!?\n]{0,15}(?:무조건|반드시|확실히)[^.!?\n]{0,20}(?:두\s*배|늘어|증가|오르|벌게)/;
    const negatedGuarantee = /(?:아니|않|없|보장하지|보증하지|단정하지|뜻은 아니)/;
    // 정규식은 일부 명백한 확정 표현만 잡는다. 의미 검증 전체를 대신하지 않으며
    // "무조건 수익이 늘어난다는 뜻은 아니야" 같은 부정문은 차단하지 않는다.
    if (report.split(/[.!?\n]/).some(sentence => guaranteedOutcome.test(sentence) && !negatedGuarantee.test(sentence))) {
      errors.push("미래 금전 성과 확정 표현");
    }
    if (/(?:유연성|큰 나무|타는 불|너른 흙|흐르는 물|단단한 쇠)\s*(?:점수)?\s*(?:는|은|이|가|:)?\s*\d+\s*(?:점|%)/.test(report)) {
      errors.push("미측정 유연성 또는 다섯 융합 축 점수 노출");
    }
  }

  if (input.actions.length !== 3) {
    errors.push(`ACTIONS 개수 ${input.actions.length}개: 3개 필요`);
  }
  if (input.actions.some((action) => !hasStructuredAction(action))) {
    errors.push("ACTIONS 구조 필드 누락");
  }
  if (!sameSet(input.actions.map((action) => action.category), FUSION_ACTION_CATEGORIES)) {
    errors.push("ACTIONS category 3종 조합 오류");
  }
  if (!sameSet(input.actions.map((action) => action.timeframe), ACTION_TIMEFRAMES)) {
    errors.push("ACTIONS timeframe 오늘/이번 주/이번 달 조합 오류");
  }

  const repeatedConceptTerms = ["원래의 너", "요즘의 너", "세 겹"];
  for (const term of repeatedConceptTerms) {
    const count = (report.match(new RegExp(term, "g")) ?? []).length;
    if (count > 4) errors.push(`기획어 반복 과다: ${term} ${count}회`);
    else if (count > 2) warnings.push(`기획어 반복 주의: ${term} ${count}회`);
  }

  const wallCount = wallOfTextParagraphCount(report);
  if (wallCount > 0) {
    warnings.push(`벽돌 문단: 소제목·불릿 없이 300자 넘게 이어진 문단 ${wallCount}개`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
