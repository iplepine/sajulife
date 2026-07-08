// 리포트 품질 게이트 (개인·가족·기질 JSON 리포트 공용).
// ★융합 리포트가 이미 가진 검증+자가교정 패턴을 나머지 3종으로 통일★한다.
// 융합은 텍스트 포맷이라 자체 검증기([lib/fusion/reportQuality.ts])를 유지하고,
// 여기서는 JSON 리포트(구조는 스키마가 보장)의 '사용자에게 보이는 본문'을 스캔한다.
//
// 규칙은 리포트 종류마다 다르다(CLAUDE.md 톤 체계):
//   - 가족: 한자 전면 금지(자연어 메타포만)
//   - 개인·기질: 한자는 괄호 풀이로 허용 → 한자 자체는 막지 않음
//   - 공통: TCI 내부 코드/옛 임상용어/시스템 트레일러(FLEX=·ACTIONS=) 노출 금지, 최소 분량

export type ReportQualityKind = "personal" | "family" | "tci";

export type ReportQualityResult = {
  ok: boolean;
  /** 자가교정(리페어 재생성)을 유발하는 결함. */
  errors: string[];
  /** 비차단 경고(로깅용). */
  warnings: string[];
};

/** 한자(CJK 통합 한자) — 가족 리포트에서만 금지. */
const HANJA = /[㐀-䶿一-鿿]/;
/** TCI 7차원 내부 채점 코드 — 어떤 리포트 본문에도 노출 금지. */
const TCI_CODE = /\b(?:NS|HA|RD|PS|SD|CO|ST)\d*\b/;
/** 옛 임상 용어 — 재명명 전 용어라 노출 금지. */
const OLD_CLINICAL = /자극추구|위험회피|보상의존|인내력|자율성|연대감|자기초월/;
/** 화면에서 떼어내는 시스템 트레일러가 본문에 새어 나온 경우. */
const SYSTEM_TRAILER = /\b(?:FLEX|ACTIONS)\s*=/;

type Rule = { banHanja: boolean; minChars: number };

// minChars는 '공백 제외' 기준. 이 리포트들은 다중 섹션이라 완성본은 수천 자다 —
// 임계값은 '진짜 잘린/빈 본문'만 걸리도록 넉넉히 낮게 둬 불필요한 리페어를 막는다.
const RULES: Record<ReportQualityKind, Rule> = {
  personal: { banHanja: false, minChars: 1500 },
  family: { banHanja: true, minChars: 1200 },
  tci: { banHanja: false, minChars: 1200 },
};

/**
 * JSON 리포트(파싱된 객체)의 모든 문자열 값을 이어붙여 '사용자에게 보이는 본문'을 만든다.
 * 숫자·불리언(예: flexibility)은 건너뛴다. 섹션 제목/요약/본문/키워드가 모두 포함된다.
 */
export function extractVisibleText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractVisibleText).join("\n");
  if (node && typeof node === "object") {
    return Object.values(node as Record<string, unknown>).map(extractVisibleText).join("\n");
  }
  return "";
}

function compactLength(text: string): number {
  return text.replace(/\s/g, "").length;
}

/** 리포트 종류별 규칙으로 본문 텍스트를 검증한다. */
export function validateReportQuality(kind: ReportQualityKind, text: string): ReportQualityResult {
  const rule = RULES[kind];
  const errors: string[] = [];
  const warnings: string[] = [];

  const len = compactLength(text);
  if (len < rule.minChars) {
    errors.push(`본문 분량 부족: 공백 제외 ${len}자 (최소 ${rule.minChars}자)`);
  }
  if (rule.banHanja && HANJA.test(text)) {
    errors.push("한자 노출 (가족 리포트는 자연어 메타포만)");
  }
  if (TCI_CODE.test(text)) {
    errors.push("TCI 내부 코드 노출 (NS/HA/RD/PS/SD/CO/ST)");
  }
  if (OLD_CLINICAL.test(text)) {
    errors.push("옛 임상용어 노출");
  }
  if (SYSTEM_TRAILER.test(text)) {
    errors.push("본문 내 시스템 트레일러(FLEX=/ACTIONS=) 노출");
  }

  return { ok: errors.length === 0, errors, warnings };
}
