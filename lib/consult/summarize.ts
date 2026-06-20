import { getAIProvider } from "@/lib/ai";
import { getPrompt } from "@/lib/prompts/store";
import { renderTemplate } from "@/lib/prompts/render";
import { REPORT_LABEL } from "@/lib/share/labels";
import {
  getConsultBasis,
  putConsultBasisSections,
} from "@/lib/store/consultBasis";
import { getSavedReport } from "@/lib/store/reports";
import type { ConsultBasisDoc, ConsultBasisSection, ReportKind } from "@/lib/store/types";

/**
 * 상담 근거 요약 — 리포트 전문을 상담 컨텍스트용 압축 메모로 줄인다.
 *
 * - 생성 경로: 각 리포트 POST가 저장 직후 refreshConsultBasis()를 호출해 해당 종류 섹션을 갱신.
 * - 폴백 경로: 상담 진입 시 ensureConsultBasisFresh()가 (이 기능 이전에 생성됐거나 요약이
 *   실패해) 비어있거나 낡은 섹션을 그 자리에서 다시 채운다.
 * - 요약은 비용·속도를 위해 저가 모델(GEMINI_SUMMARY_MODEL, 기본 flash)로 돌린다.
 * - 요약 실패는 절대 리포트 생성/상담을 막지 않는다 (에러를 삼키고 로그만 남김).
 */

const ALL_KINDS: ReportKind[] = ["personal", "tci", "fusion", "family"];

/** 요약 입력으로 넣는 리포트 본문 최대 길이 (토큰 폭주 방지). */
const MAX_INPUT_CHARS = 16000;

function summaryModel(): string {
  return process.env.GEMINI_SUMMARY_MODEL ?? "gemini-2.5-flash";
}

function clip(text: string): string {
  if (text.length <= MAX_INPUT_CHARS) return text;
  return `${text.slice(0, MAX_INPUT_CHARS)}\n…(이하 생략)`;
}

/** 리포트 1건을 요약 메모로 압축. AI 호출. */
async function summarizeReport(
  kind: ReportKind,
  reportText: string,
): Promise<{ summary: string; model: string }> {
  const prompt = await getPrompt("consult-basis");
  const rendered = renderTemplate(prompt.template, {
    kindLabel: REPORT_LABEL[kind],
    reportContent: clip(reportText),
  });
  const ai = getAIProvider(summaryModel());
  const summary = (await ai.generate(rendered, { temperature: prompt.temperature })).trim();
  return { summary, model: ai.model };
}

/**
 * 한 종류 리포트의 상담 근거 섹션을 갱신한다 (리포트 생성 직후 호출).
 * 실패해도 throw하지 않는다 — 리포트 생성 응답은 그대로 성공해야 한다.
 */
export async function refreshConsultBasis(
  userId: string,
  kind: ReportKind,
  reportText: string,
  sourceGeneratedAt: string,
): Promise<void> {
  try {
    const { summary, model } = await summarizeReport(kind, reportText);
    if (!summary) return;
    await putConsultBasisSections(userId, [
      { kind, summary, sourceGeneratedAt, updatedAt: new Date().toISOString(), model },
    ]);
  } catch (err) {
    console.error(
      `[consult-basis] ${kind} 요약 실패:`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * 상담 진입 시 호출 — 저장된 리포트 대비 근거 섹션이 비었거나 낡았으면 그 자리에서 채운다.
 * 정상 상태(모든 섹션 최신)면 AI 호출 없이 기존 doc을 그대로 돌려준다.
 */
export async function ensureConsultBasisFresh(userId: string): Promise<ConsultBasisDoc> {
  const [doc, saved] = await Promise.all([
    getConsultBasis(userId),
    Promise.all(
      ALL_KINDS.map((kind) => getSavedReport(userId, kind).then((s) => ({ kind, saved: s }))),
    ),
  ]);

  // 저장된 리포트가 있는데 섹션이 없거나 원본이 더 새 것이면 stale.
  const stale = saved.filter(
    ({ kind, saved: s }) => s && doc.sections[kind]?.sourceGeneratedAt !== s.generatedAt,
  );
  if (stale.length === 0) return doc;

  const sections = (
    await Promise.all(
      stale.map(async ({ kind, saved: s }): Promise<ConsultBasisSection | null> => {
        try {
          const { summary, model } = await summarizeReport(kind, s!.report);
          if (!summary) return null;
          return {
            kind,
            summary,
            sourceGeneratedAt: s!.generatedAt,
            updatedAt: new Date().toISOString(),
            model,
          };
        } catch (err) {
          console.error(
            `[consult-basis] ${kind} 백필 요약 실패:`,
            err instanceof Error ? err.message : err,
          );
          return null;
        }
      }),
    )
  ).filter((s): s is ConsultBasisSection => s !== null);

  if (sections.length === 0) return doc;
  await putConsultBasisSections(userId, sections);
  return getConsultBasis(userId);
}
