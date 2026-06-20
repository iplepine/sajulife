/**
 * 가족 관계·기운 그래프(FamilyRelationGraph)의 순수 로직.
 *
 * - 노드 = 구성원(일간 오행). 색·자연어 메타포는 WUXING_META.
 * - 엣지 = 두 사람 오행 사이 생(북돋움)·극(조율)·비화(같은 결).
 * - 빈자리 = 가족 전체 오행 합산에서 가장 약한 기운.
 *
 * 시각화(컴포넌트)와 분리해 두어 계산을 따로 검증할 수 있게 한다(seasonClock.ts ↔ FamilyCircle.tsx와 같은 패턴).
 * 사용자 노출 문구는 한자·생극용어 없이 자연어 메타포만 쓴다(가족 리포트 규칙).
 */

export type WuxingKo = "목" | "화" | "토" | "금" | "수";

const ORDER: readonly WuxingKo[] = ["목", "화", "토", "금", "수"] as const;

/** 오행별 CSS 색 키(el)와 일상어 메타포(nature). 색은 --el-{el} / --el-{el}-bg. */
export const WUXING_META: Record<WuxingKo, { el: string; nature: string }> = {
  목: { el: "wood", nature: "큰 나무" },
  화: { el: "fire", nature: "타는 불" },
  토: { el: "earth", nature: "너른 흙" },
  금: { el: "metal", nature: "단단한 쇠" },
  수: { el: "water", nature: "흐르는 물" },
};

// 상생: 목→화→토→금→수→목 (앞이 뒤를 북돋움)
const GENERATES: Record<WuxingKo, WuxingKo> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
// 상극: 목→토→수→화→금→목 (앞이 뒤를 누름)
const CONTROLS: Record<WuxingKo, WuxingKo> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

export type RelationKind = "생" | "극" | "비화";

/**
 * 두 기운 사이 관계. 생·극이면 `from`이 주는/누르는 쪽 인덱스(0=a, 1=b).
 * 서로 다른 두 기운은 항상 정확히 하나의 생 또는 극 관계다.
 */
export function relateWuxing(a: WuxingKo, b: WuxingKo): { kind: RelationKind; from: 0 | 1 } {
  if (a === b) return { kind: "비화", from: 0 };
  if (GENERATES[a] === b) return { kind: "생", from: 0 };
  if (GENERATES[b] === a) return { kind: "생", from: 1 };
  if (CONTROLS[a] === b) return { kind: "극", from: 0 };
  return { kind: "극", from: 1 }; // CONTROLS[b] === a
}

export function isWuxingKo(s: string): s is WuxingKo {
  return (ORDER as readonly string[]).includes(s);
}

/**
 * 가족 전체 오행 합산에서 가장 약한 기운.
 * - absent: 합이 0(아예 없음)
 * - low: 평균의 60% 미만(눈에 띄게 부족) — 빈자리로 보여줄지 판단에 쓴다.
 * 동률이면 표준 순서(목화토금수) 첫 번째.
 */
export function weakestElement(
  counts: Array<Partial<Record<WuxingKo, number>>>,
): { element: WuxingKo; total: number; absent: boolean; low: boolean } {
  const sum: Record<WuxingKo, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const c of counts) for (const k of ORDER) sum[k] += c[k] ?? 0;

  let weakest: WuxingKo = ORDER[0];
  for (const k of ORDER) if (sum[k] < sum[weakest]) weakest = k;

  const grand = ORDER.reduce((s, k) => s + sum[k], 0);
  const avg = grand / ORDER.length;
  return {
    element: weakest,
    total: sum[weakest],
    absent: sum[weakest] === 0,
    low: grand > 0 && sum[weakest] < avg * 0.6,
  };
}
