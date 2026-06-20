import { REPORT_LABEL } from "@/lib/share/labels";
import { readJson, writeJson } from "./kv";
import { userConsultBasisKey } from "./keys";
import type { ConsultBasisDoc, ConsultBasisSection, ReportKind } from "./types";

/**
 * 상담 근거(요약 모음) 저장소 — 순수 KV 레이어 (AI 호출 없음).
 * 요약 생성은 lib/consult/summarize.ts가 맡고, 여기선 읽기/쓰기/렌더만 한다.
 */

/** 컨텍스트에 합칠 때의 섹션 노출 순서 — 풍부한 융합부터. */
const SECTION_ORDER: ReportKind[] = ["fusion", "personal", "tci", "family"];

const EMPTY: ConsultBasisDoc = { sections: {}, updatedAt: "" };

export async function getConsultBasis(userId: string): Promise<ConsultBasisDoc> {
  return readJson<ConsultBasisDoc>(userConsultBasisKey(userId), EMPTY);
}

/**
 * 섹션 여러 건을 한 번에 병합 저장 (read-modify-write).
 * 같은 kind는 덮어쓴다. 빈 배열이면 아무것도 안 한다.
 */
export async function putConsultBasisSections(
  userId: string,
  sections: ConsultBasisSection[],
): Promise<void> {
  if (sections.length === 0) return;
  const doc = await getConsultBasis(userId);
  const next: ConsultBasisDoc = {
    sections: { ...doc.sections },
    updatedAt: new Date().toISOString(),
  };
  for (const s of sections) next.sections[s.kind] = s;
  await writeJson(userConsultBasisKey(userId), next);
}

/** 존재하는 섹션의 리포트 종류들 (노출 순서대로). */
export function consultBasisSources(doc: ConsultBasisDoc): ReportKind[] {
  return SECTION_ORDER.filter((k) => doc.sections[k]);
}

/**
 * 상담 프롬프트의 contextBlock으로 쓸 텍스트.
 * 존재하는 섹션을 라벨 헤더와 함께 이어붙인다. 없으면 빈 문자열.
 */
export function formatConsultBasisForPrompt(doc: ConsultBasisDoc): string {
  const blocks = consultBasisSources(doc).map((kind) => {
    const summary = doc.sections[kind]!.summary.trim();
    return `[${REPORT_LABEL[kind]} 요약]\n${summary}`;
  });
  return blocks.join("\n\n");
}
