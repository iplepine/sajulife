import assert from "node:assert/strict";
import test from "node:test";
import { getReportOutline, personalOutlineExtras, splitReportHeading } from "./outline";
import { normalizeReport } from "./normalize";

test("folio outline reads current sections and does not append duplicate lifeline or roadmap", () => {
  const saved = JSON.stringify({ title: "깊이 읽는 사람", sections: [
    { id: "타고난 기질과 성격", summary: "저장된 핵심 요약", body: "첫 본문" },
    { id: "인생의 큰 흐름", summary: "큰 흐름", body: "흐름 본문" },
    { id: "인생 로드맵", summary: "로드맵", body: "방향 본문" },
  ], lifeline: [{ startAge: 31, endAge: 40, summary: "시기 본문" }], roadmap: { character: "서술" } });
  const outline = getReportOutline(saved);
  assert.equal(outline.title, "깊이 읽는 사람");
  assert.equal(outline.summary, "저장된 핵심 요약");
  assert.deepEqual(outline.sections.map(s => s.title), ["타고난 기질과 성격", "인생의 큰 흐름", "인생 로드맵"]);
});

test("folio outline includes legacy personal appendices in renderer order", () => {
  const saved = JSON.stringify({ title: "옛 개인 풀이", sections: {
    기본성향: { body: "첫 본문" }, 직업운: "일 본문",
  }, lifeline: [{ startAge: 31, endAge: 40, summary: "옛 시기" }], roadmap: { direction: "방향" } });
  const outline = getReportOutline(saved);
  assert.deepEqual(outline.sections.map(s => s.title), ["너라는 사람", "일이 풀리는 자리", "인생의 계절", "한눈에 보는 흐름"]);
  const normalized = normalizeReport(saved);
  assert.equal(normalized.kind, "personal");
  if (normalized.kind === "personal") assert.deepEqual(personalOutlineExtras(normalized.report), { appendDayun: true, appendRoadmap: true });
});

test("new and legacy text headings share the rendering split without inventing replacement titles", () => {
  const saved = "▣ 나를 읽는 핵심 요약\n\n이것은 저장된 본문입니다.\n\n▣ 다섯 가지 힘의 조합\n\n두번째 본문";
  assert.deepEqual(getReportOutline(saved), { title: "", summary: "이것은 저장된 본문입니다.", sections: [{ title: "나를 읽는 핵심 요약" }, { title: "다섯 가지 힘의 조합" }] });
  const legacy = "▣ 1. [기본성향] 한 문장 요약\n● 핵심: 첫 본문\n▣ 2. [직업운] 또 다른 요약\n둘째 본문";
  assert.deepEqual(getReportOutline(legacy).sections.map(s => s.title), ["1. [기본성향]", "2. [직업운]"]);
  assert.equal(getReportOutline(legacy).summary, "한 문장 요약");
  assert.deepEqual(splitReportHeading("1. [기본성향] 한 문장 요약"), { title: "1. [기본성향]", lead: "한 문장 요약" });
});

test("unstructured and unknown JSON content stays reachable without raw field names", () => {
  assert.deepEqual(getReportOutline("저장된 짧은 본문"), { title: "", summary: "저장된 짧은 본문", sections: [{ title: "풀이 본문" }] });
  const outline = getReportOutline(JSON.stringify({ unknownProperty: "알 수 없는 형식의 본문", roadmap: { direction: "내용 보존" } }));
  assert.deepEqual(outline.sections.map(s => s.title), ["풀이 본문", "한눈에 보는 흐름"]);
  assert.equal(outline.summary, "알 수 없는 형식의 본문");
  assert.equal(JSON.stringify(outline).includes("unknownProperty"), false);
});

test("code fenced report uses the same normalized shape as the body", () => {
  const saved = '```json\n{"title":"개인 표제","sections":[{"id":"조후분석","body":"실제 저장 본문"}],"roadmap":{}}\n```';
  assert.deepEqual(getReportOutline(saved).sections.map(s => s.title), ["조후 분석 · 건강 및 환경"]);
  assert.equal(getReportOutline(saved).summary, "실제 저장 본문");
});
