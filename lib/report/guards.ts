import type { SavedReport } from "@/lib/store/types";

const TRANSIENT_AI_ERROR_PATTERNS = [
  /AI\s*호출\s*실패/i,
  /응답\s*생성\s*실패/i,
  /got status:\s*(429|5\d\d)/i,
  /Service Unavailable/i,
  /UNAVAILABLE/i,
  /RESOURCE_EXHAUSTED/i,
  /high demand/i,
  /try again later/i,
];

export function isReportGenerationFailure(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  if (TRANSIENT_AI_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { error?: unknown; title?: unknown; sections?: unknown };
      return !!parsed.error && typeof parsed.title !== "string" && !Array.isArray(parsed.sections);
    } catch {
      return false;
    }
  }

  return false;
}

export function isInvalidSavedReport(saved: SavedReport | null): boolean {
  return !saved || isReportGenerationFailure(saved.report);
}
