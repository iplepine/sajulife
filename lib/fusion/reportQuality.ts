import type { SuggestedAction } from "@/lib/store/types";
import { ACTION_TIMEFRAMES, FUSION_ACTION_CATEGORIES } from "@/lib/report/actions";

// 2026-10-08 대표 결정 — 사주+기질 = '올해 운세'. 원래의 너 → 요즘의 너 → 올해 → 내년 준비 순서(프롬프트 v30과 동기화).
export const FUSION_SECTION_TITLES = [
  "▣ 먼저 결론: 올해 너는 이런 한 해야",
  "▣ 원래의 너: 사주로 타고난 결",
  "▣ 요즘의 너: 기질 검사로 본 지금 상태",
  "▣ 원래의 너와 요즘의 너: 겹치는 곳과 어긋나는 곳",
  "▣ 올해 흐름: 올해가 지금의 너한테 가져오는 것",
  "▣ 올해 남은 달: 밀 때와 쉴 때",
  "▣ 내년 미리보기: 이렇게 바뀔 수 있으니 이걸 준비해",
  "▣ 올해 남은 기간, 이렇게 써: 세 가지 실행",
] as const;

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
  [/(?:자극추구|위험회피|보상의존|인내력|자율성|연대감|자기초월)/, "옛 임상용어 노출"],
  [/(?:갑목|을목|병화|정화|무토|기토|경금|신금|임수|계수|자수|축토|인목|묘목|진토|사화|오화|미토|유금|술토|해수)/, "천간지지식 용어 노출"],
  [/\b(?:FLEX|ACTIONS)\s*=/, "본문 내 시스템 트레일러 노출"],
  // 올해 운세 재료에 판정어가 섞여 들어가므로, 가장 전문적인 두 단어는 리페어 대상으로 막는다.
  [/(?:용신|기신)/, "명리 판정어(용신·기신) 노출"],
];

/** 생활어로 바꾸는 게 맞지만 한 번 나왔다고 유료 풀이를 실패시키지는 않을 말 — 경고만 남긴다. */
const WARN_BODY_PATTERNS: Array<[RegExp, string]> = [
  [/(?:대운|세운|월지|삼형|상형|자형)/, "명리 용어 노출(생활어 권장)"],
];

export const MIN_BODY_CHARS_NO_SPACE = 7500;
export const MAX_BODY_CHARS_NO_SPACE = 9500;

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

function sectionTitles(report: string): string[] {
  return (report.match(/^▣ .+$/gm) ?? []).map((title) => title.trim());
}

function sameSet(actual: Array<string | undefined>, expected: readonly string[]): boolean {
  const actualSet = new Set(actual.filter((v): v is string => Boolean(v)));
  return actualSet.size === expected.length && expected.every((value) => actualSet.has(value));
}

export function validateFusionReportQuality(input: {
  report: string;
  actions: SuggestedAction[];
  flexibility?: number;
}): FusionReportQualityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const report = input.report.trim();

  const titles = sectionTitles(report);
  if (titles.length !== FUSION_SECTION_TITLES.length) {
    errors.push(`섹션 수 ${titles.length}개: ${FUSION_SECTION_TITLES.length}개 필요`);
  }
  FUSION_SECTION_TITLES.forEach((title, index) => {
    if (titles[index] !== title) {
      errors.push(`필수 섹션 순서/제목 오류 ${index + 1}: ${title}`);
    }
  });
  for (const title of titles) {
    if (!FUSION_SECTION_TITLES.includes(title as (typeof FUSION_SECTION_TITLES)[number])) {
      errors.push(`허용되지 않은 섹션 제목: ${title}`);
    }
  }
  for (const section of FORBIDDEN_TOP_SECTIONS) {
    if (new RegExp(`^▣\\s*${section}(?:\\s|:|$)`, "m").test(report)) {
      errors.push(`단독 리포트식 섹션명 노출: ${section}`);
    }
  }

  const bodyLen = compactLength(report);
  if (bodyLen < MIN_BODY_CHARS_NO_SPACE) {
    errors.push(`본문 길이 부족: 공백 제외 ${bodyLen}자`);
  } else if (bodyLen > MAX_BODY_CHARS_NO_SPACE) {
    errors.push(`본문 길이 초과: 공백 제외 ${bodyLen}자`);
  }

  for (const [pattern, label] of FORBIDDEN_BODY_PATTERNS) {
    if (pattern.test(report)) errors.push(label);
  }
  for (const [pattern, label] of WARN_BODY_PATTERNS) {
    if (pattern.test(report)) warnings.push(label);
  }

  if (typeof input.flexibility !== "number") {
    errors.push("FLEX 점수 누락");
  } else if (!Number.isInteger(input.flexibility) || input.flexibility < 0 || input.flexibility > 100) {
    errors.push(`FLEX 점수 범위 오류: ${input.flexibility}`);
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
