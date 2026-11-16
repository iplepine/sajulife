import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PROMPTS } from "../prompts/defaults";
import { FUSION_REPORT_TEMPLATE, FUSION_REPORT_VERSION } from "../prompts/fusionReport";
import { PERSONAL_SAJU_TEMPLATE } from "../prompts/personalSaju";
import { CHARACTER_VOICE_GUIDE, DIRECT_SPEECH_TONE, REPORT_VOICE_GUIDE, withCharacterVoice, withReportVoice } from "../prompts/reportVoice";
import { renderTemplate } from "../prompts/render";
import { PERSONAL_REPORT_SECTION_IDS } from "./personalContract";
import { FUSION_SECTION_TITLES } from "../fusion/reportContract";
import { buildStructuredRepairPrompt } from "./repair";
import { buildFusionRepairPrompt } from "../fusion/reportOutput";

const REPORT_KEYS = ["personal-saju", "tci-saju-fusion", "tci-report", "yongsin-saju", "family-saju", "compat-saju"] as const;

test("six reports keep their editing policy and all seven products share direct character speech", () => {
  for (const key of REPORT_KEYS) {
    const template = DEFAULT_PROMPTS[key].template;
    assert.equal(template.split(REPORT_VOICE_GUIDE).length - 1, 1, key);
    assert.ok(template.includes("사실·조건·점수·시기·행동의 의미"), key);
    assert.ok(!template.includes("과장 비유 OK"), key);
    assert.ok(!template.includes("매 항목 끝은 응원·기대로 닫아"), key);
  }
  assert.equal(DEFAULT_PROMPTS.consult.version, 13);
  assert.ok(!DEFAULT_PROMPTS.consult.template.includes(REPORT_VOICE_GUIDE));
  assert.ok(!DEFAULT_PROMPTS.consult.template.includes("직업+기질 교차 별명 의무"));
  assert.ok(!DEFAULT_PROMPTS.consult.template.includes("1~2문장 반드시 삽입"));
  assert.ok(!DEFAULT_PROMPTS.consult.template.includes("가끔 콕 부른다(2~3회)"));
  for (const key of [...REPORT_KEYS, "consult"] as const) {
    const template = DEFAULT_PROMPTS[key].template;
    assert.equal(template.split(CHARACTER_VOICE_GUIDE).length - 1, 1, key);
    assert.ok(template.endsWith(DIRECT_SPEECH_TONE), key);
  }
});

test("voice revision bumps defaults so old KV templates do not mask the change", () => {
  const versions = REPORT_KEYS.map(key => DEFAULT_PROMPTS[key].version);
  assert.deepEqual(versions, [26, 34, 24, 11, 19, 3]);
  assert.equal(FUSION_REPORT_VERSION, 34);
});

test("personal and integrated use informal language and preserve output contracts", () => {
  assert.ok(PERSONAL_SAJU_TEMPLATE.endsWith(DIRECT_SPEECH_TONE));
  assert.ok(FUSION_REPORT_TEMPLATE.endsWith(DIRECT_SPEECH_TONE));
  for (const id of PERSONAL_REPORT_SECTION_IDS) assert.ok(PERSONAL_SAJU_TEMPLATE.includes(id));
  for (const title of FUSION_SECTION_TITLES) assert.ok(FUSION_REPORT_TEMPLATE.includes(title));
  assert.ok(PERSONAL_SAJU_TEMPLATE.includes("JSON 객체 하나만 출력합니다."));
  assert.ok(FUSION_REPORT_TEMPLATE.includes("ACTIONS는 정확히 세 객체"));
  assert.ok(FUSION_REPORT_TEMPLATE.includes("FLEX는 출력하지 않는다"));
});

test("the product speaker is restored instead of an impersonal writer or analyst", () => {
  for (const key of ["personal-saju", "yongsin-saju", "family-saju", "compat-saju", "consult"] as const) {
    const template = DEFAULT_PROMPTS[key].template;
    assert.ok(template.startsWith("너는 사주언니야."), key);
    assert.ok(template.includes("네가 직접 풀어줘"), key);
    assert.ok(!template.includes("30년 차 베테랑"), key);
  }
  assert.ok(DEFAULT_PROMPTS["tci-report"].template.startsWith("너는 기질오빠야."));
  assert.ok(!DEFAULT_PROMPTS["tci-report"].template.includes("중반 슬럼프가 자주 옴"));
  assert.ok(!DEFAULT_PROMPTS["yongsin-saju"].template.includes("자기 자신을 '언니/형'이라 칭하거나"));
  assert.ok(FUSION_REPORT_TEMPLATE.startsWith("너는 사주언니와 기질오빠야."));
  assert.ok(!PERSONAL_SAJU_TEMPLATE.includes("인터넷 슬랭·팩폭·비속어·공포 표현은 쓰지 않습니다"));
  assert.ok(!FUSION_REPORT_TEMPLATE.includes("슬랭·욕설·팩폭·캐릭터 별명"));
  assert.ok(CHARACTER_VOICE_GUIDE.includes("'~다/~한다/~이다' 보고체"));
  assert.ok(CHARACTER_VOICE_GUIDE.includes("고정 소제목·키워드·필드명·timeframe"));
  assert.ok(CHARACTER_VOICE_GUIDE.includes("실제 인용"));
  assert.ok(CHARACTER_VOICE_GUIDE.includes("사용자가 다른 사람에게 건넬 대사 예시"));
});

test("rendering and both repair paths retain the speaker, voice, and current output contracts", () => {
  for (const key of [...REPORT_KEYS, "consult"] as const) {
    const config = DEFAULT_PROMPTS[key];
    const keys = [...config.template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
    const rendered = renderTemplate(config.template, Object.fromEntries(keys.map(k => [k, `합성자료:${k}`])));
    assert.ok(!/\{\{\w+\}\}/.test(rendered), key);
    assert.ok(rendered.includes(CHARACTER_VOICE_GUIDE), key);
    const repair = key === "tci-saju-fusion" ? buildFusionRepairPrompt(rendered, ["누락된 항목"]) : buildStructuredRepairPrompt(rendered, ["누락된 항목"]);
    assert.ok(repair.startsWith(rendered), key);
    assert.ok(repair.includes(DIRECT_SPEECH_TONE), key);
  }
  const consult = withCharacterVoice("기존 입력: {{context}}\nACTIONS=[...]", "saju-sister");
  assert.ok(consult.startsWith("기존 입력: {{context}}\nACTIONS=[...]"));
  assert.ok(!consult.includes(REPORT_VOICE_GUIDE));
});

test("editing examples are explicitly not input evidence and add no template variables", () => {
  assert.ok(REPORT_VOICE_GUIDE.includes("이 사용자의 자료가 아니므로 내용이나 상황을 복사하지 않는다"));
  assert.ok(REPORT_VOICE_GUIDE.includes("유보 표현을 없애 성격·미래·건강을 확정문으로 바꾸지 않는다"));
  assert.ok(REPORT_VOICE_GUIDE.includes("다섯 가지 힘의 공식 이름"));
  assert.deepEqual([...REPORT_VOICE_GUIDE.matchAll(/\{\{(\w+)\}\}/g)], []);
  const wrapped = withReportVoice("기존 입력: {{context}}", "informal");
  assert.ok(renderTemplate(wrapped, { context: "자료 없음" }).startsWith("기존 입력: 자료 없음"));
});
