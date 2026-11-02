import {
  FUSION_ACTION_CATEGORIES,
  normalizeSuggestedActions,
} from "@/lib/report/actions";
import type { SuggestedAction } from "@/lib/store/types";
import {
  FUSION_SECTION_TITLES,
  MAX_BODY_CHARS_NO_SPACE,
  MIN_BODY_CHARS_NO_SPACE,
  validateFusionReportQuality,
} from "./reportQuality";
import { LEGACY_FUSION_SECTION_TITLES } from "./reportContract";

export type ParsedFusionReportOutput = {
  report: string;
  actions: SuggestedAction[];
  flexibility?: number;
  /** 맨 첫 줄 HEADLINE= 리더에서 뽑은 대표 한마디. 없으면 undefined(렌더가 코드 폴백). */
  headline?: string;
  errors: string[];
  warnings: string[];
};

// v31은 ACTIONS만 쓴다. 과거 FLEX+ACTIONS는 명시적 이전 형식 검사에서만 허용한다.
const FUSION_TRAILER = /(?:^|\n)[ \t]*(?:FLEX\s*=\s*(\d{1,3})[ \t]*\n[ \t]*)?ACTIONS\s*=\s*(\[[^\n]*\])[ \t]*$/;
// 본문 맨 앞에 오는 대표 한마디 리더. FLEX/ACTIONS 트레일러와 대칭. 없어도 실패 아님(코드 폴백).
const FUSION_HEADLINE = /^[ \t]*HEADLINE\s*=\s*(.+?)[ \t]*(?:\n|$)/;

export function parseFusionReportOutput(rawInput: string, options: { allowLegacy?: boolean } = {}): ParsedFusionReportOutput {
  const errors: string[] = [];
  // 모델이 끝에 개행/공백을 붙이면 FLEX/ACTIONS 트레일러의 `$` 매칭이 깨진다 — 먼저 잘라낸다.
  const raw = rawInput.replace(/\s+$/, "");
  const trailerMatch = raw.match(FUSION_TRAILER);
  const flexibility = trailerMatch?.[1] != null ? Number(trailerMatch[1]) : undefined;
  let report = trailerMatch && typeof trailerMatch.index === "number"
    ? raw.slice(0, trailerMatch.index).trimEnd()
    : raw.trimEnd();

  // 맨 첫 줄 HEADLINE= 리더(대표 한마디)를 떼어내 본문과 분리한다. 없으면 undefined.
  let headline: string | undefined;
  const headMatch = report.match(FUSION_HEADLINE);
  if (headMatch) {
    headline = headMatch[1].trim();
    report = report.slice(headMatch[0].length).replace(/^\s+/, "");
  }

  let actions: SuggestedAction[] = [];

  if (!trailerMatch) {
    errors.push("마지막 줄 ACTIONS 형식 오류");
  } else {
    try {
      const rawActions = JSON.parse(trailerMatch[2]) as unknown;
      if (!Array.isArray(rawActions) || rawActions.length !== 3) {
        errors.push("ACTIONS 배열 길이 오류: 정확히 3개 필요");
      }
      actions = normalizeSuggestedActions(rawActions, 3, {
        requireStructured: true,
        requiredCategories: FUSION_ACTION_CATEGORIES,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`ACTIONS JSON 파싱 실패: ${message}`);
    }
  }

  const quality = validateFusionReportQuality({
    report,
    actions,
    flexibility,
    format: options.allowLegacy && report.trimStart().startsWith(LEGACY_FUSION_SECTION_TITLES[0]) ? "legacy" : "final",
  });
  errors.push(...quality.errors);

  return {
    report,
    actions,
    flexibility,
    headline,
    errors,
    warnings: quality.warnings,
  };
}

export function buildFusionRepairPrompt(basePrompt: string, errors: string[]): string {
  const errorList = errors.map((error) => `- ${error}`).join("\n");
  return `${basePrompt}

[재생성 지시 — 이전 출력 품질 검증 실패]
아래 오류를 모두 고친 최종본만 다시 출력해라. 사과, 설명, 코드블록은 쓰지 않는다.
${errorList}

본문은 빈/잘린 출력이 아니도록 공백 제외 ${MIN_BODY_CHARS_NO_SPACE}자 이상, 최대 ${MAX_BODY_CHARS_NO_SPACE}자로 쓰고(${FUSION_SECTION_TITLES.length}개 섹션 전부), 입력에 없는 장면을 만들어 분량을 채우지 마라. 마지막 한 줄은 ACTIONS=[...]다. 미측정 유연성 정수인 FLEX는 출력하지 않는다. 본문에는 FLEX= 또는 ACTIONS=를 쓰지 마라.`;
}
