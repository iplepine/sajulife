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
