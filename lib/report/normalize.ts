import {
  parseFamilyReport,
  parsePersonalReport,
  type DayunReading,
  type FamilyReport,
  type PersonalReport,
  type ReportKeyword,
  type ReportRoadmap,
  type ReportSection,
} from "@/lib/report/types";

/**
 * 저장본 → 화면용 구조 변환 (클라이언트 안전).
 *
 * ★왜 필요한가★ — ReportView는 지금 형식(PersonalReport / FamilyReport JSON)만 알아본다.
 * 그 밖의 저장본은 전부 "텍스트"로 흘러가는데, 저장본이 JSON이면 텍스트 경로가
 * ★JSON 원문을 한 문단으로★ 뱉는다. 그래서 화면에 `roadmap` `actionPlan` `resourceInput`
 * 같은 ★내부 필드명★이 그대로 노출됐다. 사용자는 코드 키를 볼 이유가 없다.
 *
 * ★고치는 방식★ — 저장 데이터의 키를 일괄 변경(마이그레이션)하지 않는다. 옛 저장본을 그대로
 * 두고 ★읽는 순간에만★ 현재 화면 구조로 옮긴다. 새 AI 생성도 하지 않는다.
 *
 * ★안전장치★ — 알아볼 수 없는 JSON이라도 내용을 숨기지 않는다. 아는 키는 한국어 이름을 붙이고,
 * 모르는 키는 ★이름 없이 본문만★ 남긴다(영문 키를 화면에 흘리지 않기 위해).
 */

/** 내부 필드명 → 사용자에게 보여줄 한국어 이름. 화면 어디서든 이 표가 유일한 출처다. */
export const REPORT_FIELD_LABELS: Record<string, string> = {
  // 개인 사주 로드맵
  roadmap: "한눈에 보는 흐름",
  character: "나를 설명하는 한마디",
  resourceInput: "나를 채우는 힘",
  resourceOutput: "강점을 활용하는 방법",
  riskShadow: "반복해서 주의할 점",
  riskTool: "흔들릴 때의 대처법",
  direction: "앞으로의 방향",
  // 공통
  actionPlan: "실천 계획",
  title: "표제",
  keywords: "평생 키워드",
  sections: "본문",
  lifeline: "시기별 흐름",
  disclaimer: "안내",
  // 가족 리포트
  cast: "가족 캐스팅",
  compat: "1대1 케미",
  elementMap: "가족 기운 지도",
  togetherMood: "함께일 때의 분위기",
  cautionScenes: "주의가 필요한 장면",
  rituals: "함께하는 가족 의식",
};

/** 로드맵을 화면에 그릴 때의 항목 순서 — 표의 이름과 1:1. */
export const ROADMAP_FIELD_ORDER: ReadonlyArray<keyof ReportRoadmap> = [
  "character",
  "resourceInput",
  "resourceOutput",
  "riskShadow",
  "riskTool",
  "direction",
];

export type LabeledEntry = { label: string | null; paragraphs: string[] };

export type NormalizedReport =
  | { kind: "personal"; report: PersonalReport }
  | { kind: "family"; report: FamilyReport }
  /** JSON이긴 한데 아는 형식이 아님 — 내용은 살리고 키는 감춘다. */
  | { kind: "labeled"; entries: LabeledEntry[] }
  | { kind: "text"; text: string };

/** ```json … ``` 로 감싸인 저장본을 벗긴다. 옛 응답이 코드펜스째 저장된 경우가 있다. */
export function stripCodeFence(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith("```")) return t;
  return t
    .replace(/^```[a-zA-Z]*\s*\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function firstString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(obj[key]);
    if (value) return value;
  }
  return "";
}

/** 문자열/객체가 섞인 본문 값을 하나의 마커 텍스트로 편다. */
function bodyToText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map((v) => bodyToText(v)).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.entries(obj)
      .map(([key, v]) => {
        const text = bodyToText(v);
        if (!text) return "";
        const label = REPORT_FIELD_LABELS[key];
        // 아는 키만 이름을 붙인다. 모르는 키는 본문만 — 영문 키를 화면에 흘리지 않는다.
        return label ? `● ${label}: ${text}` : text;
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

/** 배열이든 { 섹션이름: 내용 } 맵이든 현재 화면이 아는 ReportSection[]으로 편다. */
function normalizeSections(value: unknown): ReportSection[] {
  const out: ReportSection[] = [];

  const pushFrom = (idHint: string, raw: unknown) => {
    if (typeof raw === "string") {
      const body = raw.trim();
      if (idHint && body) out.push({ id: idHint, summary: "", body });
      return;
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const obj = raw as Record<string, unknown>;
    const id = firstString(obj, ["id", "name", "title", "section"]) || idHint;
    const summary = firstString(obj, ["summary", "lead", "headline", "oneLiner"]);
    const body = bodyToText(obj.body ?? obj.text ?? obj.content ?? obj.detail);
    if (!id && !summary && !body) return;
    out.push({ id: id || "본문", summary, body });
  };

  if (Array.isArray(value)) {
    for (const item of value) pushFrom("", item);
    return out.filter((s) => s.id || s.summary || s.body);
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      // 맵 형태의 키는 대개 한국어 섹션명이다. 영문 키면 표에서 한국어 이름을 찾는다.
      pushFrom(REPORT_FIELD_LABELS[key] ?? key, item);
    }
  }
  return out;
}

function normalizeKeywords(value: unknown): ReportKeyword[] {
  if (!Array.isArray(value)) return [];
  const out: ReportKeyword[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const word = item.trim();
      if (word) out.push({ word, desc: "" });
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const word = firstString(obj, ["word", "keyword", "title"]);
      if (word) out.push({ word, desc: firstString(obj, ["desc", "description", "detail"]) });
    }
  }
  return out;
}

function normalizeRoadmap(value: unknown): ReportRoadmap {
  const empty: ReportRoadmap = {
    character: "",
    resourceInput: "",
    resourceOutput: "",
    riskShadow: "",
    riskTool: "",
    direction: "",
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) return empty;
  const obj = value as Record<string, unknown>;
  return {
    character: asString(obj.character),
    resourceInput: asString(obj.resourceInput),
    resourceOutput: asString(obj.resourceOutput),
    riskShadow: asString(obj.riskShadow),
    riskTool: asString(obj.riskTool),
    direction: asString(obj.direction),
  };
}

function normalizeLifeline(value: unknown): DayunReading[] {
  if (!Array.isArray(value)) return [];
  const out: DayunReading[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const startAge = Number(obj.startAge);
    const endAge = Number(obj.endAge);
    if (!Number.isFinite(startAge) || !Number.isFinite(endAge)) continue;
    out.push({
      startAge,
      endAge,
      season: asString(obj.season),
      seasonLabel: asString(obj.seasonLabel),
      tone: asString(obj.tone),
      summary: asString(obj.summary),
    });
  }
  return out;
}

/** 가족 리포트 특유의 키가 있으면 가족으로 본다. */
function looksLikeFamily(obj: Record<string, unknown>): boolean {
  return ["cast", "compat", "rituals", "elementMap", "togetherMood", "cautionScenes"].some(
    (key) => obj[key] !== undefined,
  );
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  if (!text.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** 알아볼 수 없는 JSON을 "이름 붙은 문단"으로 편다 — 내용을 숨기지 않되 키는 감춘다. */
function toLabeledEntries(obj: Record<string, unknown>): LabeledEntry[] {
  const entries: LabeledEntry[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const text = bodyToText(value);
    if (!text) continue;
    const paragraphs = text
      .split("\n")
      .map((line) => line.replace(/^●\s*/, "").trim())
      .filter(Boolean);
    if (paragraphs.length === 0) continue;
    entries.push({ label: REPORT_FIELD_LABELS[key] ?? null, paragraphs });
  }
  return entries;
}

/**
 * 저장본 문자열을 화면이 아는 모양으로 옮긴다.
 * 현재 형식 → 옛 JSON 형식 → 알 수 없는 JSON → 텍스트 순으로 시도한다.
 */
export function normalizeReport(raw: string): NormalizedReport {
  const text = stripCodeFence(raw ?? "");
  if (!text) return { kind: "text", text: raw ?? "" };

  // 1) 현재 형식이면 손대지 않는다.
  const personal = parsePersonalReport(text);
  if (personal) return { kind: "personal", report: personal };
  const family = parseFamilyReport(text);
  if (family) return { kind: "family", report: family };

  // 2) JSON이긴 한데 형식이 옛것인 경우.
  const obj = parseJsonObject(text);
  if (!obj) return { kind: "text", text };

  const sections = normalizeSections(obj.sections ?? obj.areas ?? obj.chapters);
  const title = firstString(obj, ["title", "headline", "cover"]);

  if (looksLikeFamily(obj)) {
    const rituals = obj.rituals && typeof obj.rituals === "object" ? (obj.rituals as Record<string, unknown>) : {};
    const familyReport: FamilyReport = {
      title: title || "우리 가족 풀이",
      sections,
      actionPlan: Array.isArray(obj.actionPlan)
        ? (obj.actionPlan as FamilyReport["actionPlan"]).filter((a) => a && typeof a === "object")
        : [],
      cast: Array.isArray(obj.cast) ? (obj.cast as FamilyReport["cast"]) : [],
      compat: Array.isArray(obj.compat) ? (obj.compat as FamilyReport["compat"]) : [],
      elementMap: asString(obj.elementMap),
      togetherMood: asString(obj.togetherMood),
      cautionScenes: Array.isArray(obj.cautionScenes) ? (obj.cautionScenes as FamilyReport["cautionScenes"]) : [],
      rituals: {
        today: asString(rituals.today),
        thisWeek: asString(rituals.thisWeek),
        thisMonth: asString(rituals.thisMonth),
      },
      disclaimer: asString(obj.disclaimer),
    };
    if (familyReport.sections.length > 0 || familyReport.cast.length > 0 || familyReport.compat.length > 0) {
      return { kind: "family", report: familyReport };
    }
  }

  if (sections.length > 0) {
    return {
      kind: "personal",
      report: {
        title: title || "내 풀이",
        keywords: normalizeKeywords(obj.keywords),
        sections,
        lifeline: normalizeLifeline(obj.lifeline),
        roadmap: normalizeRoadmap(obj.roadmap),
        disclaimer: asString(obj.disclaimer),
      },
    };
  }

  // 3) 섹션조차 못 찾은 JSON — 내용은 살리고 키는 감춘다.
  const entries = toLabeledEntries(obj);
  return entries.length > 0 ? { kind: "labeled", entries } : { kind: "text", text };
}
