import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FUSION_SECTION_TITLES } from "../../lib/fusion/reportQuality";

const OUT = join(process.cwd(), "scripts", "eval", "out", "prompts");

const DYNAMIC_FORBIDDEN: Array<[RegExp, string]> = [
  [/[\u3400-\u4dbf\u4e00-\u9fff]/, "동적 입력에 한자 노출"],
  [/\b(?:NS|HA|RD|PS|SD|CO|ST)(?:\d+)?\b/, "동적 입력에 TCI 내부 코드 노출"],
  [/(?:甲|乙|丙|丁|戊|己|庚|辛|壬|癸|子|丑|寅|卯|辰|巳|午|未|申|酉|戌|亥)/, "동적 입력에 천간지지 문자 노출"],
];

const PROMPT_FORBIDDEN: Array<[RegExp, string]> = [
  [/^▣\s*(?:기질구성|기본성향|직업운|금전운|인간관계운|스트레스관리|대운|올해 실행전략)/m, "옛 융합 섹션명 노출"],
  [/대지을|거목를|강철를|흙과 논를/, "조사 오류 의심"],
  [/지유이|영호이|정호이/, "이름 조사 오류 의심"],
  [/^\s*9\.\s+\d+세/m, "평생 9구간 대운 전체 나열"],
];

const ACTION_KEYS = [
  "category",
  "trigger",
  "exactAction",
  "timeLimit",
  "doneCriteria",
  "artifact",
  "blockedLoop",
] as const;

function sectionTitles(text: string): string[] {
  return (text.match(/^▣ .+$/gm) ?? []).map((title) => title.trim());
}

function dynamicBlock(text: string): string {
  const start = Math.max(text.indexOf("[출발값 자료"), text.indexOf("[타고난 결 자료"));
  const end = text.indexOf("[작성 규칙");
  if (start < 0 || end < 0 || end <= start) return text;
  return text.slice(start, end);
}

function checkFile(file: string): string[] {
  const text = readFileSync(join(OUT, file), "utf8");
  const errors: string[] = [];

  if (text.includes("{{")) errors.push("미치환 템플릿 변수 존재");
  const titles = sectionTitles(text);
  if (titles.length !== FUSION_SECTION_TITLES.length) {
    errors.push(`출력 섹션 지시 ${titles.length}개: ${FUSION_SECTION_TITLES.length}개 필요`);
  }
  FUSION_SECTION_TITLES.forEach((title, index) => {
    if (titles[index] !== title) errors.push(`섹션 순서/제목 오류 ${index + 1}: ${title}`);
  });
  for (const [pattern, label] of PROMPT_FORBIDDEN) {
    if (pattern.test(text)) errors.push(label);
  }

  const dyn = dynamicBlock(text);
  for (const [pattern, label] of DYNAMIC_FORBIDDEN) {
    if (pattern.test(dyn)) errors.push(label);
  }
  for (const key of ACTION_KEYS) {
    if (!text.includes(`"${key}"`)) errors.push(`ACTIONS 필드 누락: ${key}`);
  }

  return errors;
}

function main() {
  const files = readdirSync(OUT).filter((file) => file.endsWith("-fusion.txt")).sort();
  if (files.length === 0) {
    console.error("fusion 프롬프트가 없습니다. 먼저 npm run eval:render -- fusion 을 실행하세요.");
    process.exit(1);
  }

  let failureCount = 0;
  for (const file of files) {
    const errors = checkFile(file);
    if (errors.length > 0) {
      failureCount += errors.length;
      console.error(`\n${file}`);
      for (const error of errors) console.error(`  - ${error}`);
    }
  }

  if (failureCount > 0) {
    console.error(`\n융합 프롬프트 정적 게이트 실패: ${failureCount}개`);
    process.exit(1);
  }
  console.log(`융합 프롬프트 정적 게이트 통과: ${files.length}개`);
}

main();
