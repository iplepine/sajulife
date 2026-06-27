import type { SuggestedAction } from "@/lib/store/types";

/**
 * 리포트가 함께 내보내는 코칭 액션 후보를 정규화/추출하는 헬퍼 (클라이언트 안전 — node 의존성 없음).
 *
 * 두 경로를 지원한다:
 * 1) JSON 리포트(개인·가족) — responseSchema의 actionPlan 배열 → actionsFromReportJson
 * 2) 텍스트 리포트(기질·융합·상담) — 본문 끝 "ACTIONS=[...]" 트레일러 한 줄 → stripActionsTrailer
 *    (FLEX=NN과 같은 패턴: 화면엔 안 보이게 떼어내 코칭 플랜으로만 쓴다.)
 */

/** 허용 시점 라벨. AI가 다른 값을 주면 가장 가까운 것으로 보정한다. */
export const ACTION_TIMEFRAMES = ["오늘", "이번 주", "이번 달"] as const;
export const FUSION_ACTION_CATEGORIES = ["잘 풀리는 힘 활용", "꼬임 차단", "가까운 시기 대비"] as const;

const STRUCTURED_ACTION_FIELDS = [
  "category",
  "trigger",
  "exactAction",
  "timeLimit",
  "doneCriteria",
  "artifact",
  "blockedLoop",
] as const;

type StructuredActionField = (typeof STRUCTURED_ACTION_FIELDS)[number];

type NormalizeActionOptions = {
  requireStructured?: boolean;
  requiredCategories?: readonly string[];
};

function normalizeTimeframe(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  for (const tf of ACTION_TIMEFRAMES) {
    if (t === tf || t.replace(/\s/g, "") === tf.replace(/\s/g, "")) return tf;
  }
  // 느슨한 매칭: "이번주" / "한 주" / "이달" 류
  if (/오늘|today/i.test(t)) return "오늘";
  if (/주|week/i.test(t)) return "이번 주";
  if (/달|월|month/i.test(t)) return "이번 달";
  return t.slice(0, 12);
}

function pickString(obj: Record<string, unknown>, key: string, max = 80): string {
  const value = obj[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function compactHint(obj: Record<string, unknown>, fallback: string): string | undefined {
  const structured = [
    pickString(obj, "category", 30),
    pickString(obj, "trigger", 48) ? `발동:${pickString(obj, "trigger", 48)}` : "",
    pickString(obj, "exactAction", 56) ? `행동:${pickString(obj, "exactAction", 56)}` : "",
    pickString(obj, "doneCriteria", 48) ? `완료:${pickString(obj, "doneCriteria", 48)}` : "",
  ].filter(Boolean).join(" / ");
  const hint = structured || fallback;
  return hint ? hint.slice(0, 200) : undefined;
}

function pickStructuredFields(obj: Record<string, unknown>): Pick<
  SuggestedAction,
  StructuredActionField
> {
  return {
    category: pickString(obj, "category", 40),
    trigger: pickString(obj, "trigger", 120),
    exactAction: pickString(obj, "exactAction", 160),
    timeLimit: pickString(obj, "timeLimit", 60),
    doneCriteria: pickString(obj, "doneCriteria", 120),
    artifact: pickString(obj, "artifact", 80),
    blockedLoop: pickString(obj, "blockedLoop", 120),
  };
}

function hasRequiredStructuredFields(
  fields: Pick<SuggestedAction, StructuredActionField>,
  requiredCategories?: readonly string[],
): boolean {
  if (!STRUCTURED_ACTION_FIELDS.every((field) => Boolean(fields[field]?.trim()))) return false;
  if (requiredCategories && !requiredCategories.includes(fields.category ?? "")) return false;
  return true;
}

/** 임의 입력을 SuggestedAction[]로 검증·정규화한다(최대 max개). */
export function normalizeSuggestedActions(
  input: unknown,
  max = 3,
  options: NormalizeActionOptions = {},
): SuggestedAction[] {
  if (!Array.isArray(input)) return [];
  const out: SuggestedAction[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    const title = typeof obj.title === "string" ? obj.title.trim() : "";
    if (!title) continue;
    const structured = pickStructuredFields(obj);
    if (options.requireStructured && !hasRequiredStructuredFields(structured, options.requiredCategories)) {
      continue;
    }
    const hintRaw = typeof obj.hint === "string" ? obj.hint.trim() : "";
    out.push({
      title: title.slice(0, 200),
      timeframe: normalizeTimeframe(obj.timeframe),
      ...structured,
      hint: compactHint(obj, hintRaw),
    });
    if (out.length >= max) break;
  }
  return out;
}

/** JSON 리포트 문자열에서 actionPlan을 뽑아 정규화한다. 실패하면 []. */
export function actionsFromReportJson(report: string): SuggestedAction[] {
  const trimmed = report.trim();
  if (!trimmed.startsWith("{")) return [];
  try {
    const obj = JSON.parse(trimmed) as { actionPlan?: unknown };
    return normalizeSuggestedActions(obj.actionPlan);
  } catch {
    return [];
  }
}

const ACTIONS_TRAILER = /(?:^|\n)[ \t]*ACTIONS\s*=\s*(\[[^\n]*\])[ \t]*$/;

/**
 * 텍스트 리포트 본문 끝의 "ACTIONS=[...]" 한 줄을 떼어내고 파싱한다.
 * 트레일러가 없으면 body는 원본 그대로, actions는 [].
 */
export function stripActionsTrailer(raw: string, options: NormalizeActionOptions = {}): {
  body: string;
  actions: SuggestedAction[];
  found: boolean;
  parseError?: string;
} {
  const m = raw.match(ACTIONS_TRAILER);
  if (!m) return { body: raw, actions: [], found: false };
  let actions: SuggestedAction[] = [];
  try {
    actions = normalizeSuggestedActions(JSON.parse(m[1]), 3, options);
  } catch (err) {
    const body = raw.replace(ACTIONS_TRAILER, "").trimEnd();
    const parseError = err instanceof Error ? err.message : String(err);
    return { body, actions: [], found: true, parseError };
  }
  const body = raw.replace(ACTIONS_TRAILER, "").trimEnd();
  return { body, actions, found: true };
}

/** 융합 리포트용 구조화 액션 트레일러. 세 카테고리를 모두 요구한다. */
export function stripFusionActionsTrailer(raw: string): {
  body: string;
  actions: SuggestedAction[];
  found: boolean;
  parseError?: string;
} {
  const result = stripActionsTrailer(raw, {
    requireStructured: true,
    requiredCategories: FUSION_ACTION_CATEGORIES,
  });
  const categories = new Set(result.actions.map((action) => action.category));
  if (!FUSION_ACTION_CATEGORIES.every((category) => categories.has(category))) {
    return { ...result, actions: [] };
  }
  return result;
}
