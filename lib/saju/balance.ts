/**
 * 사주의 음양·한열 좌표 계산.
 *
 * 같은 수치를 LifeCircle 컴포넌트(원국·대운 점 위치)와 AI 프롬프트
 * (자연어 라벨) 양쪽이 공유해서 사용한다. 한 군데서 계산해 두 군데서 보기 위해
 * 분리한 모듈.
 *
 * 점수 정의 (둘 다 [-1, +1])
 * - 음양: 천간·지지 각 글자에 +1(양)/-1(음). 합 / 글자 수.
 * - 한열: 글자의 오행에 가중치(화 +2, 목 +1, 토 0, 금 -1, 수 -2).
 *         합 / (글자 수 × 2). 정규화.
 *
 * "원국"은 4기둥의 8자(시주 없으면 6자), "대운 적용"은 원국 + 현재
 * 대운 천간·지지 2자.
 */

import type { DaewoonPillar, Pillar, SajuResult } from "./calculator";

const HEAT_WEIGHT: Record<string, number> = {
  화: 2, 목: 1, 토: 0, 금: -1, 수: -2,
};

type Char = { yinyang: "양" | "음"; wuxing: string };

function pillarChars(p: Pillar): Char[] {
  return [
    { yinyang: p.gan.yinyang, wuxing: p.gan.wuxing },
    { yinyang: p.zhi.yinyang, wuxing: p.zhi.wuxing },
  ];
}

function dayunChars(d: DaewoonPillar): Char[] {
  return [
    { yinyang: d.gan.yinyang, wuxing: d.gan.wuxing },
    { yinyang: d.zhi.yinyang, wuxing: d.zhi.wuxing },
  ];
}

function natalChars(pillars: SajuResult["pillars"]): Char[] {
  return [
    ...pillarChars(pillars.year),
    ...pillarChars(pillars.month),
    ...pillarChars(pillars.day),
    ...(pillars.time ? pillarChars(pillars.time) : []),
  ];
}

function scoreYinYang(chars: Char[]): number {
  if (chars.length === 0) return 0;
  const sum = chars.reduce((s, c) => s + (c.yinyang === "양" ? 1 : -1), 0);
  return sum / chars.length;
}

function scoreHanYeol(chars: Char[]): number {
  if (chars.length === 0) return 0;
  const sum = chars.reduce((s, c) => s + (HEAT_WEIGHT[c.wuxing] ?? 0), 0);
  return Math.max(-1, Math.min(1, sum / (chars.length * 2)));
}

/** 음양 점수를 자연어 라벨로. -1 ~ +1 → "강한 음" ~ "강한 양". */
export function yinYangLabel(s: number): string {
  const mag = Math.abs(s);
  if (mag < 0.12) return "음양 균형";
  const word = s > 0 ? "양" : "음";
  if (mag < 0.4) return `약한 ${word}`;
  if (mag < 0.75) return `${word} 우세`;
  return `강한 ${word}`;
}

/** 한열 점수를 자연어 라벨로. -1(차가운) ~ +1(뜨거운). */
export function hanYeolLabel(s: number): string {
  const mag = Math.abs(s);
  if (mag < 0.12) return "온화";
  if (s > 0) {
    if (mag < 0.4) return "약간 따뜻함";
    if (mag < 0.75) return "따뜻한 편";
    return "뜨거운 편";
  }
  if (mag < 0.4) return "약간 서늘함";
  if (mag < 0.75) return "서늘한 편";
  return "차가운 편";
}

export type SajuBalance = {
  natal: { yinYang: number; hanYeol: number };
  natalLabels: { yinYang: string; hanYeol: string };
};

export type SajuBalanceWithDayun = SajuBalance & {
  /** 현재 대운(있을 때)까지 더한 위치 */
  withDayun: { yinYang: number; hanYeol: number } | null;
  withDayunLabels: { yinYang: string; hanYeol: string } | null;
  /** 현재 대운의 천간/지지 (예: "갑인 (목·양)") */
  currentDayun: { startAge: number; ganZhiKo: string; ganWuxing: string } | null;
};

/** 원국만(대운 없음) 좌표. */
export function computeNatalBalance(saju: SajuResult): SajuBalance {
  const chars = natalChars(saju.pillars);
  const yy = scoreYinYang(chars);
  const hy = scoreHanYeol(chars);
  return {
    natal: { yinYang: yy, hanYeol: hy },
    natalLabels: { yinYang: yinYangLabel(yy), hanYeol: hanYeolLabel(hy) },
  };
}

/** 원국 + 현재 대운까지 더한 좌표. 대운 정보가 없으면 withDayun = null. */
export function computeBalanceWithDayun(
  saju: SajuResult,
  currentAge: number,
): SajuBalanceWithDayun {
  const natal = computeNatalBalance(saju);
  const segs = saju.daewoon ?? [];
  if (segs.length === 0) {
    return { ...natal, withDayun: null, withDayunLabels: null, currentDayun: null };
  }
  let idx = 0;
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].startAge <= currentAge) idx = i;
  }
  const cur = segs[idx];
  const combined = [...natalChars(saju.pillars), ...dayunChars(cur)];
  const yy = scoreYinYang(combined);
  const hy = scoreHanYeol(combined);
  return {
    ...natal,
    withDayun: { yinYang: yy, hanYeol: hy },
    withDayunLabels: { yinYang: yinYangLabel(yy), hanYeol: hanYeolLabel(hy) },
    currentDayun: {
      startAge: cur.startAge,
      ganZhiKo: `${cur.gan.ko}${cur.zhi.ko}`,
      ganWuxing: cur.gan.wuxing,
    },
  };
}

/** AI 프롬프트에 직접 꽂아 넣을 형식의 다줄 문자열. */
export function formatBalanceForPrompt(b: SajuBalanceWithDayun): string {
  const lines: string[] = [];
  lines.push(
    `- 원국 좌표 (4기둥 8자): 음양=${b.natal.yinYang.toFixed(2)} (${b.natalLabels.yinYang}) · 한열=${b.natal.hanYeol.toFixed(2)} (${b.natalLabels.hanYeol})`,
  );
  if (b.withDayun && b.withDayunLabels && b.currentDayun) {
    const move = describeMovement(b.natal, b.withDayun);
    lines.push(
      `- 현재 대운(${b.currentDayun.startAge}세~ ${b.currentDayun.ganZhiKo}, ${b.currentDayun.ganWuxing}) 적용 후: 음양=${b.withDayun.yinYang.toFixed(2)} (${b.withDayunLabels.yinYang}) · 한열=${b.withDayun.hanYeol.toFixed(2)} (${b.withDayunLabels.hanYeol})`,
    );
    if (move) lines.push(`- 흐름: ${move}`);
  } else {
    lines.push("- 대운 정보 없음(생애 흐름 좌표 미산출).");
  }
  return lines.join("\n");
}

function describeMovement(
  from: { yinYang: number; hanYeol: number },
  to: { yinYang: number; hanYeol: number },
): string | null {
  const dyy = to.yinYang - from.yinYang;
  const dhy = to.hanYeol - from.hanYeol;
  if (Math.abs(dyy) < 0.05 && Math.abs(dhy) < 0.05) return "원국과 거의 같은 자리 (대운이 결을 거의 흔들지 않음).";
  const parts: string[] = [];
  if (Math.abs(dyy) >= 0.05) parts.push(dyy > 0 ? "양 쪽으로 이동" : "음 쪽으로 이동");
  if (Math.abs(dhy) >= 0.05) parts.push(dhy > 0 ? "따뜻한 쪽으로 이동" : "서늘한 쪽으로 이동");
  return parts.join(" · ");
}
