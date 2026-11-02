import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PROMPTS } from "../prompts/defaults";
import { FUSION_REPORT_TEMPLATE, FUSION_REPORT_VERSION } from "../prompts/fusionReport";
import { PERSONAL_SAJU_TEMPLATE } from "../prompts/personalSaju";
import { REPORT_VOICE_GUIDE, withReportVoice } from "../prompts/reportVoice";
import { renderTemplate } from "../prompts/render";
import { PERSONAL_REPORT_SECTION_IDS } from "./personalContract";
import { FUSION_SECTION_TITLES } from "../fusion/reportContract";

const REPORT_KEYS = ["personal-saju", "tci-saju-fusion", "tci-report", "yongsin-saju", "family-saju", "compat-saju"] as const;

test("six report prompts share one editing policy without adding generation or changing consultation", () => {
  for (const key of REPORT_KEYS) {
    const template = DEFAULT_PROMPTS[key].template;
    assert.equal(template.split(REPORT_VOICE_GUIDE).length - 1, 1, key);
    assert.ok(template.includes("사실·조건·점수·시기·행동의 의미"), key);
    assert.ok(!template.includes("과장 비유 OK"), key);
    assert.ok(!template.includes("매 항목 끝은 응원·기대로 닫아"), key);
  }
  assert.equal(DEFAULT_PROMPTS.consult.version, 12);
  assert.ok(!DEFAULT_PROMPTS.consult.template.includes(REPORT_VOICE_GUIDE));
});

test("voice revision bumps defaults so old KV templates do not mask the change", () => {
  const versions = REPORT_KEYS.map(key => DEFAULT_PROMPTS[key].version);
  assert.deepEqual(versions, [23, 32, 22, 10, 18, 2]);
  assert.equal(FUSION_REPORT_VERSION, 32);
});

test("personal stays formal, integrated stays informal, output contracts remain present", () => {
  assert.ok(PERSONAL_SAJU_TEMPLATE.endsWith("호칭과 어미: 따뜻하고 차분한 존댓말을 유지한다. 딱딱한 보고체로 바꾸지 않는다."));
  assert.ok(FUSION_REPORT_TEMPLATE.endsWith("호칭과 어미: 차분하고 따뜻한 반말을 유지한다. 훈계·비꼼·과한 친한 척은 하지 않는다. 가족·상대는 존중해서 묘사한다."));
  for (const id of PERSONAL_REPORT_SECTION_IDS) assert.ok(PERSONAL_SAJU_TEMPLATE.includes(id));
  for (const title of FUSION_SECTION_TITLES) assert.ok(FUSION_REPORT_TEMPLATE.includes(title));
  assert.ok(PERSONAL_SAJU_TEMPLATE.includes("JSON 객체 하나만 출력합니다."));
  assert.ok(FUSION_REPORT_TEMPLATE.includes("ACTIONS는 정확히 세 객체"));
  assert.ok(FUSION_REPORT_TEMPLATE.includes("FLEX는 출력하지 않는다"));
});

test("editing examples are explicitly not input evidence and add no template variables", () => {
  assert.ok(REPORT_VOICE_GUIDE.includes("이 사용자의 자료가 아니므로 내용이나 상황을 복사하지 않는다"));
  assert.ok(REPORT_VOICE_GUIDE.includes("유보 표현을 없애 성격·미래·건강을 확정문으로 바꾸지 않는다"));
  assert.ok(REPORT_VOICE_GUIDE.includes("다섯 가지 힘의 공식 이름"));
  assert.deepEqual([...REPORT_VOICE_GUIDE.matchAll(/\{\{(\w+)\}\}/g)], []);
  const wrapped = withReportVoice("기존 입력: {{context}}", "informal");
  assert.ok(renderTemplate(wrapped, { context: "자료 없음" }).startsWith("기존 입력: 자료 없음"));
});
