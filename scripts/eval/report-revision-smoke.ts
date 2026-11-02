// Offline contract/prompt smoke only. No env loading, provider calls, DB writes or old artifact deletion.
import { mkdirSync, writeFileSync } from "node:fs";
import { DEFAULT_PROMPTS } from "../../lib/prompts/defaults";
import { renderTemplate } from "../../lib/prompts/render";
import { calculateSaju } from "../../lib/saju/calculator";
import { calculateCurrentAge } from "../../lib/datetime";
import { computeBalanceWithDayun, formatBalanceForPrompt } from "../../lib/saju/balance";
import { buildYongsinView, formatYongsinBasisForPrompt } from "../../lib/saju/yongsinView";
import { ageBandPriority, formatCurrentDayunSpiritForPrompt, formatDayPillar, formatDayunForPrompt, formatMonthSeasonForPrompt, formatOhengForPrompt, formatSajuForPrompt, formatStemForPrompt, formatTenSpiritsForPrompt } from "../../lib/saju/format";
import { formatFusionBalanceForPrompt, formatFusionDayMasterForPrompt, formatFusionDayunForPrompt, formatFusionSajuForPrompt, formatFusionScoresForPrompt, formatFusionZodiacForPrompt } from "../../lib/fusion/promptFormat";
import { formatYearFortuneForPrompt, formatYearTrioForPrompt } from "../../lib/fusion/yearFortune";
import { NO_PERSONAL_READING_BASIS } from "../../lib/fusion/personalBasis";
import { profileContextForPrompt } from "../../lib/profile/context";
import { scoreTciByVariant } from "../../lib/tci/scoring";
import { PERSONAS, synthesizeAnswers } from "./personas";

const out = "output/report-revision-2026-11-03/prompts";
mkdirSync(out, { recursive: true });
const now = { today: "2026-11-03", currentYear: "2026", currentMonth: "2026-11", previousYear: "2025", nextYear: "2027" };

async function main() {
  const results = [];
  for (const person of PERSONAS) {
    const profile = person.profile;
    const saju = calculateSaju(profile);
    const age = calculateCurrentAge(profile.birthDate, now.today);
    const balance = computeBalanceWithDayun(saju, age);
    const scores = await scoreTciByVariant("short", await synthesizeAnswers(person.tciTarget, "short"));
    const common = { ...now, name: profile.name, birthDate: profile.birthDate, birthTime: profile.birthTime || "(시각 모름)", gender: profile.gender === "male" ? "남성" : "여성", calendar: profile.calendar === "lunar" ? "음력" : "양력", profileContext: profileContextForPrompt(profile), currentAge: String(age) };
    const personal = { ...common, sajuTable: formatSajuForPrompt(saju), dayPillar: formatDayPillar(saju), dayMaster: `${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing}`, stemMetaphor: formatStemForPrompt(saju), monthSeasonPhrase: formatMonthSeasonForPrompt(saju), ohengMap: formatOhengForPrompt(saju), tenSpiritMap: formatTenSpiritsForPrompt(saju), currentDayunSpirit: formatCurrentDayunSpiritForPrompt(saju, age), sajuBalance: formatBalanceForPrompt(balance), yongsin: formatYongsinBasisForPrompt(buildYongsinView(saju, age, 2026)), dayunTable: formatDayunForPrompt(saju, age), yearTrioBasis: formatYearTrioForPrompt(saju, age, 2026), agePriority: ageBandPriority(age) };
    const fusion = { ...common, sajuTable: formatFusionSajuForPrompt(saju), dayMaster: formatFusionDayMasterForPrompt(saju), shengXiao: formatFusionZodiacForPrompt(saju), sajuBalance: formatFusionBalanceForPrompt(balance), dayunTable: formatFusionDayunForPrompt(saju, age), tciScores: formatFusionScoresForPrompt(scores), personalReadingBasis: NO_PERSONAL_READING_BASIS, yearFortune: formatYearFortuneForPrompt(saju, age, 2026, 11) };
    for (const [key, vars] of [["personal-saju", personal], ["tci-saju-fusion", fusion]] as const) {
      const config = DEFAULT_PROMPTS[key];
      const missing = [...config.template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).filter(k => !(k in vars));
      if (missing.length) throw new Error(`${person.id}/${key}: missing ${missing.join(",")}`);
      const text = renderTemplate(config.template, vars);
      if (/\{\{\w+\}\}/.test(text)) throw new Error("Unrendered variable");
      writeFileSync(`${out}/${person.id}-${key}.txt`, text);
      results.push({ persona: person.id, key, version: config.version, varsComplete: true });
    }
  }
  writeFileSync(`${out}/smoke.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ cases: results.length, generationCalls: 0, output: out, status: "pass" }));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
