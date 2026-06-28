// 실제 계정(KV) 데이터로 5종 프롬프트를 렌더한다 — 본인 계정 1개만 read-only로 읽는다.
// 합성 페르소나(personas.ts) 대신 진짜 프로필·기질응답·가족·상담근거를 주입한다.
//   npx tsx --env-file=<.env.local> scripts/eval/render-me.ts <UID>
// AI(Gemini) 호출 0, 비용 0. 다음 단계(생성·채점)는 Claude가 한다.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Redis } from "@upstash/redis";
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
import { computeCautionMonths, formatCautionMonthsForPrompt } from "../../lib/saju/cautionMonths";
import { computeYongsin, formatYongsinForPrompt } from "../../lib/saju/yongsin";
import {
  formatFusionBalanceForPrompt,
  formatFusionDayMasterForPrompt,
  formatFusionDayunForPrompt,
  formatFusionSajuForPrompt,
  formatFusionScoresForPrompt,
  formatFusionZodiacForPrompt,
} from "../../lib/fusion/promptFormat";
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
import { consultBasisSources, formatConsultBasisForPrompt } from "../../lib/store/consultBasis";
import type { FamilyMember, SajuProfile, TciAnswers } from "../../lib/store/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "out", "prompts");

const SOURCE_SHORT: Record<string, string> = { personal: "사주", tci: "기질", fusion: "융합", family: "가족" };

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

async function main() {
  const uid = process.argv[2];
  if (!uid) throw new Error("UID를 인자로 주세요");
  const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: (process.env.KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_TOKEN)!,
  });

  // 본인 계정 1개만 read-only.
  const profile = (await redis.get(`user:${uid}:profile`)) as SajuProfile | null;
  if (!profile) throw new Error("프로필 없음");
  const tci =
    ((await redis.get(`user:${uid}:tci:full`)) as TciAnswers | null) ??
    ((await redis.get(`user:${uid}:tci:short`)) as TciAnswers | null);
  const family = (await redis.get(`user:${uid}:family`)) as { members: FamilyMember[] } | null;
  const consultBasis = (await redis.get(`user:${uid}:consult-basis`)) as Parameters<typeof formatConsultBasisForPrompt>[0] | null;
  const consults = (await redis.get(`user:${uid}:consults`)) as Array<{ question?: string }> | null;
  const consultQuestion = consults?.[0]?.question?.trim() || "";

  const nowVars = getNowVars();
  const today = nowVars.today;
  const saju = calculateSaju(profile);
  const currentAge = calculateCurrentAge(profile.birthDate, today);
  const balance = computeBalanceWithDayun(saju, currentAge);
  const scores = tci ? await scoreTciByVariant(tci.variant, tci.answers) : [];

  const baseVars = {
    name: profile.name,
    birthDate: profile.birthDate,
    birthTime: profile.birthTime || "(시각 모름)",
    gender: profile.gender === "male" ? "남성" : "여성",
    calendar: profile.calendar === "lunar" ? "음력" : "양력",
    occupation: occupationLabel(profile),
    relationshipStatus: relationshipStatusLabel(profile.relationshipStatus),
    childrenStatus: childrenStatusLabel(profile.childrenStatus),
    currentConcern: currentConcernLabel(profile),
    profileContext: profileContextForPrompt(profile),
    currentAge: String(currentAge),
  };

  mkdirSync(OUT, { recursive: true });
  const wrote: string[] = [];
  const write = (kind: string, text: string) => {
    writeFileSync(join(OUT, `me-${kind}.txt`), text);
    wrote.push(`${kind} (${text.length}자)`);
  };

  // 1) 개인 사주
  write("saju", renderTemplate(DEFAULT_PROMPTS["personal-saju"].template, {
    ...baseVars,
    note: currentConcernLabel(profile),
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
    cautionMonths: formatCautionMonthsForPrompt(computeCautionMonths(saju, Number(nowVars.currentYear)), Number(nowVars.currentYear), Number(nowVars.currentMonth.slice(-2))),
    yongsin: formatYongsinForPrompt(computeYongsin(saju)),
    agePriority: "",
    ...nowVars,
  }));

  // 2) 기질
  if (tci) {
    write("tci", renderTemplate(DEFAULT_PROMPTS["tci-report"].template, {
      ...baseVars,
      tciScores: formatScoresForPrompt(scores),
      ...nowVars,
    }));
  }

  // 3) 융합
  if (tci) {
    write("fusion", renderTemplate(DEFAULT_PROMPTS["tci-saju-fusion"].template, {
      ...baseVars,
      sajuTable: formatFusionSajuForPrompt(saju),
      dayMaster: formatFusionDayMasterForPrompt(saju),
      shengXiao: formatFusionZodiacForPrompt(saju),
      sajuBalance: formatFusionBalanceForPrompt(balance),
      dayunTable: formatFusionDayunForPrompt(saju, currentAge),
      tciScores: formatFusionScoresForPrompt(scores),
      ...nowVars,
    }));
  }

  // 4) 가족
  if (family?.members?.length) {
    const familyTable = family.members
      .map((m) => formatMemberBlock(m, calculateSaju(m.profile), today))
      .join("\n\n");
    write("family", renderTemplate(DEFAULT_PROMPTS["family-saju"].template, {
      ...baseVars,
      profileContext: familyMemberContextForPrompt(profile),
      sajuTable: formatSajuForPrompt(saju),
      dayMaster: `${saju.dayMaster.ko}(${saju.dayMaster.hanja}) · ${saju.dayMaster.wuxing} · ${saju.dayMaster.yinyang}`,
      selfDayunTable: formatDayunForPrompt(saju, currentAge),
      familyTable,
      ...nowVars,
    }));
  }

  // 5) 상담 (실제 라우트와 동일하게 consult-basis를 컨텍스트로)
  if (consultQuestion && consultBasis) {
    const sources = consultBasisSources(consultBasis);
    write("consult", renderTemplate(DEFAULT_PROMPTS["consult"].template, {
      ...baseVars,
      basisLabel: `${sources.map((k) => SOURCE_SHORT[k] ?? k).join("·")} 리포트 근거`,
      contextBlock: formatConsultBasisForPrompt(consultBasis),
      question: consultQuestion,
      ...nowVars,
    }));
  }

  // 메타
  writeFileSync(join(OUT, "me-meta.json"), JSON.stringify({
    uid,
    profile,
    currentAge,
    birthTimeKnown: saju.input.birthTimeKnown,
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
    },
    tciVariant: tci?.variant ?? null,
    tciScored: Object.fromEntries(scores.map((s) => [s.dimension, s.percent])),
    family: family?.members?.map((m) => ({ relation: m.relation, name: m.profile.name, birthDate: m.profile.birthDate })) ?? [],
    consultQuestion,
  }, null, 2));

  console.log("렌더 완료:", wrote.join(" · "));
  console.log("기준일:", today, "/ 만 나이:", currentAge, "/ 출생시각:", saju.input.birthTimeKnown ? "있음" : "모름");
}

main().catch((e) => { console.error(e); process.exit(1); });
