/**
 * 만세력 원본 뷰 데이터 — 원국(사주팔자) · 대운 · 세운 · 월운을 '한 칸(LuckColumn)'이라는
 * 동일한 구조로 펼쳐, 화면이 네 구획을 같은 시각 언어로 그리게 한다.
 *
 * 모든 값은 lunar-javascript + 우리 십신/십이운성/신살 계산으로 결정론적으로 나온다(AI 호출 0).
 * - 원국·대운: calculateSaju()가 이미 계산한 결과를 그대로 재사용.
 * - 세운(년): 해당 연도 7/1을 샘플해 입춘 기준 년주를 얻는다(대운→세운 체인과 30/30 일치 검증).
 * - 월운(양력 달): 해당 달 15일을 샘플해 절기 기준 월주를 얻는다(오호둔 반영, 15일은 절 경계 뒤라 안정).
 */

import { Solar } from "lunar-javascript";
import type { SajuProfile } from "../store/types";
import { calculateSaju, type DaewoonPillar, type Pillar } from "./calculator";
import {
  GAN_KO,
  GAN_TO_WUXING,
  GAN_YINYANG,
  WUXING_KO,
  ZHI_KO,
  ZHI_TO_WUXING,
  ZHI_YINYANG,
} from "./readings";
import { listSymbolicStarsForBranch, type SymbolicStar } from "./symbolicStars";
import {
  tenSpiritFromStem,
  tenSpiritFromZhi,
  tenSpiritsFromHiddenStems,
  type TenSpirit,
} from "./tenSpirits";
import { twelveStage, type TwelveStage } from "./twelveStages";

export type StemView = {
  hanja: string;
  ko: string;
  wuxing: string;
  yinyang: "양" | "음";
  /** 일간 기준 십신. 일간 자기 자신이면 null. */
  tenSpirit: TenSpirit | null;
};

export type HiddenStemView = { ko: string; hanja: string; tenSpirit: TenSpirit | null };

export type BranchView = {
  hanja: string;
  ko: string;
  wuxing: string;
  yinyang: "양" | "음";
  /** 정기(첫 지장간) 기준 대표 십신. */
  tenSpirit: TenSpirit | null;
  /** 정기를 제외한 나머지 지장간 (보조 기운). */
  hiddenStems: HiddenStemView[];
  twelveStage: TwelveStage | null;
  stars: SymbolicStar[];
};

/** 만세력 표의 한 칸 — 원국 한 기둥이자 대운/세운/월운 한 시기. */
export type LuckColumn = {
  key: string;
  /** 큰 라벨: "일" · "5세" · "2026" · "6월" */
  label: string;
  /** 보조 라벨: 대운/세운 나이·연도 등 */
  subLabel?: string;
  /** 시각 모름이면 gan·zhi 둘 다 null (원국 시주 한정). */
  gan: StemView | null;
  zhi: BranchView | null;
  /** 지금 지나는 대운/세운/월운이면 true. */
  current?: boolean;
  /** 일주 천간(=일간 자기 자신) 칸이면 true. */
  dayMaster?: boolean;
};

export type Manseryeok = {
  meta: {
    name?: string;
    gender: string;
    birthDate: string;
    birthTime: string;
    birthTimeKnown: boolean;
    calendar: "solar" | "lunar";
    dayMaster: { ko: string; hanja: string; wuxing: string; yinyang: "양" | "음" };
    shengXiao: { ko: string; hanja: string };
    currentAge?: number;
    currentYear: number;
  };
  /** 원국 4기둥 — 표시 순서 시·일·월·연. */
  natal: LuckColumn[];
  /** 10년 단위 대운 — 어릴 때 → 노년 순. */
  daewoon: LuckColumn[];
  /** 세운(년운) — currentYear 기준 앞뒤 창(오래된 → 최근 순). */
  saewoon: LuckColumn[];
  /** 월운(양력 달) — 지정 연도의 12개월. */
  wolwoon: { year: number; columns: LuckColumn[] };
};

// ------------------------------------------------------------
// 칸 조립 헬퍼
// ------------------------------------------------------------

function stemView(dayStem: string, stemHanja: string, isDayMaster = false): StemView {
  return {
    hanja: stemHanja,
    ko: GAN_KO[stemHanja] ?? stemHanja,
    wuxing: WUXING_KO[GAN_TO_WUXING[stemHanja] ?? ""] ?? "",
    yinyang: GAN_YINYANG[stemHanja] ?? "양",
    tenSpirit: isDayMaster ? null : tenSpiritFromStem(dayStem, stemHanja),
  };
}

function branchView(dayStem: string, dayBranch: string, branchHanja: string): BranchView {
  const hidden = tenSpiritsFromHiddenStems(dayStem, branchHanja).slice(1).map((h) => ({
    ko: GAN_KO[h.stem] ?? h.stem,
    hanja: h.stem,
    tenSpirit: h.spirit,
  }));
  return {
    hanja: branchHanja,
    ko: ZHI_KO[branchHanja] ?? branchHanja,
    wuxing: WUXING_KO[ZHI_TO_WUXING[branchHanja] ?? ""] ?? "",
    yinyang: ZHI_YINYANG[branchHanja] ?? "양",
    tenSpirit: tenSpiritFromZhi(dayStem, branchHanja),
    hiddenStems: hidden,
    twelveStage: twelveStage(dayStem, branchHanja),
    stars: listSymbolicStarsForBranch({ dayStem, dayBranch, branch: branchHanja }),
  };
}

/** 간지 두 글자 문자열(예: "丙午")로 한 칸을 만든다. 세운·월운용. */
function ganZhiColumn(
  dayStem: string,
  dayBranch: string,
  ganZhi: string,
  base: { key: string; label: string; subLabel?: string; current?: boolean },
): LuckColumn {
  return {
    ...base,
    gan: stemView(dayStem, ganZhi[0]),
    zhi: branchView(dayStem, dayBranch, ganZhi[1]),
  };
}

function natalColumn(
  label: string,
  pillar: Pillar | null,
  dayStem: string,
  dayBranch: string,
  isDay = false,
): LuckColumn {
  if (!pillar) return { key: label, label, gan: null, zhi: null };
  return {
    key: label,
    label,
    gan: stemView(dayStem, pillar.gan.hanja, isDay),
    zhi: branchView(dayStem, dayBranch, pillar.zhi.hanja),
    dayMaster: isDay,
  };
}

function daewoonColumn(d: DaewoonPillar, dayStem: string, dayBranch: string, current: boolean): LuckColumn {
  return {
    key: `dw-${d.startAge}`,
    label: `${d.startAge}세`,
    subLabel: `${d.startYear}~`,
    gan: stemView(dayStem, d.gan.hanja),
    zhi: branchView(dayStem, dayBranch, d.zhi.hanja),
    current,
  };
}

/** 입춘 기준 년주 — 연중(7/1)을 샘플해 경계를 피한다. */
function yearGanZhi(year: number): string {
  return Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar().getEightChar().getYear();
}

/** 절기 기준 월주 — 해당 양력 달 15일(절 경계 뒤)을 샘플. 오호둔(년간)이 자동 반영된다. */
function monthGanZhi(year: number, month: number): string {
  return Solar.fromYmdHms(year, month, 15, 12, 0, 0).getLunar().getEightChar().getMonth();
}

/** currentYear가 속한 대운 인덱스(startYear ≤ currentYear인 마지막 칸). 없으면 -1. */
function currentDaewoonIndex(daewoon: DaewoonPillar[], currentYear: number): number {
  let idx = -1;
  for (let i = 0; i < daewoon.length; i++) {
    if (daewoon[i].startYear <= currentYear) idx = i;
  }
  return idx;
}

// ------------------------------------------------------------
// 메인 빌더
// ------------------------------------------------------------

/** 세운 표시 창 — 올해 기준 뒤로 4년 ~ 앞으로 5년(총 10칸). */
const SAEWOON_BACK = 4;
const SAEWOON_FORWARD = 5;

export function buildManseryeok(
  profile: SajuProfile,
  opts: { currentYear: number; currentAge?: number; currentMonth?: number; wolwoonYear?: number },
): Manseryeok {
  const saju = calculateSaju(profile);
  const dayStem = saju.dayMaster.hanja;
  const dayBranch = saju.pillars.day.zhi.hanja;
  const { currentYear, currentAge, currentMonth } = opts;
  const wolwoonYear = opts.wolwoonYear ?? currentYear;

  // 원국 — 시·일·월·연
  const natal: LuckColumn[] = [
    natalColumn("시", saju.pillars.time, dayStem, dayBranch),
    natalColumn("일", saju.pillars.day, dayStem, dayBranch, true),
    natalColumn("월", saju.pillars.month, dayStem, dayBranch),
    natalColumn("연", saju.pillars.year, dayStem, dayBranch),
  ];

  // 대운
  const dwIdx = currentDaewoonIndex(saju.daewoon, currentYear);
  const daewoon = saju.daewoon.map((d, i) => daewoonColumn(d, dayStem, dayBranch, i === dwIdx));

  // 세운
  const saewoon: LuckColumn[] = [];
  for (let y = currentYear - SAEWOON_BACK; y <= currentYear + SAEWOON_FORWARD; y++) {
    const age = currentAge != null ? currentAge + (y - currentYear) : undefined;
    saewoon.push(
      ganZhiColumn(dayStem, dayBranch, yearGanZhi(y), {
        key: `sw-${y}`,
        label: `${y}`,
        subLabel: age != null && age >= 0 ? `${age}세` : undefined,
        current: y === currentYear,
      }),
    );
  }

  // 월운 (지정 연도 12개월) — 올해면 이번 달을 현재로 표시
  const highlightMonth = wolwoonYear === currentYear ? currentMonth : undefined;
  const wolColumns: LuckColumn[] = [];
  for (let m = 1; m <= 12; m++) {
    wolColumns.push(
      ganZhiColumn(dayStem, dayBranch, monthGanZhi(wolwoonYear, m), {
        key: `wl-${m}`,
        label: `${m}월`,
        current: m === highlightMonth,
      }),
    );
  }

  return {
    meta: {
      name: profile.name,
      gender: profile.gender === "male" ? "남성" : "여성",
      birthDate: saju.input.birthDate,
      birthTime: saju.input.birthTime,
      birthTimeKnown: saju.input.birthTimeKnown,
      calendar: saju.input.calendar,
      dayMaster: saju.dayMaster,
      shengXiao: saju.shengXiao,
      currentAge,
      currentYear,
    },
    natal,
    daewoon,
    saewoon,
    wolwoon: { year: wolwoonYear, columns: wolColumns },
  };
}
