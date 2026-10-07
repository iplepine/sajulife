import assert from "node:assert/strict";
import test from "node:test";
import { mockPaymentAllowed, paymentAvailability } from "./paymentMode";

const KEYS = [
  "VERCEL_ENV",
  "NODE_ENV",
  "PAYMENT_MOCK",
  "NEXT_PUBLIC_PORTONE_STORE_ID",
  "NEXT_PUBLIC_PORTONE_CHANNEL_KEY",
  "PORTONE_API_SECRET",
] as const;

function withEnv(env: Partial<Record<(typeof KEYS)[number], string>>, run: () => void) {
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  const mutableEnv = process.env as Record<string, string | undefined>;
  for (const k of KEYS) delete mutableEnv[k];
  Object.assign(process.env, env);
  try {
    run();
  } finally {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete mutableEnv[k];
      else mutableEnv[k] = saved[k];
    }
  }
}

test("운영 배포에서는 어떤 설정으로도 가짜 결제를 열지 않는다", () => {
  withEnv({ VERCEL_ENV: "production", NODE_ENV: "development", PAYMENT_MOCK: "1" }, () => {
    assert.equal(mockPaymentAllowed(), false);
    assert.equal(paymentAvailability(), "unavailable");
  });
});

test("로컬 개발에서는 키가 없어도 가짜 결제로 흐름을 끝까지 볼 수 있다", () => {
  withEnv({ NODE_ENV: "development" }, () => {
    assert.equal(paymentAvailability(), "mock");
  });
});

test("프리뷰는 PAYMENT_MOCK=1을 켰을 때만 가짜 결제", () => {
  withEnv({ VERCEL_ENV: "preview", NODE_ENV: "production" }, () => {
    assert.equal(paymentAvailability(), "unavailable");
  });
  withEnv({ VERCEL_ENV: "preview", NODE_ENV: "production", PAYMENT_MOCK: "1" }, () => {
    assert.equal(paymentAvailability(), "mock");
  });
});

test("PortOne 키 3종이 모두 있으면 실결제가 우선한다", () => {
  withEnv(
    {
      NODE_ENV: "development",
      NEXT_PUBLIC_PORTONE_STORE_ID: "store-test",
      NEXT_PUBLIC_PORTONE_CHANNEL_KEY: "channel-test",
      PORTONE_API_SECRET: "secret-test",
    },
    () => {
      assert.equal(paymentAvailability(), "portone");
    },
  );
});
