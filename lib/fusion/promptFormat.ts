import type { SajuResult } from "@/lib/saju/calculator";
import type { SajuBalanceWithDayun } from "@/lib/saju/balance";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { branchMeta, stemMeta } from "@/lib/saju/seasonClock";
import type { TciScore } from "@/lib/tci/scoring";

const ELEMENT_WORD: Record<string, string> = {
  목: "나무",
  화: "불",
  토: "흙",
  금: "쇠",
  수: "물",
};

function elementWord(value: string): string {
  return ELEMENT_WORD[value] ?? value;
}

function yinyangWord(value: "양" | "음"): string {
  return value === "양" ? "바깥으로 뻗는 쪽" : "안으로 모으는 쪽";
}

function hasBatchim(value: string): boolean {
  const last = [...value.trim()].at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function objectParticle(value: string): string {
  return `${value}${hasBatchim(value) ? "을" : "를"}`;
}

function strengthLabel(percent: number): string {
  if (percent >= 80) return "매우 강함";
  if (percent >= 65) return "강한 편";
  if (percent >= 45) return "중간권";
  if (percent >= 30) return "낮은 편";
  return "매우 낮음";
}

function pillarHint(label: string, pillar: NonNullable<SajuResult["pillars"]["time"]>): string {
  const stem = stemMeta(pillar.gan.hanja);
  const branch = branchMeta(pillar.zhi.hanja);
  return `- ${label}: ${stem.short} 같은 시작 힘, ${branch.phrase} 분위기; ${elementWord(pillar.gan.wuxing)} 계열, ${yinyangWord(pillar.gan.yinyang)}`;
}

export function formatFusionSajuForPrompt(saju: SajuResult): string {
  const correctionNote = formatKoreanTimeCorrection(saju.input.koreanTimeCorrection);
  const timeLine = saju.pillars.time
    ? pillarHint("태어난 시간 자리", saju.pillars.time)
    : "- 태어난 시간 자리: 시각 모름; 시간대 기반 해석은 생략하고 나머지 자리로만 본다.";
  const counts = saju.wuxingCount;
  const dayStem = stemMeta(saju.dayMaster.hanja);
  const monthSeason = branchMeta(saju.pillars.month.zhi.hanja);
  return [
    `타고난 결 한 줄: ${dayStem.short}처럼 ${objectParticle(dayStem.metaphor)} 품고, ${monthSeason.phrase}에 뿌리내린 출발점.`,
    pillarHint("태어난 해 자리", saju.pillars.year),
    pillarHint("타고난 환경 자리", saju.pillars.month),
    pillarHint("나 자신 자리", saju.pillars.day),
    timeLine,
    `타고난 재료 분포: 나무 ${counts.목} / 불 ${counts.화} / 흙 ${counts.토} / 쇠 ${counts.금} / 물 ${counts.수}`,
    correctionNote ? `계산 신뢰 메모: ${correctionNote}` : null,
  ].filter((line): line is string => Boolean(line)).join("\n");
}

export function formatFusionDayMasterForPrompt(saju: SajuResult): string {
  const stem = stemMeta(saju.dayMaster.hanja);
  return `${stem.short} — ${stem.metaphor}; ${elementWord(saju.dayMaster.wuxing)} 계열, ${yinyangWord(saju.dayMaster.yinyang)}`;
}

export function formatFusionZodiacForPrompt(saju: SajuResult): string {
  return `${saju.shengXiao.ko}띠`;
}

export function formatFusionBalanceForPrompt(balance: SajuBalanceWithDayun): string {
  const lines = [
    `원래 온도와 방향: ${balance.natalLabels.yinYang}, ${balance.natalLabels.hanYeol}`,
  ];
  if (balance.withDayunLabels && balance.currentDayun) {
    lines.push(
      `현재 10년 흐름 반영: ${balance.withDayunLabels.yinYang}, ${balance.withDayunLabels.hanYeol}; ${balance.currentDayun.startAge}세부터 ${elementWord(balance.currentDayun.ganWuxing)} 계열 힘이 더해짐`,
    );
  }
  return lines.join("\n");
}

export function formatFusionDayunForPrompt(saju: SajuResult, currentAge: number): string {
  const segs = saju.daewoon ?? [];
  if (segs.length === 0) return "(10년 흐름 계산 불가 — 출생 시각 미입력 등의 사유)";
  const currentIndex = segs.findIndex((d, i) => {
    const endAge = i + 1 < segs.length ? segs[i + 1].startAge - 1 : d.startAge + 9;
    return currentAge >= d.startAge && currentAge <= endAge;
  });
  const targetIndex = currentIndex >= 0 ? currentIndex : 0;
  const indices = [targetIndex - 1, targetIndex, targetIndex + 1]
    .filter((i) => i >= 0 && i < segs.length);

  const lines = indices.map((i) => {
    const d = segs[i];
    const endAge = i + 1 < segs.length ? segs[i + 1].startAge - 1 : d.startAge + 9;
    const stem = stemMeta(d.gan.hanja);
    const branch = branchMeta(d.zhi.hanja);
    const label = i < targetIndex ? "직전 배경" : i === targetIndex ? "지금 밟는 배경" : "다음 배경";
    const marker = i === targetIndex ? " ← 지금" : "";
    return `- ${label}: ${d.startAge}세~${endAge}세, ${stem.short} 힘과 ${branch.phrase} 분위기${marker}`;
  });
  lines.push("사용 원칙: 평생 흐름을 길게 풀지 말고, 지금 배경을 앞으로 6~12개월 선택 리허설에만 짧게 써라.");
  return lines.join("\n");
}

export function formatFusionScoresForPrompt(scores: TciScore[]): string {
  const lines: string[] = [];
  for (const score of scores) {
    lines.push(`- ${score.label}: ${score.percent}% (${strengthLabel(score.percent)}) — ${score.description}`);
    for (const sub of score.subscales ?? []) {
      lines.push(`    · ${sub.label}: ${sub.percent}% (${strengthLabel(sub.percent)}) — ${sub.description}`);
    }
  }
  return lines.join("\n");
}
