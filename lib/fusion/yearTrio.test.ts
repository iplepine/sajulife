import assert from "node:assert/strict";
import test from "node:test";
import { calculateSaju } from "../saju/calculator";
import { buildYongsinView } from "../saju/yongsinView";
import { yearTrio } from "./yearFortune";

/**
 * '작년 → 올해 → 내년' 세운 세 칸 — 2026-10-25 전문가 견본(전년도·금년도·내년도 세운) 반영.
 * 계산만 한다(AI 호출 없음). 기준 사주는 견본 명식 甲午 丙寅 己未 丁卯.
 */
test("작년·올해·내년이 차례로 나오고, 시제에 맞게 끝난다", () => {
  const saju = calculateSaju({ name: "견본", birthDate: "1954-03-04", birthTime: "06:30", gender: "male", calendar: "solar" });
  const items = yearTrio(saju, buildYongsinView(saju, undefined, 2026), 2026);
  assert.deepEqual(items.map((i) => [i.key, i.year, i.ganzhi]), [["작년", 2025, "을사"], ["올해", 2026, "병오"], ["내년", 2027, "정미"]]);
  assert.match(items[0].line, /해였어$/);
  assert.match(items[1].line, /해야$/);
  assert.match(items[2].line, /해가 와$/);
  // 견본 사주는 불이 넘쳐 탈이 나는 사주 — 불의 해(을사·병오·정미)는 순풍으로 읽히면 안 된다.
  for (const item of items) assert.notEqual(item.tone, "good", `${item.key} ${item.ganzhi}년이 순풍으로 나왔습니다`);
});

test("한자 없이 한글 간지와 일상어만 쓴다", () => {
  const saju = calculateSaju({ name: "견본", birthDate: "1954-03-04", birthTime: "06:30", gender: "male", calendar: "solar" });
  for (const item of yearTrio(saju, buildYongsinView(saju, undefined, 2026), 2026)) {
    const text = `${item.ganzhi} ${item.head} ${item.line} ${item.clash ?? ""}`;
    assert.doesNotMatch(text, /[一-鿿]/, `한자가 섞였습니다: ${text}`);
  }
});
