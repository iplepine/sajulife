import {
  FUSION_ACTION_CATEGORIES,
  normalizeSuggestedActions,
} from "@/lib/report/actions";
import type { SuggestedAction } from "@/lib/store/types";
import { validateFusionReportQuality } from "./reportQuality";

export type ParsedFusionReportOutput = {
  report: string;
  actions: SuggestedAction[];
  flexibility?: number;
  errors: string[];
  warnings: string[];
};

const FUSION_TRAILER = /(?:^|\n)[ \t]*FLEX\s*=\s*(\d{1,3})[ \t]*\n[ \t]*ACTIONS\s*=\s*(\[[^\n]*\])[ \t]*$/;

export function parseFusionReportOutput(raw: string): ParsedFusionReportOutput {
  const errors: string[] = [];
  const trailerMatch = raw.match(FUSION_TRAILER);
  const flexibility = trailerMatch ? Number(trailerMatch[1]) : undefined;
  const report = trailerMatch && typeof trailerMatch.index === "number"
    ? raw.slice(0, trailerMatch.index).trimEnd()
    : raw.trimEnd();
  let actions: SuggestedAction[] = [];

  if (!trailerMatch) {
    errors.push("마지막 두 줄 FLEX/ACTIONS 형식 또는 순서 오류");
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
  });
  errors.push(...quality.errors);

  return {
    report,
    actions,
    flexibility,
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

특히 본문은 공백 제외 5800~7600자로 맞추고, 마지막 두 줄은 반드시 FLEX=NN 다음 ACTIONS=[...] 순서로 둬라. 본문에는 FLEX= 또는 ACTIONS=를 쓰지 마라.`;
}
