// 프롬프트 렌더 CLI — AI(Gemini) 호출 0, 비용 0.
//
// lib/prompts/defaults.ts(코드 기준, KV 우회)의 프롬프트 템플릿을
// 페르소나 데이터로 렌더해 scripts/eval/out/prompts/ 아래에 떨군다.
// 그 다음 단계(리포트 생성)는 Claude가 직접 수행한다 — README 참고.
//
// 사용:
//   npm run eval:render               # 전체 페르소나 × {saju,tci,fusion}
//   npm run eval:render -- saju       # saju만 전체 페르소나
//   npm run eval:render -- tci p1-jiyu  # 특정 종류·페르소나
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { calculateCurrentAge, getNowVars } from "../../lib/datetime";
import { DEFAULT_PROMPTS } from "../../lib/prompts/defaults";
import { renderTemplate } from "../../lib/prompts/render";
import {
  childrenStatusLabel,
  currentConcernLabel,
  familyMemberContextForPrompt,
  occupationLabel,
  profileContextForPrompt,
  relationshipStatusLabel,
} from "../../lib/profile/context";
import { computeBalanceWithDayun, formatBalanceForPrompt } from "../../lib/saju/balance";
import { calculateSaju, type SajuResult } from "../../lib/saju/calculator";
import {
  formatCurrentDayunSpiritForPrompt,
  formatDayPillar,
  formatDayunForPrompt,
  formatMonthSeasonForPrompt,
  formatOhengForPrompt,
  formatSajuForPrompt,
  formatStemForPrompt,
  formatTenSpiritsForPrompt,
} from "../../lib/saju/format";
import { formatScoresForPrompt, scoreTciByVariant } from "../../lib/tci/scoring";
import type { FamilyMember } from "../../lib/store/types";
import { PERSONAS, synthesizeAnswers, type Persona } from "./personas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "out", "prompts");

type Kind = "saju" | "tci" | "fusion" | "family" | "consult";
const ALL_KINDS: Kind[] = ["saju", "tci", "fusion", "family", "consult"];

// app/api/family/report/route.ts의 formatMemberBlock과 동일 — 가족 구성원 사주 블록.
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

function sajuVars(p: Persona, nowVars: ReturnType<typeof getNowVars>) {
  const saju = calculateSaju(p.profile);
  const currentAge = calculateCurrentAge(p.profile.birthDate, nowVars.today);
  const balance = computeBalanceWithDayun(saju, currentAge);
  return {
    saju,
    currentAge,
    vars: {
      name: p.profile.name,
      birthDate: p.profile.birthDate,
      birthTime: p.profile.birthTime || "(시각 모름)",
      gender: p.profile.gender === "male" ? "남성" : "여성",
      calendar: p.profile.calendar === "lunar" ? "음력" : "양력",
      occupation: occupationLabel(p.profile),
      relationshipStatus: relationshipStatusLabel(p.profile.relationshipStatus),
      childrenStatus: childrenStatusLabel(p.profile.childrenStatus),
      currentConcern: currentConcernLabel(p.profile),
      profileContext: profileContextForPrompt(p.profile),
      note: currentConcernLabel(p.profile),
      currentAge: String(currentAge),
      sajuTable: formatSajuForPrompt(saju),
      dayMaster: `${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
      shengXiao: `${saju.shengXiao.ko}(${saju.shengXiao.hanja})`,
      dayPillar: formatDayPillar(saju),
      sajuBalance: formatBalanceForPrompt(balance),
      stemMetaphor: formatStemForPrompt(saju),
      monthSeasonPhrase: formatMonthSeasonForPrompt(saju),
      ohengMap: formatOhengForPrompt(saju),
      dayunTable: formatDayunForPrompt(saju, currentAge),
      tenSpiritMap: formatTenSpiritsForPrompt(saju),
      currentDayunSpirit: formatCurrentDayunSpiritForPrompt(saju, currentAge),
    },
  };
}

async function tciScoresFor(p: Persona) {
  const answers = await synthesizeAnswers(p.tciTarget);
  return scoreTciByVariant("short", answers);
}

async function renderOne(p: Persona, kind: Kind, nowVars: ReturnType<typeof getNowVars>): Promise<string> {
  if (kind === "saju") {
    const { vars } = sajuVars(p, nowVars);
    return renderTemplate(DEFAULT_PROMPTS["personal-saju"].template, { ...vars, ...nowVars });
  }
  if (kind === "tci") {
    const scores = await tciScoresFor(p);
    return renderTemplate(DEFAULT_PROMPTS["tci-report"].template, {
      name: p.profile.name,
      birthDate: p.profile.birthDate,
      birthTime: p.profile.birthTime || "(시각 모름)",
      gender: p.profile.gender === "male" ? "남성" : "여성",
      calendar: p.profile.calendar === "lunar" ? "음력" : "양력",
      occupation: occupationLabel(p.profile),
      relationshipStatus: relationshipStatusLabel(p.profile.relationshipStatus),
      childrenStatus: childrenStatusLabel(p.profile.childrenStatus),
      currentConcern: currentConcernLabel(p.profile),
      profileContext: profileContextForPrompt(p.profile),
      tciScores: formatScoresForPrompt(scores),
      ...nowVars,
    });
  }
  if (kind === "family") {
    if (!p.family || p.family.length === 0) return ""; // 가족 없으면 빈 문자열 (호출부에서 스킵)
    const { currentAge, saju, vars } = sajuVars(p, nowVars);
    const familyTable = p.family
      .map((m) => formatMemberBlock(m, calculateSaju(m.profile), nowVars.today))
      .join("\n\n");
    return renderTemplate(DEFAULT_PROMPTS["family-saju"].template, {
      name: p.profile.name,
      birthDate: p.profile.birthDate,
      birthTime: p.profile.birthTime || "(시각 모름)",
      gender: p.profile.gender === "male" ? "남성" : "여성",
      calendar: p.profile.calendar === "lunar" ? "음력" : "양력",
      profileContext: familyMemberContextForPrompt(p.profile),
      sajuTable: vars.sajuTable,
      dayMaster: vars.dayMaster,
      currentAge: String(currentAge),
      selfDayunTable: formatDayunForPrompt(saju, currentAge),
      familyTable,
      ...nowVars,
    });
  }
  if (kind === "consult") {
    if (!p.consultQuestion) return ""; // 질문 없으면 스킵
    // app/api/consult/route.ts의 saju basis contextBlock과 동일 구성 (한자 노출 위험 최대 케이스)
    const { saju, vars } = sajuVars(p, nowVars);
    const balance = formatBalanceForPrompt(computeBalanceWithDayun(saju, calculateCurrentAge(p.profile.birthDate, nowVars.today)));
    const contextBlock = ["[사용자 맥락]", profileContextForPrompt(p.profile), "", "[사주]", vars.sajuTable, "", "[사주 음양·한열 좌표]", balance].join("\n");
    return renderTemplate(DEFAULT_PROMPTS["consult"].template, {
      name: p.profile.name,
      birthDate: p.profile.birthDate,
      birthTime: p.profile.birthTime || "(시각 모름)",
      gender: p.profile.gender === "male" ? "남성" : "여성",
      calendar: p.profile.calendar === "lunar" ? "음력" : "양력",
      profileContext: profileContextForPrompt(p.profile),
      basisLabel: "개인 사주",
      contextBlock,
      question: p.consultQuestion,
      ...nowVars,
    });
  }
  // fusion
  const { vars } = sajuVars(p, nowVars);
  const scores = await tciScoresFor(p);
  return renderTemplate(DEFAULT_PROMPTS["tci-saju-fusion"].template, {
    name: p.profile.name,
    birthDate: p.profile.birthDate,
    birthTime: p.profile.birthTime || "(시각 모름)",
    gender: p.profile.gender === "male" ? "남성" : "여성",
    calendar: p.profile.calendar === "lunar" ? "음력" : "양력",
    occupation: occupationLabel(p.profile),
    relationshipStatus: relationshipStatusLabel(p.profile.relationshipStatus),
    childrenStatus: childrenStatusLabel(p.profile.childrenStatus),
    currentConcern: currentConcernLabel(p.profile),
    profileContext: profileContextForPrompt(p.profile),
    sajuTable: vars.sajuTable,
    dayMaster: vars.dayMaster,
    shengXiao: vars.shengXiao,
    sajuBalance: vars.sajuBalance,
    currentAge: vars.currentAge,
    dayunTable: vars.dayunTable,
    tciScores: formatScoresForPrompt(scores),
    ...nowVars,
  });
}

async function main() {
  const args = process.argv.slice(2);
  const kinds = (args.filter((a) => ALL_KINDS.includes(a as Kind)) as Kind[]);
  const ids = args.filter((a) => PERSONAS.some((p) => p.id === a));
  const selKinds = kinds.length ? kinds : ALL_KINDS;
  const selPersonas = ids.length ? PERSONAS.filter((p) => ids.includes(p.id)) : PERSONAS;

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const nowVars = getNowVars();

  let count = 0;
  for (const p of selPersonas) {
    // 페르소나 메타(사주 요약 + TCI 채점)도 함께 떨궈 평가에 활용
    const { saju, currentAge } = sajuVars(p, nowVars);
    const scores = await tciScoresFor(p);
    const meta = {
      id: p.id,
      desc: p.desc,
      profile: p.profile,
      currentAge,
      saju: {
        pillars: {
          year: saju.pillars.year ? `${saju.pillars.year.gan.ko}${saju.pillars.year.zhi.ko}` : null,
          month: saju.pillars.month ? `${saju.pillars.month.gan.ko}${saju.pillars.month.zhi.ko}` : null,
          day: saju.pillars.day ? `${saju.pillars.day.gan.ko}${saju.pillars.day.zhi.ko}` : null,
          time: saju.pillars.time ? `${saju.pillars.time.gan.ko}${saju.pillars.time.zhi.ko}` : null,
        },
        dayMaster: saju.dayMaster.ko,
        shengXiao: saju.shengXiao.ko,
        wuxingCount: saju.wuxingCount,
        koreanTimeCorrection: saju.input.koreanTimeCorrection,
      },
      tciTarget: p.tciTarget,
      tciScored: Object.fromEntries(scores.map((s) => [s.dimension, s.percent])),
    };
    writeFileSync(join(OUT, `${p.id}-meta.json`), JSON.stringify(meta, null, 2));

    for (const kind of selKinds) {
      const text = await renderOne(p, kind, nowVars);
      if (!text) {
        console.log(`  ${p.id.padEnd(12)} ${kind.padEnd(7)} → 스킵 (가족 데이터 없음)`);
        continue;
      }
      const file = join(OUT, `${p.id}-${kind}.txt`);
      writeFileSync(file, text);
      count += 1;
      console.log(`  ${p.id.padEnd(12)} ${kind.padEnd(7)} → ${text.length}자`);
    }
  }
  console.log(`\n렌더 완료: ${count}개 프롬프트 · ${selPersonas.length}개 페르소나`);
  console.log(`출력: scripts/eval/out/prompts/  (기준일 ${nowVars.today})`);
  console.log(`다음 단계: README.md의 2) 생성 · 3) 평가 참고`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
