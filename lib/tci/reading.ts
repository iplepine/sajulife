import { TCI_DIMENSIONS, type TciDimension } from "./questions";
import type { TciScore } from "./scoring";

export type SavedTciReading = {
  report: string;
  generatedAt: string;
  meta?: { scores?: unknown; flexibility?: unknown };
};

export type TciReadingResponse = {
  saved: SavedTciReading | null;
  scores?: unknown;
  readiness: { hasTci: boolean; tciAnswered?: number; tciTotal?: number };
  status: "idle" | "generating" | "error";
  error?: string;
};

/** Missing/duplicate/invalid axes are not zero scores. Metadata from old reports is untrusted. */
export function completeTciScores(value: unknown): TciScore[] {
  if (!Array.isArray(value) || value.length !== 7) return [];
  const scores = new Map<TciDimension, TciScore>();
  for (const item of value) {
    if (!item || typeof item !== "object" || typeof item.dimension !== "string" || !Object.hasOwn(TCI_DIMENSIONS, item.dimension) ||
        typeof item.percent !== "number" || !Number.isFinite(item.percent) || item.percent < 0 || item.percent > 100 || scores.has(item.dimension)) return [];
    const dimension = item.dimension as TciDimension;
    scores.set(dimension, {
      dimension, ...TCI_DIMENSIONS[dimension], percent: item.percent,
      raw: typeof item.raw === "number" ? item.raw : 0,
      max: typeof item.max === "number" ? item.max : 0,
      ...(Array.isArray(item.subscales) ? { subscales: item.subscales.filter((sub: unknown) => {
        if (!sub || typeof sub !== "object") return false;
        const s = sub as Record<string, unknown>;
        return typeof s.code === "string" && typeof s.label === "string" && typeof s.description === "string" &&
          typeof s.percent === "number" && Number.isFinite(s.percent) && s.percent >= 0 && s.percent <= 100;
      }) } : {}),
    });
  }
  return (Object.keys(TCI_DIMENSIONS) as TciDimension[]).map(dimension => scores.get(dimension)!);
}

/** Saved prose and its chart must stay together; never attach a newer response chart to old prose. */
export function tciReadingView(data: TciReadingResponse) {
  const scores = completeTciScores(data.readiness.hasTci ? data.scores : null);
  const savedScores = completeTciScores(data.saved?.meta?.scores);
  const value = data.saved?.meta?.flexibility;
  const flexibility = typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
  return { scores, savedScores, flexibility, complete: data.readiness.hasTci, saved: data.saved };
}
