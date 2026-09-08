import assert from "node:assert/strict";
import test from "node:test";
import { normalizeReport, REPORT_FIELD_LABELS, stripCodeFence } from "./normalize";

/**
 * 옛 저장본을 열었을 때 ★영문 내부 필드명이 화면에 새어나오지 않는지★ 지킨다.
 * 실제 개인정보는 쓰지 않는다 — 전부 가상 샘플.
 */

const CURRENT_JSON = JSON.stringify({
  title: "버티는 힘으로 판을 뒤집는 사람",
  keywords: [{ word: "존버", desc: "끝까지 남는 쪽" }],
  sections: [{ id: "기본성향", summary: "한 문장 요약", body: "● 핵심: 본문 한 줄" }],
  roadmap: {
    character: "느리게 데워지는 가마솥",
    resourceInput: "혼자 정리하는 시간",
    resourceOutput: "정리한 걸 남한테 풀어내는 일",
    riskShadow: "혼자 다 떠안는 버릇",
    riskTool: "주 1회 상황 공유",
    direction: "내 이름으로 굴리는 판",
  },
  disclaimer: "참고용이야.",
});

/** roadmap은 있는데 sections가 ★맵★인 옛 JSON — 지금 파서는 못 알아본다. */
const LEGACY_MAP_JSON = JSON.stringify({
  title: "옛 저장본",
  sections: {
    기본성향: { summary: "요약", body: "본문 첫 줄\n본문 둘째 줄" },
    직업운: "문자열로만 저장된 본문",
  },
  roadmap: {
    character: "옛 캐릭터",
    resourceInput: "옛 인풋",
    resourceOutput: "",
    riskShadow: "",
    riskTool: "",
    direction: "",
  },
  actionPlan: [{ title: "오늘 할 것", timeframe: "오늘" }],
});

/** 섹션 구조 자체가 없는 옛 JSON — 예전엔 이게 통째로 한 문단으로 찍혔다. */
const LEGACY_FLAT_JSON = JSON.stringify({
  roadmap: {
    character: "한 마디",
    resourceInput: "채우는 힘",
    resourceOutput: "쓰는 법",
    riskShadow: "그림자",
    riskTool: "대처법",
    direction: "방향",
  },
  actionPlan: [{ title: "정리하기", timeframe: "이번 주" }],
});

const LEGACY_TEXT = "▣ 1. [기본성향] 한 문장 요약\n● 핵심: 본문 한 줄\n\n▣ 2. [직업운] 또 한 문장\n• 세부 항목";

test("현재 형식 JSON은 그대로 개인 리포트로 읽힌다", () => {
  const result = normalizeReport(CURRENT_JSON);
  assert.equal(result.kind, "personal");
  if (result.kind !== "personal") return;
  assert.equal(result.report.sections.length, 1);
  assert.equal(result.report.roadmap.character, "느리게 데워지는 가마솥");
});

test("섹션이 맵인 옛 JSON도 개인 리포트로 펴진다 — 문단이 뭉치지 않는다", () => {
  const result = normalizeReport(LEGACY_MAP_JSON);
  assert.equal(result.kind, "personal");
  if (result.kind !== "personal") return;
  assert.deepEqual(result.report.sections.map((s) => s.id), ["기본성향", "직업운"]);
  assert.equal(result.report.sections[0].body.includes("본문 둘째 줄"), true);
  // 내부 키가 섹션 이름으로 새지 않는다.
  for (const section of result.report.sections) {
    assert.equal(/roadmap|actionPlan|resourceInput/.test(section.id), false);
  }
});

test("섹션이 없는 옛 JSON은 한국어 이름 붙은 문단으로 풀린다", () => {
  const result = normalizeReport(LEGACY_FLAT_JSON);
  assert.equal(result.kind, "labeled");
  if (result.kind !== "labeled") return;
  const labels = result.entries.map((e) => e.label);
  assert.deepEqual(labels, [REPORT_FIELD_LABELS.roadmap, REPORT_FIELD_LABELS.actionPlan]);
  const rendered = result.entries.flatMap((e) => [e.label ?? "", ...e.paragraphs]).join("\n");
  // 표에 있는 내부 이름은 화면 문자열 어디에도 남지 않는다.
  for (const key of ["roadmap", "actionPlan", "character", "resourceInput", "resourceOutput", "riskShadow", "riskTool", "direction"]) {
    assert.equal(rendered.includes(key), false, `${key}가 화면 문자열에 남았다`);
  }
  // 내용은 하나도 안 사라진다.
  assert.equal(rendered.includes("채우는 힘"), true);
  assert.equal(rendered.includes("정리하기"), true);
});

test("옛 텍스트 리포트는 텍스트 경로로 그대로 간다", () => {
  const result = normalizeReport(LEGACY_TEXT);
  assert.equal(result.kind, "text");
  if (result.kind !== "text") return;
  assert.equal(result.text, LEGACY_TEXT);
});

test("코드펜스로 감싸인 저장본도 벗겨서 읽는다", () => {
  const fenced = "```json\n" + CURRENT_JSON + "\n```";
  assert.equal(stripCodeFence(fenced), CURRENT_JSON);
  assert.equal(normalizeReport(fenced).kind, "personal");
});

test("깨진 JSON은 내용을 숨기지 않고 텍스트로 남긴다", () => {
  const broken = '{"title": "잘리다가 만 저장본"';
  const result = normalizeReport(broken);
  assert.equal(result.kind, "text");
  if (result.kind !== "text") return;
  assert.equal(result.text.includes("잘리다가 만 저장본"), true);
});

test("가족 저장본은 가족 리포트로 간다", () => {
  const familyJson = JSON.stringify({
    title: "우리 집 이야기",
    compat: [{ relation: "어머니", name: "가상", bond: "서로를 채우는 사이" }],
    rituals: { today: "한 마디 건네기", thisWeek: "", thisMonth: "" },
  });
  const result = normalizeReport(familyJson);
  assert.equal(result.kind, "family");
});
