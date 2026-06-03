import type { Pillar, SajuResult } from "./calculator";
import { BRANCH_META, STEM_META } from "./seasonClock";

type WuxingKey = keyof SajuResult["wuxingCount"];
const OHENG_KO: Record<WuxingKey, string> = { 목: "목(나무)", 화: "화(불)", 토: "토(흙)", 금: "금(쇠)", 수: "수(물)" };

function pillarLine(label: string, p: Pillar): string {
  return `- ${label}: ${p.korean} / 천간 ${p.gan.ko}(${p.gan.wuxing}·${p.gan.yinyang}) · 지지 ${p.zhi.ko}(${p.zhi.wuxing}) · 납음 ${p.naYin}`;
}

export function formatSajuForPrompt(saju: SajuResult): string {
  const { pillars, dayMaster, shengXiao, wuxingCount } = saju;
  const timeLine = pillars.time
    ? pillarLine("시주", pillars.time)
    : "- 시주: 모름 (출생시각 미입력 — 시주 기반 해석은 생략하고 연·월·일주만으로 풀이할 것)";
  const wuxingNote = pillars.time ? "" : " · (시주 제외, 6글자 기준)";
  const lines = [
    pillarLine("연주", pillars.year),
    pillarLine("월주", pillars.month),
    pillarLine("일주", pillars.day),
    timeLine,
    "",
    `일간(나): ${dayMaster.ko}(${dayMaster.hanja}) · ${dayMaster.wuxing} · ${dayMaster.yinyang}`,
    `띠: ${shengXiao.ko}(${shengXiao.hanja})`,
    `오행 분포${wuxingNote}: 목 ${wuxingCount.목} / 화 ${wuxingCount.화} / 토 ${wuxingCount.토} / 금 ${wuxingCount.금} / 수 ${wuxingCount.수}`,
  ];
  return lines.join("\n");
}

export function formatDayPillar(saju: SajuResult): string {
  return saju.pillars.day.korean;
}

/** 일간 → 한국어 메타포 (예: "큰 나무 — 우직한 거목"). */
export function formatStemForPrompt(saju: SajuResult): string {
  const m = STEM_META[saju.dayMaster.hanja];
  if (!m) return saju.dayMaster.ko;
  return `${m.short} — ${m.metaphor} (${m.emoji})`;
}

/** 월지 → 계절 + 한국어 풀이 (예: "봄 — 푸르른 늦봄"). */
export function formatMonthSeasonForPrompt(saju: SajuResult): string {
  const m = BRANCH_META[saju.pillars.month.zhi.hanja];
  if (!m) return saju.pillars.month.zhi.ko;
  return `${m.season} — ${m.phrase}`;
}

/** 오행 분포를 강한·부족한·전체로 정리. */
export function formatOhengForPrompt(saju: SajuResult): string {
  const counts = saju.wuxingCount;
  const all = (Object.keys(counts) as WuxingKey[]).map((k) => ({ k, c: counts[k] }));
  const strong = all.filter((x) => x.c >= 2).sort((a, b) => b.c - a.c);
  const weak = all.filter((x) => x.c === 0);
  const balanced = all.filter((x) => x.c === 1);
  const lines: string[] = [];
  lines.push(
    `강한 오행: ${strong.length ? strong.map((x) => `${OHENG_KO[x.k]} ${x.c}`).join(" · ") : "없음 (고른 분포)"}`,
  );
  lines.push(
    `부족한 오행 (0개): ${weak.length ? weak.map((x) => OHENG_KO[x.k]).join(" · ") : "없음 (오행이 모두 존재)"}`,
  );
  if (balanced.length) {
    lines.push(`약하게 존재 (1개): ${balanced.map((x) => OHENG_KO[x.k]).join(" · ")}`);
  }
  lines.push(
    `전체 분포: 목 ${counts.목} / 화 ${counts.화} / 토 ${counts.토} / 금 ${counts.금} / 수 ${counts.수}`,
  );
  return lines.join("\n");
}

/** 9 대운을 10년 단위로 줄세움. 현재 대운은 "← 지금"으로 표시. */
export function formatDayunForPrompt(saju: SajuResult, currentAge: number): string {
  const segs = saju.daewoon ?? [];
  if (segs.length === 0) return "(대운 계산 불가 — 출생 시각 미입력 등의 사유)";
  return segs
    .map((d, i) => {
      const endAge = i + 1 < segs.length ? segs[i + 1].startAge - 1 : d.startAge + 9;
      const isCurrent = currentAge >= d.startAge && currentAge <= endAge;
      const marker = isCurrent ? "  ← 지금" : "";
      const startStr = String(d.startAge).padStart(2, " ");
      return `${i + 1}. ${startStr}세~${endAge}세  ${d.gan.ko}${d.zhi.ko} (${d.gan.hanja}${d.zhi.hanja}) — 천간 ${d.gan.wuxing}·${d.gan.yinyang} / 지지 ${d.zhi.wuxing}·${d.zhi.yinyang}${marker}`;
    })
    .join("\n");
}
