import assert from "node:assert/strict";
import test from "node:test";
import { canUsePackage } from "./access";

test("무료 베타는 구매 기록 없이 사용할 수 있다", () => {
  assert.equal(canUsePackage("free", false), true);
});
test("유료 또는 결제 준비 중에는 구매 기록이 필요하다", () => {
  for (const payment of ["portone", "unavailable"] as const) {
    assert.equal(canUsePackage(payment, false), false);
    assert.equal(canUsePackage(payment, true), true);
  }
});
