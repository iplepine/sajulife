import assert from "node:assert/strict";
import test from "node:test";
import { TCI_DIMENSIONS } from "./questions";
import { completeTciScores, tciReadingView, type TciReadingResponse } from "./reading";

const scores = (percent: number) => Object.entries(TCI_DIMENSIONS).map(([dimension, meta]) => ({ dimension, ...meta, percent, raw: 15, max: 25 }));
const response = (patch: Partial<TciReadingResponse> = {}): TciReadingResponse => ({ saved: null, scores: scores(60), readiness: { hasTci: true }, status: "idle", ...patch });

test("completed survey shows seven results even when no standalone AI report was generated", () => {
  const view = tciReadingView(response());
  assert.equal(view.scores.length, 7);
  assert.equal(view.saved, null);
  assert.equal(view.flexibility, undefined);
});

test("partial answers never appear as a completed temperament result", () => {
  const view = tciReadingView(response({ readiness: { hasTci: false, tciAnswered: 5, tciTotal: 35 } }));
  assert.deepEqual(view.scores, []);
  assert.equal(view.complete, false);
});

test("current responses and old prose retain independent score sets and flexibility", () => {
  const saved = { report: "옛 기질 해설", generatedAt: "2026-09-01", meta: { scores: scores(40), flexibility: 51 } };
  const view = tciReadingView(response({ saved }));
  assert.ok(view.scores.every(score => score.percent === 60));
  assert.ok(view.savedScores.every(score => score.percent === 40));
  assert.equal(view.flexibility, 51);
  assert.equal(view.saved, saved);
  assert.deepEqual(tciReadingView(response({ saved: { ...saved, meta: undefined } })).savedScores, []);
  assert.deepEqual(tciReadingView(response({ saved, readiness: { hasTci: false } })).scores, []);
});

test("invalid, duplicate or missing axes are not drawn as zeroes; valid zero is retained", () => {
  for (const value of [null, scores(60).slice(1), [...scores(60).slice(1), scores(60)[1]], scores(Number.NaN), scores(101), [null, ...scores(60).slice(1)], [{ ...scores(60)[0], dimension: ["NS"] }, ...scores(60).slice(1)]]) {
    assert.deepEqual(completeTciScores(value), []);
  }
  assert.equal(completeTciScores(scores(0)).length, 7);
  assert.equal(completeTciScores(scores(0))[0].percent, 0);
  const view = tciReadingView(response({ saved: { report: "old", generatedAt: "2026-09-01", meta: { flexibility: Number.NaN, scores: [null] } } }));
  assert.equal(view.flexibility, undefined);
  assert.deepEqual(view.savedScores, []);
});
