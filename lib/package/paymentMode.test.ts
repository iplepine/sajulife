import assert from "node:assert/strict";
import test from "node:test";
import { paymentAvailability } from "./paymentMode";

const KEYS = [
  "NEXT_PUBLIC_PACKAGE_PAYMENT",
  "NEXT_PUBLIC_PORTONE_STORE_ID",
  "NEXT_PUBLIC_PORTONE_CHANNEL_KEY",
  "PORTONE_API_SECRET",
] as const;

const PORTONE_KEYS = {
  NEXT_PUBLIC_PORTONE_STORE_ID: "store-test",
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY: "channel-test",
  PORTONE_API_SECRET: "secret-test",
};

function withEnv(env: Partial<Record<(typeof KEYS)[number], string>>, run: () => void) {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const saved = Object.fromEntries(KEYS.map((k) => [k, mutableEnv[k]]));
  for (const k of KEYS) delete mutableEnv[k];
  Object.assign(mutableEnv, env);
  try {
    run();
  } finally {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete mutableEnv[k];
      else mutableEnv[k] = saved[k];
    }
  }
}

test("기본은 베타 무료 — 아무 설정이 없으면 결제 없이 연다", () => {
  withEnv({}, () => {
    assert.equal(paymentAvailability(), "free");
  });
});

test("PortOne 키만 넣어서는 실결제가 켜지지 않는다(실수 과금 방지)", () => {
  withEnv(PORTONE_KEYS, () => {
    assert.equal(paymentAvailability(), "free");
  });
});

test("실결제를 켜고 키 3종이 모두 있어야 실결제", () => {
  withEnv({ NEXT_PUBLIC_PACKAGE_PAYMENT: "portone", ...PORTONE_KEYS }, () => {
    assert.equal(paymentAvailability(), "portone");
  });
});

test("실결제를 켰는데 키가 빠지면 결제를 열지 않는다", () => {
  withEnv({ NEXT_PUBLIC_PACKAGE_PAYMENT: "portone", NEXT_PUBLIC_PORTONE_STORE_ID: "store-test" }, () => {
    assert.equal(paymentAvailability(), "unavailable");
  });
});
