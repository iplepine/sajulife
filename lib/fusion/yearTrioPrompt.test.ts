import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateSaju } from "../saju/calculator";
import { formatYearTrioForPrompt, yearTrio } from "./yearFortune";
import { buildYongsinView } from "../saju/yongsinView";

test("개인 세운 근거는 동일 계산기의 전년·금년·내년과 일치한다", () => {
  const saju = calculateSaju({ name: "가상인물", birthDate: "1985-12-31", birthTime: "23:40", calendar: "solar", gender: "male" });
  for (const year of [2026, 2027]) {
    const basis = formatYearTrioForPrompt(saju, 40, year);
    const items = yearTrio(saju, buildYongsinView(saju, 40, year), year);
    assert.equal(items.length, 3);
    for (const item of items) {
      assert.ok(basis.includes(`${item.key}: ${item.year}년 (${item.ganzhi}년) — ${item.head}`));
      assert.ok(basis.includes(item.line));
    }
    assert.match(basis, /실제 사건·질병·수익을 예측하거나 과거 경험을 확인한 자료가 아니다/);
  }
});

test("생시 미상 세운 자료에도 없는 시각을 새로 만들지 않는다", () => {
  const saju = calculateSaju({ name: "가상인물", birthDate: "2001-07-15", birthTime: "", calendar: "solar", gender: "female" });
  assert.equal(saju.pillars.time, null);
  const basis = formatYearTrioForPrompt(saju, 25, 2026);
  assert.ok(!basis.includes("시지"));
  assert.match(basis, /금년도|올해/);
});
