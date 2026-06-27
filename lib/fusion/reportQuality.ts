import type { SuggestedAction } from "@/lib/store/types";
import { ACTION_TIMEFRAMES, FUSION_ACTION_CATEGORIES } from "@/lib/report/actions";

export const FUSION_SECTION_TITLES = [
  "▣ 먼저 결론: 네 반복 패턴 한눈에 보기",
  "▣ 잘 풀릴 때: 네 리듬이 탄력받는 순간",
  "▣ 꼬일 때: 평소 반응이 엇나가는 순간",
  "▣ 자꾸 반복되는 장면: 일·돈·관계에서 같은 패턴이 도는 이유",
  "▣ 갈림길 사용법: 밀어붙일 때와 멈춰야 할 때",
  "▣ 앞으로 6~12개월: 기회와 삐끗할 지점 미리보기",
  "▣ 오늘부터 바꿀 세 가지",
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
];

const MIN_BODY_CHARS_NO_SPACE = 5800;
const MAX_BODY_CHARS_NO_SPACE = 7600;

export type FusionReportQualityResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

function compactLength(text: string): number {
  return text.replace(/\s/g, "").length;
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

  const repeatedConceptTerms = ["출발값", "현재 작동 방식", "작동 원리"];
  for (const term of repeatedConceptTerms) {
    const count = (report.match(new RegExp(term, "g")) ?? []).length;
    if (count > 4) errors.push(`기획어 반복 과다: ${term} ${count}회`);
    else if (count > 2) warnings.push(`기획어 반복 주의: ${term} ${count}회`);
  }

  return { ok: errors.length === 0, errors, warnings };
}
