import { test } from "node:test";
import assert from "node:assert/strict";
import { LunarYear } from "lunar-javascript";
import { calendarLabel, hasLeapMonth, leapMonthOf } from "./lunarLeap";
import { calculateSaju } from "./calculator";

test("윤달 표는 lunar-javascript와 1900~2100 전부 같다", () => {
  for (let y = 1900; y <= 2100; y++) {
    assert.equal(leapMonthOf(y), LunarYear.fromYear(y).getLeapMonth(), String(y));
  }
});

test("1990년은 윤5월이 있고 4월엔 없다", () => {
  assert.equal(hasLeapMonth(1990, 5), true);
  assert.equal(hasLeapMonth(1990, 4), false);
});

test("윤달 체크는 실제 윤달일 때만 계산과 라벨에 반영된다", () => {
  const base = { name: "t", birthDate: "1990-05-15", birthTime: "", gender: "female" as const, calendar: "lunar" as const };
  const plain = calculateSaju(base);
  const leap = calculateSaju({ ...base, isLeapMonth: true });
  assert.equal(plain.input.isLeapMonth, false);
  assert.equal(leap.input.isLeapMonth, true);
  assert.equal(leap.input.calculationBirthDate, "1990-07-07");
  assert.notEqual(plain.input.calculationBirthDate, leap.input.calculationBirthDate);
  assert.equal(calendarLabel({ ...base, isLeapMonth: true }), "음력 윤달");
  // 윤4월은 1990년에 없다 → 평달로 계산, 라벨도 음력.
  const noLeap = calculateSaju({ ...base, birthDate: "1990-04-15", isLeapMonth: true });
  assert.equal(noLeap.input.isLeapMonth, false);
  assert.equal(calendarLabel({ ...base, birthDate: "1990-04-15", isLeapMonth: true }), "음력");
});
