import assert from "node:assert/strict";
import test from "node:test";
import { calculateSaju } from "@/lib/saju/calculator";
import type { SajuProfile } from "@/lib/store/types";
import { formatYearFortuneForPrompt } from "./yearFortune";

const profile = {
  name: "지유",
  birthDate: "1994-03-12",
  birthTime: "09:30",
  gender: "female",
  calendar: "solar",
} as SajuProfile;

test("올해·내년·남은 달 재료를 자연어로 만든다", () => {
  const text = formatYearFortuneForPrompt(calculateSaju(profile), 32, 2026, 10);
  assert.ok(text.includes("[지금 지나는 10년 흐름]"));
  assert.ok(text.includes("[올해 2026년"));
  assert.ok(text.includes("올해 남은 달 2개월"));
  assert.ok(text.includes("[내년 2027년]"));
  assert.ok(text.includes("[올해 → 내년]"));
  assert.ok(text.includes("2026년 '주의가 필요한 시기'") || text.includes("2026년은 원국과 크게 부딪치는 달이"));
});

test("재료에는 한자·간지 글자를 넣지 않는다(본문 노출 금지 규칙과 같은 이유)", () => {
  const text = formatYearFortuneForPrompt(calculateSaju(profile), 32, 2026, 10);
  assert.equal(/[㐀-䶿一-鿿]/.test(text), false);
});

test("출생 시각을 몰라도 깨지지 않는다", () => {
  const text = formatYearFortuneForPrompt(calculateSaju({ ...profile, birthTime: "" }), 32, 2026, 3);
  assert.ok(text.includes("[올해 2026년"));
});
