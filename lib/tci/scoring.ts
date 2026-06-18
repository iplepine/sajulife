import type { TciVariant } from "@/lib/store/types";
import {
  getItemsForScoring,
  TCI_DIMENSIONS,
  type TciDimension,
  type TciItem,
} from "./questions";
import { getSubscaleMeta } from "./subscales";

export type TciSubscaleScore = {
  code: string;          // "NS1"
  label: string;         // "탐색적 흥분"
  description: string;
  raw: number;
  max: number;
  percent: number;
};

export type TciScore = {
  dimension: TciDimension;
  label: string;
  description: string;
  raw: number;
  max: number;
  percent: number;
  /** 확장판(140문항)일 때만 채워진다. 약식판은 undefined. */
  subscales?: TciSubscaleScore[];
};

type Accum = { sum: number; count: number };

function emptyAccum(): Record<TciDimension, Accum> {
  return {
    NS: { sum: 0, count: 0 },
    HA: { sum: 0, count: 0 },
    RD: { sum: 0, count: 0 },
    PS: { sum: 0, count: 0 },
    SD: { sum: 0, count: 0 },
    CO: { sum: 0, count: 0 },
    ST: { sum: 0, count: 0 },
  };
}

function pct(raw: number, max: number): number {
  return max > 0 ? Math.round((raw / max) * 100) : 0;
}

function scoreWithItems(
  items: TciItem[],
  answers: Record<string, number>,
): TciScore[] {
  const dimSums = emptyAccum();
  const subSums: Record<string, Accum> = {};

  for (const item of items) {
    const v = answers[item.id];
    if (typeof v !== "number") continue;
    const value = item.reverse ? 6 - v : v;
    dimSums[item.dimension].sum += value;
    dimSums[item.dimension].count += 1;
    if (item.subscale) {
      const acc = (subSums[item.subscale] ??= { sum: 0, count: 0 });
      acc.sum += value;
      acc.count += 1;
    }
  }

  // 차원별 하위척도 그룹화. 코드 정렬(NS1, NS2…)로 안정성 보장.
  const subsByDim: Record<TciDimension, TciSubscaleScore[]> = {
    NS: [], HA: [], RD: [], PS: [], SD: [], CO: [], ST: [],
  };
  for (const code of Object.keys(subSums).sort()) {
    const meta = getSubscaleMeta(code);
    if (!meta) continue;
    const { sum, count } = subSums[code];
    subsByDim[meta.dimension].push({
      code,
      label: meta.label,
      description: meta.description,
      raw: sum,
      max: count * 5,
      percent: pct(sum, count * 5),
    });
  }

  return (Object.keys(TCI_DIMENSIONS) as TciDimension[]).map((dim) => {
    const { sum, count } = dimSums[dim];
    const max = count * 5;
    const subscales = subsByDim[dim];
    return {
      dimension: dim,
      label: TCI_DIMENSIONS[dim].label,
      description: TCI_DIMENSIONS[dim].description,
      raw: sum,
      max,
      percent: pct(sum, max),
      ...(subscales.length > 0 ? { subscales } : {}),
    };
  });
}

/** variant 기반 비동기 채점. 확장판은 하위척도 점수까지 함께 계산. */
export async function scoreTciByVariant(
  variant: TciVariant,
  answers: Record<string, number>,
): Promise<TciScore[]> {
  const items = await getItemsForScoring(variant);
  return scoreWithItems(items, answers);
}

/**
 * AI 프롬프트용 점수 포맷.
 * - 약식: `- 추진성 (NS): 18/25 (72%) — ...`
 * - 확장: 차원 라인 + 들여쓴 하위척도 라인
 */
export function formatScoresForPrompt(scores: TciScore[]): string {
  const lines: string[] = [];
  for (const s of scores) {
    lines.push(`- ${s.label} (${s.dimension}): ${s.raw}/${s.max} (${s.percent}%) — ${s.description}`);
    if (s.subscales && s.subscales.length > 0) {
      for (const sub of s.subscales) {
        lines.push(`    · ${sub.code} ${sub.label}: ${sub.raw}/${sub.max} (${sub.percent}%) — ${sub.description}`);
      }
    }
  }
  return lines.join("\n");
}
