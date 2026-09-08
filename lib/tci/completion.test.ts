import assert from "node:assert/strict";
import test from "node:test";
import { isValidTciAnswer, tciCompletionFromItems } from "./completion";

const IDS = ["ns1", "ha1", "rd1"];

test("리커트 응답은 1~5 정수만 인정한다", () => {
  for (const ok of [1, 2, 3, 4, 5]) assert.equal(isValidTciAnswer(ok), true);
  for (const bad of [0, 6, 2.5, "3", null, undefined, NaN]) assert.equal(isValidTciAnswer(bad), false);
});

test("부분 응답은 완료가 아니다", () => {
  const r = tciCompletionFromItems("short", IDS, { ns1: 3, ha1: 5 });
  assert.deepEqual(r, { variant: "short", answered: 2, total: 3, complete: false });
});

test("전 문항이 유효해야 완료다", () => {
  const r = tciCompletionFromItems("short", IDS, { ns1: 3, ha1: 5, rd1: 1 });
  assert.equal(r.complete, true);
});

test("값이 범위를 벗어나면 응답으로 세지 않는다", () => {
  const r = tciCompletionFromItems("short", IDS, { ns1: 3, ha1: 5, rd1: 9 });
  assert.equal(r.answered, 2);
  assert.equal(r.complete, false);
});

test("문항 ID가 다르면 세지 않는다 — 남의 variant 응답이 섞여도 완료가 아니다", () => {
  const r = tciCompletionFromItems("short", IDS, { zz1: 3, zz2: 4, zz3: 5 });
  assert.equal(r.answered, 0);
  assert.equal(r.complete, false);
});

test("문항이 비어 있는 variant는 완료로 보지 않는다", () => {
  const r = tciCompletionFromItems("full", [], { ns1: 3 });
  assert.equal(r.complete, false);
});

test("응답 자체가 없으면 0/총계, 미완료", () => {
  assert.deepEqual(tciCompletionFromItems("short", IDS, null), {
    variant: "short", answered: 0, total: 3, complete: false,
  });
});
