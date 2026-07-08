// 구조화(JSON) 리포트 생성 + 품질 게이트 + 1회 자가교정 공용 헬퍼.
// ★개인·가족·기질 라우트가 공유★ — 융합의 generateFusionWithRepair와 같은 흐름을 JSON 리포트에 적용한다.
//
// 흐름: 생성 → 파싱(구조) + 품질검증 → 결함이 있으면 리페어 프롬프트로 1회 재생성 → 재파싱/재검증.
// 반환값의 판단은 호출부(라우트) 몫이다:
//   - parsed === null  → 구조가 끝내 안 잡힘. 라우트가 throw(하드 실패, 기존 동작과 동일).
//   - quality.errors   → 리페어 후에도 남은 품질 잔여. 라우트는 로깅하고 저장(fail-open)한다.
import type { AIGenerateOptions, AIProvider } from "@/lib/ai";
import {
  extractVisibleText,
  validateReportQuality,
  type ReportQualityKind,
  type ReportQualityResult,
} from "./quality";
import { buildStructuredRepairPrompt } from "./repair";

export type StructuredReportGeneration<T> = {
  /** 최종 원본 응답 문자열(리페어됐다면 리페어본). 저장·액션추출·상담근거에 그대로 쓴다. */
  report: string;
  /** 파싱 결과. 구조가 안 잡히면 null. */
  parsed: T | null;
  quality: ReportQualityResult;
  /** 리페어 재생성이 한 번 돌았는지. */
  repaired: boolean;
};

function evaluate<T>(kind: ReportQualityKind, parsed: T | null): ReportQualityResult {
  if (!parsed) return { ok: false, errors: ["리포트 JSON 구조가 완성되지 않음"], warnings: [] };
  return validateReportQuality(kind, extractVisibleText(parsed));
}

export async function generateStructuredReportWithRepair<T>(params: {
  ai: AIProvider;
  rendered: string;
  opts: AIGenerateOptions;
  kind: ReportQualityKind;
  /** 원본 문자열 → 구조 파싱. 실패/불완전이면 null을 돌려줄 것(가족의 sections 비었을 때 등 포함). */
  parse: (raw: string) => T | null;
}): Promise<StructuredReportGeneration<T>> {
  const { ai, rendered, opts, kind, parse } = params;

  let report = await ai.generate(rendered, opts);
  let parsed = parse(report);
  let quality = evaluate(kind, parsed);

  if (!parsed || quality.errors.length > 0) {
    // 리페어는 살짝 낮은 온도로 — 형식/제약을 더 얌전히 따르게.
    const repairOpts: AIGenerateOptions = {
      ...opts,
      temperature:
        typeof opts.temperature === "number" ? Math.max(0.35, opts.temperature - 0.2) : opts.temperature,
    };
    report = await ai.generate(buildStructuredRepairPrompt(rendered, quality.errors), repairOpts);
    parsed = parse(report);
    quality = evaluate(kind, parsed);
    return { report, parsed, quality, repaired: true };
  }

  return { report, parsed, quality, repaired: false };
}
