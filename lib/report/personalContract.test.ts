import test from "node:test";
import assert from "node:assert/strict";
import { PERSONAL_REPORT_SECTION_IDS } from "./personalContract";
import { parseNewPersonalReport, parsePersonalReport } from "./types";
import { PERSONAL_REPORT_SCHEMA } from "../saju/reportSchema";
import { PERSONAL_SAJU_TEMPLATE } from "../prompts/personalSaju";
import { renderTemplate } from "../prompts/render";

function fixture() {
  return {
    title: "겨울에 뿌리내린 큰 나무의 방향",
    keywords: ["방향", "지탱", "선택"].map(word => ({ word, desc: `${word}을 돌아볼 수 있습니다.` })),
    sections: PERSONAL_REPORT_SECTION_IDS.map(id => ({
      id, summary: `${id}의 핵심입니다.`, body: `${id}을 제공된 자료로 설명합니다.`,
    })),
    lifeline: [],
    roadmap: {
      character: "깊이 살피는 사람", resourceInput: "배우는 관점", resourceOutput: "표현하는 관점",
      riskShadow: "확인할 부담", riskTool: "범위를 정해보세요.", direction: "선택 기준을 살펴보세요.",
    },
    actionPlan: ["오늘", "이번 주", "이번 달"].map(timeframe => ({ title: "작은 선택을 살펴보세요.", timeframe, hint: "선택 기준" })),
    disclaimer: "사주는 자기 이해를 위한 참고 관점입니다.",
  };
}

test("new personal report has every explicit specimen heading in order", () => {
  const report = parseNewPersonalReport(JSON.stringify(fixture()));
  assert.ok(report);
  assert.deepEqual(report.sections.map(s => s.id), PERSONAL_REPORT_SECTION_IDS);
  assert.equal(PERSONAL_REPORT_SECTION_IDS.length, 11);
});

test("new generation rejects missing, duplicate and reordered sections", () => {
  const missing = fixture();
  missing.sections.pop();
  assert.equal(parseNewPersonalReport(JSON.stringify(missing)), null);
  const duplicate = fixture();
  duplicate.sections[3] = duplicate.sections[2];
  assert.equal(parseNewPersonalReport(JSON.stringify(duplicate)), null);
  const reordered = fixture();
  [reordered.sections[0], reordered.sections[1]] = [reordered.sections[1], reordered.sections[0]];
  assert.equal(parseNewPersonalReport(JSON.stringify(reordered)), null);
});

test("new generation rejects empty and malformed required content", () => {
  const empty = fixture();
  empty.sections[4].body = " ";
  assert.equal(parseNewPersonalReport(JSON.stringify(empty)), null);
  const malformed = fixture() as unknown as { sections: unknown[] };
  malformed.sections[0] = null;
  assert.equal(parseNewPersonalReport(JSON.stringify(malformed)), null);
  const noKeywords = fixture();
  noKeywords.keywords.pop();
  assert.equal(parseNewPersonalReport(JSON.stringify(noKeywords)), null);
  const noRoadmap = fixture();
  noRoadmap.roadmap.direction = "";
  assert.equal(parseNewPersonalReport(JSON.stringify(noRoadmap)), null);
});

test("new personal report covers the three years and each supplied age range", () => {
  const report = fixture();
  const basis = { year: 2026, lifeline: [{ startAge: 7, endAge: 16 }, { startAge: 17, endAge: 26 }] };
  const year = report.sections.find(section => section.id === "세운 분석")!;
  year.body = "2025년을 돌아봐. 2026년의 선택을 점검해. 2027년을 준비해 봐.";
  const lifeline = basis.lifeline.map(range => ({ ...range, summary: "맡을 역할을 천천히 골라 봐." }));
  const candidate = { ...report, lifeline };
  assert.ok(parseNewPersonalReport(JSON.stringify(candidate), basis));
  assert.equal(parseNewPersonalReport(JSON.stringify({ ...candidate, lifeline: lifeline.slice(0, 1) }), basis), null);
  assert.equal(parseNewPersonalReport(JSON.stringify({ ...candidate, lifeline: [...lifeline].reverse() }), basis), null);
  year.body = year.body.replace("2027년을 준비해 봐.", "");
  assert.equal(parseNewPersonalReport(JSON.stringify(candidate), basis), null);
  assert.ok(parsePersonalReport(JSON.stringify(candidate)));
});

test("new personal report rejects copied paragraphs without rewriting a stored report", () => {
  const report = fixture();
  const body = "익힌 것을 결과물로 바꾸는 과정에서 강점이 드러날 수 있어. 실제로 어떤 환경에서 그 강점을 써 왔는지 한번 돌아봐.";
  report.sections[0].body = body;
  report.sections[1].body = body;
  const saved = JSON.stringify(report);
  assert.equal(parseNewPersonalReport(saved), null);
  assert.equal(parsePersonalReport(saved)?.sections[1].body, body);
});

test("stored eight-section reports keep their original headings", () => {
  const old = fixture();
  old.sections = ["오행구성", "기본성향", "직업운", "금전운", "인간관계운", "건강운", "대운", "올해 실행전략"]
    .map(id => ({ id, summary: "기존 요약", body: "기존 본문" })) as typeof old.sections;
  const parsed = parsePersonalReport(JSON.stringify(old));
  assert.ok(parsed);
  assert.equal(parsed.sections.length, 8);
  assert.equal(parsed.sections[7].id, "올해 실행전략");
  assert.equal(parseNewPersonalReport(JSON.stringify(old)), null);
  assert.equal(parsePersonalReport("▣ 예전 텍스트 풀이\n그대로 표시합니다."), null);
});

test("schema and prompt share the explicit heading contract", () => {
  const schemaId = PERSONAL_REPORT_SCHEMA.properties?.sections.items?.properties?.id;
  assert.deepEqual(schemaId?.enum, PERSONAL_REPORT_SECTION_IDS);
  for (const id of PERSONAL_REPORT_SECTION_IDS) assert.ok(PERSONAL_SAJU_TEMPLATE.includes(id));
  assert.ok(PERSONAL_SAJU_TEMPLATE.includes("사주언니·기질오빠처럼 친근하고 차분한 반말"));
  assert.ok(PERSONAL_SAJU_TEMPLATE.includes("질병 발생·건강 회복·사고·수명·이혼을 예언하지"));
  assert.ok(PERSONAL_SAJU_TEMPLATE.includes("{{yearTrioBasis}}"));
  assert.ok(!PERSONAL_SAJU_TEMPLATE.includes("올해 운세는 사주+기질 풀이가 따로 맡는다"));
});

test("offline rendering accepts all existing input variables plus year trio basis", () => {
  const keys = [...PERSONAL_SAJU_TEMPLATE.matchAll(/\{\{(\w+)\}\}/g)].map(match => match[1]);
  const vars = Object.fromEntries(keys.map(key => [key, `입력:${key}`]));
  const rendered = renderTemplate(PERSONAL_SAJU_TEMPLATE, vars);
  assert.ok(!rendered.includes(" 없음)"));
  assert.ok(!rendered.includes("{{"));
  assert.ok(rendered.includes("입력:yearTrioBasis"));
});

test("personal report structured output reinforces the prompt's informal voice", () => {
  const { sections, lifeline, actionPlan } = PERSONAL_REPORT_SCHEMA.properties!;
  for (const field of [
    PERSONAL_REPORT_SCHEMA,
    sections,
    sections.items?.properties?.body,
    lifeline,
    actionPlan.items?.properties?.title,
  ]) {
    assert.match(field?.description ?? "", /반말/);
  }
  assert.doesNotMatch(JSON.stringify(PERSONAL_REPORT_SCHEMA), /존댓말|해요체/);
});
