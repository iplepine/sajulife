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
  /** 맨 첫 줄 HEADLINE= 리더에서 뽑은 대표 한마디. 없으면 undefined(렌더가 코드 폴백). */
  headline?: string;
  errors: string[];
  warnings: string[];
};

const FUSION_TRAILER = /(?:^|\n)[ \t]*FLEX\s*=\s*(\d{1,3})[ \t]*\n[ \t]*ACTIONS\s*=\s*(\[[^\n]*\])[ \t]*$/;
// 본문 맨 앞에 오는 대표 한마디 리더. FLEX/ACTIONS 트레일러와 대칭. 없어도 실패 아님(코드 폴백).
const FUSION_HEADLINE = /^[ \t]*HEADLINE\s*=\s*(.+?)[ \t]*(?:\n|$)/;

export function parseFusionReportOutput(rawInput: string): ParsedFusionReportOutput {
  const errors: string[] = [];
  // 모델이 끝에 개행/공백을 붙이면 FLEX/ACTIONS 트레일러의 `$` 매칭이 깨진다 — 먼저 잘라낸다.
  const raw = rawInput.replace(/\s+$/, "");
  const trailerMatch = raw.match(FUSION_TRAILER);
  const flexibility = trailerMatch ? Number(trailerMatch[1]) : undefined;
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

특히 본문은 공백 제외 8000~10000자로 맞추고(9개 섹션 전부 채워서), 마지막 두 줄은 반드시 FLEX=NN 다음 ACTIONS=[...] 순서로 둬라. 본문에는 FLEX= 또는 ACTIONS=를 쓰지 마라.`;
}
