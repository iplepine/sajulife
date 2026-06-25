/**
 * 사주 십신(十神) — 일간 vs 다른 천간/지지의 관계를 10가지로 세분.
 *
 * 오행 관계(상생/상극) + 음양 일치/다름으로 결정.
 * 같은 오행 + 같은 음양 = 비견, 다른 음양 = 겁재. 이런 식.
 *
 * 사주 명리의 핵심 분석 단위. 5 카테고리(인성·비겁·식상·재성·관성)를
 * 음양 기준 둘로 쪼개어 그 시기·자리의 결 스타일을 구체화한다.
 */

import type { Pillar } from "./calculator";

// ============================================================
// 천간·지지 데이터
// ============================================================

const STEM_YINYANG: Record<string, "양" | "음"> = {
  甲: "양", 乙: "음", 丙: "양", 丁: "음", 戊: "양",
  己: "음", 庚: "양", 辛: "음", 壬: "양", 癸: "음",
};

const STEM_WUXING: Record<string, string> = {
  甲: "목", 乙: "목", 丙: "화", 丁: "화", 戊: "토",
  己: "토", 庚: "금", 辛: "금", 壬: "수", 癸: "수",
};

/** 지장간(藏干) — 지지 안에 숨은 천간. 첫 번째가 정기(正氣). */
export const ZHI_HIDDEN_STEMS: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "戊", "庚"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

// ============================================================
// 십신 종류 + 한국어 풀이
// ============================================================

export type TenSpirit =
  | "비견" | "겁재"
  | "식신" | "상관"
  | "편재" | "정재"
  | "편관" | "정관"
  | "편인" | "정인";

export const ALL_TEN_SPIRITS: TenSpirit[] = [
  "비견", "겁재", "식신", "상관",
  "편재", "정재", "편관", "정관",
  "편인", "정인",
];

/** 5 카테고리(요약용) */
export type FiveCategory = "비겁" | "식상" | "재성" | "관성" | "인성";

const SPIRIT_TO_CATEGORY: Record<TenSpirit, FiveCategory> = {
  비견: "비겁", 겁재: "비겁",
  식신: "식상", 상관: "식상",
  편재: "재성", 정재: "재성",
  편관: "관성", 정관: "관성",
  편인: "인성", 정인: "인성",
};

export function categoryOf(spirit: TenSpirit): FiveCategory {
  return SPIRIT_TO_CATEGORY[spirit];
}

/** 십신별 짧은 한국어 + 한 줄 풀이. 시각·텍스트 양쪽에서 사용. */
export const TEN_SPIRIT_LABELS: Record<TenSpirit, { short: string; description: string }> = {
  비견: { short: "협력자",       description: "친구·동료·형제 — 같은 결의 사람들과 함께" },
  겁재: { short: "경쟁자",       description: "라이벌·도전자 — 부딪치며 단단해지는 결" },
  식신: { short: "표현·여유",    description: "부드러운 창작·자녀·생활의 여유" },
  상관: { short: "창의·반항",    description: "날카로운 표현·기존 질서에 도전" },
  편재: { short: "큰 기회·모험", description: "사업·해외·큰 돈의 흐름" },
  정재: { short: "안정 재산",    description: "월급·집·차곡차곡 모이는 결실" },
  편관: { short: "큰 도전·중책", description: "압박·갈등·창업·권력의 시기" },
  정관: { short: "명예·결혼",    description: "공직·승진·결혼·정통 권위" },
  편인: { short: "직관·예술",    description: "특수 학문·영감·예술적 깨달음" },
  정인: { short: "부모·배움",    description: "정규 교육·부모 덕·정통 학문" },
};

// ============================================================
// 십신 계산
// ============================================================

const WUXING_ORDER = ["목", "화", "토", "금", "수"] as const;

function generates(a: string, b: string): boolean {
  const ai = WUXING_ORDER.indexOf(a as (typeof WUXING_ORDER)[number]);
  const bi = WUXING_ORDER.indexOf(b as (typeof WUXING_ORDER)[number]);
  if (ai < 0 || bi < 0) return false;
  return (ai + 1) % 5 === bi;
}

function controls(a: string, b: string): boolean {
  const ai = WUXING_ORDER.indexOf(a as (typeof WUXING_ORDER)[number]);
  const bi = WUXING_ORDER.indexOf(b as (typeof WUXING_ORDER)[number]);
  if (ai < 0 || bi < 0) return false;
  return (ai + 2) % 5 === bi;
}

/** 일간(천간 한자) vs 다른 천간(한자) = 십신. */
export function tenSpiritFromStem(dayMaster: string, other: string): TenSpirit | null {
  const dmW = STEM_WUXING[dayMaster];
  const ownW = STEM_WUXING[other];
  const dmYy = STEM_YINYANG[dayMaster];
  const ownYy = STEM_YINYANG[other];
  if (!dmW || !ownW || !dmYy || !ownYy) return null;
  const sameYy = dmYy === ownYy;

  if (dmW === ownW) return sameYy ? "비견" : "겁재";
  if (generates(dmW, ownW)) return sameYy ? "식신" : "상관";
  if (controls(dmW, ownW)) return sameYy ? "편재" : "정재";
  if (controls(ownW, dmW)) return sameYy ? "편관" : "정관";
  if (generates(ownW, dmW)) return sameYy ? "편인" : "정인";
  return null;
}

/** 일간(천간 한자) vs 지지(한자) = 지지 정기 천간을 통해 십신. */
export function tenSpiritFromZhi(dayMaster: string, zhi: string): TenSpirit | null {
  const mainStem = ZHI_HIDDEN_STEMS[zhi]?.[0];
  if (!mainStem) return null;
  return tenSpiritFromStem(dayMaster, mainStem);
}

/** 지지 속 지장간 각각의 십신. 표에서는 정기 외 보조 기운까지 보여줄 때 사용한다. */
export function tenSpiritsFromHiddenStems(
  dayMaster: string,
  zhi: string,
): Array<{ stem: string; spirit: TenSpirit | null }> {
  return (ZHI_HIDDEN_STEMS[zhi] ?? []).map((stem) => ({
    stem,
    spirit: tenSpiritFromStem(dayMaster, stem),
  }));
}

// ============================================================
// 8자 전체 십신 분석 — 원국 분포
// ============================================================

export type NatalSpiritItem = {
  position: "연주" | "월주" | "일주" | "시주";
  type: "천간" | "지지";
  spirit: TenSpirit | null;
};

/** 8자 중 일간을 제외한 7자(또는 시주 없을 때 5자)의 십신을 나열. */
export function listNatalSpirits(
  pillars: { year: Pillar; month: Pillar; day: Pillar; time: Pillar | null },
): NatalSpiritItem[] {
  const dm = pillars.day.gan.hanja;
  const out: NatalSpiritItem[] = [];
  out.push({ position: "연주", type: "천간", spirit: tenSpiritFromStem(dm, pillars.year.gan.hanja) });
  out.push({ position: "연주", type: "지지", spirit: tenSpiritFromZhi(dm, pillars.year.zhi.hanja) });
  out.push({ position: "월주", type: "천간", spirit: tenSpiritFromStem(dm, pillars.month.gan.hanja) });
  out.push({ position: "월주", type: "지지", spirit: tenSpiritFromZhi(dm, pillars.month.zhi.hanja) });
  out.push({ position: "일주", type: "지지", spirit: tenSpiritFromZhi(dm, pillars.day.zhi.hanja) });
  if (pillars.time) {
    out.push({ position: "시주", type: "천간", spirit: tenSpiritFromStem(dm, pillars.time.gan.hanja) });
    out.push({ position: "시주", type: "지지", spirit: tenSpiritFromZhi(dm, pillars.time.zhi.hanja) });
  }
  return out;
}

/** 십신 카운트 — 어떤 십신이 몇 개인지. 분포 시각화·프롬프트에 사용. */
export function tenSpiritDistribution(
  pillars: { year: Pillar; month: Pillar; day: Pillar; time: Pillar | null },
): Record<TenSpirit, number> {
  const dist: Record<TenSpirit, number> = {
    비견: 0, 겁재: 0, 식신: 0, 상관: 0,
    편재: 0, 정재: 0, 편관: 0, 정관: 0,
    편인: 0, 정인: 0,
  };
  for (const item of listNatalSpirits(pillars)) {
    if (item.spirit) dist[item.spirit]++;
  }
  return dist;
}

/** 5 카테고리 카운트 — 단순화한 분포. */
export function fiveCategoryDistribution(
  pillars: { year: Pillar; month: Pillar; day: Pillar; time: Pillar | null },
): Record<FiveCategory, number> {
  const cat: Record<FiveCategory, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  const ten = tenSpiritDistribution(pillars);
  for (const spirit of ALL_TEN_SPIRITS) {
    cat[categoryOf(spirit)] += ten[spirit];
  }
  return cat;
}
