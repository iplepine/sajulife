// 실제 가족(data/guests/g_2314ce25) 기준 family-saju 프롬프트 렌더 — AI 호출 0.
// 하네스 루프용: defaults.ts의 family-saju 템플릿을 실제 가족 데이터로 렌더해 파일로 떨군다.
// 사용: tsx scripts/eval/render-real-family.ts <출력경로.txt>
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { calculateCurrentAge, getNowVars } from "../../lib/datetime";
import { DEFAULT_PROMPTS } from "../../lib/prompts/defaults";
import { renderTemplate } from "../../lib/prompts/render";
import { familyMemberContextForPrompt } from "../../lib/profile/context";
import { calculateSaju, type SajuResult } from "../../lib/saju/calculator";
import { formatDayunForPrompt, formatSajuForPrompt } from "../../lib/saju/format";
import type { FamilyMember, FamilyStore, SajuProfile } from "../../lib/store/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUEST = join(__dirname, "..", "..", "data", "guests", "g_2314ce25");

// app/api/family/report/route.ts의 formatMemberBlock과 동일.
function formatMemberBlock(m: FamilyMember, saju: SajuResult, today: string): string {
  const g = m.profile.gender === "male" ? "남성" : "여성";
  const c = m.profile.calendar === "lunar" ? "음력" : "양력";
  const t = m.profile.birthTime || "시각 모름";
  const currentAge = calculateCurrentAge(m.profile.birthDate, today);
  return [
    `■ ${m.relation} · ${m.profile.name} (${g}, ${m.profile.birthDate} ${t} ${c})`,
    `  ${familyMemberContextForPrompt(m.profile)}`,
    `  현재 만 나이: ${currentAge}세`,
    `  일간: ${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
    `  띠: ${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
    formatSajuForPrompt(saju).split("\n").map((l) => `  ${l}`).join("\n"),
    `  대운 흐름:\n${formatDayunForPrompt(saju, currentAge).split("\n").map((l) => `    ${l}`).join("\n")}`,
  ].join("\n");
}

function main() {
  const outPath = process.argv[2];
  if (!outPath) {
    console.error("사용: tsx scripts/eval/render-real-family.ts <출력경로.txt>");
    process.exit(1);
  }
  const profile: SajuProfile = JSON.parse(readFileSync(join(GUEST, "profile.json"), "utf8"));
  const family: FamilyStore = JSON.parse(readFileSync(join(GUEST, "family.json"), "utf8"));

  const nowVars = getNowVars();
  const selfSaju = calculateSaju(profile);
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);
  const familyTable = family.members
    .map((m) => formatMemberBlock(m, calculateSaju(m.profile), nowVars.today))
    .join("\n\n");

  const rendered = renderTemplate(DEFAULT_PROMPTS["family-saju"].template, {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || "시각 모름",
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    profileContext: familyMemberContextForPrompt(profile),
    sajuTable: formatSajuForPrompt(selfSaju),
    dayMaster: `${selfSaju.dayMaster.ko}(${selfSaju.dayMaster.hanja}) · ${selfSaju.dayMaster.wuxing} · ${selfSaju.dayMaster.yinyang}`,
    currentAge: String(currentAge),
    selfDayunTable: formatDayunForPrompt(selfSaju, currentAge),
    familyTable,
    ...nowVars,
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, rendered);
  console.log(`렌더 완료: ${rendered.length}자 → ${outPath}`);
  console.log(`가족: ${profile.name}(${currentAge}세) + ${family.members.map((m) => `${m.relation} ${m.profile.name}`).join(", ")}`);
  console.log(`기준일: ${nowVars.today} / 프롬프트 v${DEFAULT_PROMPTS["family-saju"].version}`);
}

main();
