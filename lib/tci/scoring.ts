import { TCI_DIMENSIONS, TCI_ITEMS, type TciDimension } from "./questions";

export type TciScore = {
  dimension: TciDimension;
  label: string;
  description: string;
  raw: number;
  max: number;
  percent: number;
};

export function scoreTci(answers: Record<string, number>): TciScore[] {
  const sums: Record<TciDimension, { sum: number; count: number }> = {
    NS: { sum: 0, count: 0 },
    HA: { sum: 0, count: 0 },
    RD: { sum: 0, count: 0 },
    PS: { sum: 0, count: 0 },
    SD: { sum: 0, count: 0 },
    CO: { sum: 0, count: 0 },
    ST: { sum: 0, count: 0 },
  };

  for (const item of TCI_ITEMS) {
    const v = answers[item.id];
    if (typeof v !== "number") continue;
    const value = item.reverse ? 6 - v : v;
    sums[item.dimension].sum += value;
    sums[item.dimension].count += 1;
  }

  return (Object.keys(TCI_DIMENSIONS) as TciDimension[]).map((dim) => {
    const { sum, count } = sums[dim];
    const max = count * 5;
    const percent = max > 0 ? Math.round((sum / max) * 100) : 0;
    return {
      dimension: dim,
      label: TCI_DIMENSIONS[dim].label,
      description: TCI_DIMENSIONS[dim].description,
      raw: sum,
      max,
      percent,
    };
  });
}

export function formatScoresForPrompt(scores: TciScore[]): string {
  return scores
    .map(
      (s) =>
        `- ${s.label} (${s.dimension}): ${s.raw}/${s.max} (${s.percent}%) — ${s.description}`,
    )
    .join("\n");
}
