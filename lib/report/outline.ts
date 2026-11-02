import { normalizeReport, REPORT_FIELD_LABELS, ROADMAP_FIELD_ORDER } from "./normalize";
import type { PersonalReport } from "./types";

export type ReportOutline = { title: string; summary: string; sections: Array<{ title: string }> };

const PERSONAL_SECTION_TITLES: Record<string, string> = {
  타고난기질과성격: "타고난 기질과 성격", 강점과잠재력: "강점과 잠재력", 인생의큰흐름: "인생의 큰 흐름",
  조후분석: "조후 분석 · 건강 및 환경", 격국분석: "격국 분석 · 적성 및 그릇", 억부분석: "억부 분석 · 수행능력",
  세운분석: "세운 분석 · 작년과 올해, 내년", 필요한것: "필요한 것", 행동지침: "행동지침", 인생로드맵: "인생 로드맵", 성공조언: "성공 조언",
  오행구성: "타고난 기운 배합", 기본성향: "너라는 사람", 직업운: "일이 풀리는 자리", 금전운: "돈이 붙고 새는 자리",
  인간관계운: "사람과 부딪히는 자리", 건강운: "몸이 먼저 아는 것", 대운: "인생의 계절", 평생실행전략: "길게 보는 판",
  올해실행전략: "올해 남은 판", 성격기질및잠재력: "타고난 잠재력", 직업적성및비즈니스: "일이 풀리는 자리",
  인간관계및평판: "사람과 부딪히는 자리", 가정및파트너십: "가족·짝과의 자리", 신체및멘탈관리: "몸이 먼저 아는 것",
  장기적운의흐름: "인생의 계절", 연간실행전략: "올해 남은 판", 성장에너지와행동지침: "채워야 할 기운",
  인생로드맵요약: "한눈에 보는 흐름", 조심할달: "조심할 시기", 주의가필요한시기: "조심할 시기", lifeline: "시기별 흐름", Lifeline: "시기별 흐름",
};

export function normalizedPersonalSectionId(section: { id: string }): string {
  return section.id.replace(/\s+/g, "").trim();
}

export function displayPersonalSectionTitle(section: { id: string }): string {
  return PERSONAL_SECTION_TITLES[normalizedPersonalSectionId(section)] ?? section.id;
}

export function hasPersonalDayunSection(report: PersonalReport): boolean {
  return report.sections.some(section => ["대운", "장기적운의흐름", "인생의큰흐름"].includes(normalizedPersonalSectionId(section)));
}

export function personalOutlineExtras(report: PersonalReport): { appendDayun: boolean; appendRoadmap: boolean } {
  return {
    appendDayun: !hasPersonalDayunSection(report) && !!report.lifeline?.length,
    appendRoadmap: !report.sections.some(section => normalizedPersonalSectionId(section) === "인생로드맵") &&
      ROADMAP_FIELD_ORDER.some(key => typeof report.roadmap?.[key] === "string" && report.roadmap[key].trim().length > 0),
  };
}

/** Shared with the text renderer: a bracket heading's trailing copy belongs to its body. */
export function splitReportHeading(full: string): { title: string; lead: string } {
  const split = full.match(/^(.{2,30}?\])\s+(.+)$/);
  return split ? { title: split[1], lead: split[2] } : { title: full, lead: "" };
}

function firstParagraph(text: string): string {
  return text.split(/\n\s*\n/).map(part => part.trim()).find(Boolean)?.replace(/^[●◆◇•·▸]\s*/, "") ?? "";
}

/** Read-only outline. It never rewrites saved text or fabricates an interpretation. */
export function getReportOutline(text: string): ReportOutline {
  const normalized = normalizeReport(text);
  if (normalized.kind === "personal") {
    const report = normalized.report;
    const extras = personalOutlineExtras(report);
    return {
      title: report.title,
      summary: report.sections[0]?.summary || firstParagraph(report.sections[0]?.body ?? ""),
      sections: [
        ...report.sections.map(section => ({ title: displayPersonalSectionTitle(section) })),
        ...(extras.appendDayun ? [{ title: "인생의 계절" }] : []),
        ...(extras.appendRoadmap ? [{ title: REPORT_FIELD_LABELS.roadmap }] : []),
      ],
    };
  }
  if (normalized.kind === "family") {
    return { title: normalized.report.title, summary: normalized.report.sections[0]?.summary ?? "", sections: normalized.report.sections.map(section => ({ title: section.id })) };
  }
  if (normalized.kind === "labeled") {
    return { title: "", summary: normalized.entries[0]?.paragraphs[0] ?? "", sections: normalized.entries.map(entry => ({ title: entry.label || "풀이 본문" })) };
  }
  let firstLead = "";
  let hasHeading = false;
  const sections = normalized.text.split("\n").flatMap(line => {
    const match = line.trim().match(/^▣\s*(.+)$/);
    if (!match) return [];
    const heading = splitReportHeading(match[1].trim());
    if (!hasHeading) firstLead = heading.lead;
    hasHeading = true;
    return [{ title: heading.title }];
  });
  const firstHeader = normalized.text.search(/^\s*▣\s*.+$/m);
  const body = firstHeader >= 0 ? normalized.text.slice(firstHeader).split("\n").slice(1).join("\n").split(/^\s*▣/m)[0] : normalized.text;
  return { title: "", summary: firstLead || firstParagraph(body), sections: sections.length ? sections : [{ title: "풀이 본문" }] };
}
