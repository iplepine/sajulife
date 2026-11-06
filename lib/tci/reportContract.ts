import { findRepeatedParagraphs } from "../report/contentChecks";
import { parsePersonalReport } from "../report/types";

export const TCI_REPORT_SECTION_IDS = [
  "기본 성향", "여덟 결 기질분석", "인간은 같은 실수를 반복하지", "스트레스 시나리오",
  "대인관계", "직무·진로", "성장 과제", "코칭 액션플랜",
] as const;

/** Only check new generations; existing saved JSON still uses the read parser. */
export function parseNewTciReport(text: string) {
  const report = parsePersonalReport(text);
  if (!report || report.sections.length !== TCI_REPORT_SECTION_IDS.length ||
      !TCI_REPORT_SECTION_IDS.every((id, index) => {
        const section = report.sections[index];
        return section?.id === id &&
          typeof section.summary === "string" && Boolean(section.summary.trim()) &&
          typeof section.body === "string" && Boolean(section.body.trim());
      })) return null;
  if (findRepeatedParagraphs(report.sections.map(section => ({ title: section.id, body: section.body }))).length) return null;
  return report;
}
