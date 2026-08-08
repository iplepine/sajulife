import assert from "node:assert/strict";
import test from "node:test";
import {
  aiGenerationAccountRateLimitKey,
  aiGenerationRateLimitKey,
  getAIGenerationConfig,
  getAIGenerationWindow,
} from "./generationGuard";

test("AI generation config supports a global and a per-kind daily limit", () => {
  assert.deepEqual(
    getAIGenerationConfig("consult", { AI_GENERATION_DAILY_LIMIT: "11" }),
    { enabled: true, dailyLimit: 11, accountDailyLimit: 12 },
  );
  assert.deepEqual(
    getAIGenerationConfig("consult", {
      AI_GENERATION_DAILY_LIMIT: "11",
      AI_CONSULT_DAILY_LIMIT: "3",
    }),
    { enabled: true, dailyLimit: 3, accountDailyLimit: 12 },
  );
});

test("AI generation kill switch is fail-closed", () => {
  assert.equal(getAIGenerationConfig("personal", { AI_GENERATION_ENABLED: "false" }).enabled, false);
  assert.equal(getAIGenerationConfig("personal", { AI_GENERATION_DISABLED: "true" }).enabled, false);
});

test("AI generation window resets at the next UTC midnight", () => {
  assert.deepEqual(
    getAIGenerationWindow(new Date("2026-08-07T23:59:59.000Z")),
    { date: "2026-08-07", resetAtUnixSeconds: 1786147200 },
  );
});

test("rate-limit keys separate generation kind and account windows without logging user IDs", () => {
  assert.equal(
    aiGenerationRateLimitKey("user-uuid", "consult", "2026-08-07"),
    "rate-limit:ai:2026-08-07:consult:user-uuid",
  );
  assert.equal(
    aiGenerationAccountRateLimitKey("user-uuid", "2026-08-07"),
    "rate-limit:ai:2026-08-07:account:user-uuid",
  );
});
