import { randomUUID } from "node:crypto";
import { incrementManyWithExpiry } from "@/lib/store/kv";

/** AI를 실제로 호출하는 사용자 시작점. */
export type AIGenerationKind =
  | "personal"
  | "tci"
  | "fusion"
  | "family"
  | "consult"
  | "yongsin";

type Environment = Record<string, string | undefined>;

type AIGenerationConfig = {
  enabled: boolean;
  accountDailyLimit: number;
  dailyLimit: number;
};

type AIGenerationWindow = {
  date: string;
  resetAtUnixSeconds: number;
};

export type AIGenerationTelemetry = {
  kind: AIGenerationKind;
  route: string;
  requestId: string;
  startedAtMs: number;
};

export type AIGenerationAllowance =
  | {
      allowed: true;
      limit: number;
      remaining: number;
      accountLimit: number;
      accountRemaining: number;
    }
  | {
      allowed: false;
      reason: "disabled" | "rate_limited" | "unavailable";
      retryAfterSeconds?: number;
    };

const DEFAULT_DAILY_LIMIT = 8;
const DEFAULT_ACCOUNT_DAILY_LIMIT = 12;

/**
 * AI 생성은 기본적으로 켜 둔다. 운영 중에는 다음 서버 환경변수로 제어한다.
 *
 * - `AI_GENERATION_ENABLED=false` 또는 `AI_GENERATION_DISABLED=true`: 즉시 전체 중지
 * - `AI_GENERATION_ACCOUNT_DAILY_LIMIT=<정수>`: 계정 전체 UTC 일일 한도 (기본 12)
 * - `AI_GENERATION_DAILY_LIMIT=<정수>`: 생성 종류별 UTC 일일 한도 (기본 8)
 * - `AI_<KIND>_DAILY_LIMIT=<정수>`: 종류별 한도 override (예: AI_CONSULT_DAILY_LIMIT)
 */
export function getAIGenerationConfig(
  kind: AIGenerationKind,
  env: Environment = process.env,
): AIGenerationConfig {
  const enabled = !isTruthy(env.AI_GENERATION_DISABLED) && !isExplicitlyFalse(env.AI_GENERATION_ENABLED);
  const kindLimit = env[`AI_${kind.toUpperCase()}_DAILY_LIMIT`];
  const dailyLimit = parseNonNegativeInteger(
    kindLimit ?? env.AI_GENERATION_DAILY_LIMIT,
    DEFAULT_DAILY_LIMIT,
  );
  const accountDailyLimit = parseNonNegativeInteger(
    env.AI_GENERATION_ACCOUNT_DAILY_LIMIT,
    DEFAULT_ACCOUNT_DAILY_LIMIT,
  );
  return { enabled, dailyLimit, accountDailyLimit };
}

/** 현재 UTC 날짜의 끝을 fixed-window 만료 시각으로 사용한다. */
export function getAIGenerationWindow(now = new Date()): AIGenerationWindow {
  const date = now.toISOString().slice(0, 10);
  const resetAtUnixSeconds = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) / 1000,
  );
  return { date, resetAtUnixSeconds };
}

/** 사용자 UUID는 KV에서만 식별자로 쓰며 운영 로그에는 절대 기록하지 않는다. */
export function aiGenerationRateLimitKey(
  userId: string,
  kind: AIGenerationKind,
  date: string,
): string {
  return `rate-limit:ai:${date}:${kind}:${userId}`;
}

export function aiGenerationAccountRateLimitKey(userId: string, date: string): string {
  return `rate-limit:ai:${date}:account:${userId}`;
}

export function createAIGenerationTelemetry(
  route: string,
  kind: AIGenerationKind,
): AIGenerationTelemetry {
  return {
    route,
    kind,
    requestId: randomUUID(),
    startedAtMs: Date.now(),
  };
}

/**
 * 실제 생성 시작 전 한 번만 호출한다. INCR + EXPIREAT은 KV의 Lua script로 원자 처리한다.
 * KV를 확인할 수 없으면 fail-closed(503)로 비용 폭주를 막는다.
 */
export async function reserveAIGeneration(
  userId: string,
  kind: AIGenerationKind,
  now = new Date(),
): Promise<AIGenerationAllowance> {
  const config = getAIGenerationConfig(kind);
  if (!config.enabled) return { allowed: false, reason: "disabled" };

  const window = getAIGenerationWindow(now);
  try {
    const [accountCounter, kindCounter] = await incrementManyWithExpiry(
      [
        aiGenerationAccountRateLimitKey(userId, window.date),
        aiGenerationRateLimitKey(userId, kind, window.date),
      ],
      window.resetAtUnixSeconds,
    );
    const retryAfterSeconds = Math.max(1, accountCounter.ttlSeconds, kindCounter.ttlSeconds);
    if (accountCounter.count > config.accountDailyLimit || kindCounter.count > config.dailyLimit) {
      return { allowed: false, reason: "rate_limited", retryAfterSeconds };
    }
    return {
      allowed: true,
      limit: config.dailyLimit,
      remaining: Math.max(0, config.dailyLimit - kindCounter.count),
      accountLimit: config.accountDailyLimit,
      accountRemaining: Math.max(0, config.accountDailyLimit - accountCounter.count),
    };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}

/** after() 작업이 실행되기 전 운영자가 킬 스위치를 켠 경우에도 모델 호출을 막는다. */
export function assertAIGenerationEnabled(kind: AIGenerationKind): void {
  if (!getAIGenerationConfig(kind).enabled) {
    throw new AIGenerationDisabledError();
  }
}

export class AIGenerationDisabledError extends Error {
  constructor() {
    super("AI generation is disabled");
    this.name = "AIGenerationDisabledError";
  }
}

/** 사용자에게는 공급자 오류와 내부 오류를 구분해 노출하지 않는다. */
export function publicAIGenerationError(error: unknown): string {
  if (error instanceof AIGenerationDisabledError) {
    return "AI 생성이 잠시 중단되었어요. 잠시 후 다시 시도해 주세요.";
  }
  return "응답 생성에 실패했어요. 잠시 후 다시 시도해 주세요.";
}

/** rate limit/킬 스위치/저장소 장애에 대한 안전한 HTTP 응답 값. */
export function aiGenerationRejection(
  allowance: Exclude<AIGenerationAllowance, { allowed: true }>,
): { status: number; error: string; headers?: Record<string, string> } {
  if (allowance.reason === "rate_limited") {
    return {
      status: 429,
      error: "오늘 AI 생성 한도에 도달했어요. 내일 다시 시도해 주세요.",
      headers: { "Retry-After": String(allowance.retryAfterSeconds ?? 60) },
    };
  }
  if (allowance.reason === "disabled") {
    return {
      status: 503,
      error: "AI 생성이 잠시 중단되었어요. 잠시 후 다시 시도해 주세요.",
    };
  }
  return {
    status: 503,
    error: "AI 생성 한도를 확인할 수 없어요. 잠시 후 다시 시도해 주세요.",
  };
}

export function logAIGenerationRejection(
  telemetry: AIGenerationTelemetry,
  allowance: Exclude<AIGenerationAllowance, { allowed: true }>,
): void {
  if (allowance.reason === "rate_limited") {
    logAIGeneration(telemetry, "rate_limited", {
      retryAfterSeconds: allowance.retryAfterSeconds,
    });
    return;
  }
  logAIGeneration(
    telemetry,
    allowance.reason === "disabled" ? "disabled" : "limit_check_unavailable",
  );
}

type AIGenerationLogEvent =
  | "accepted"
  | "started"
  | "succeeded"
  | "failed"
  | "rate_limited"
  | "disabled"
  | "limit_check_unavailable"
  | "quality_warning";

type SafeLogFields = Record<string, boolean | number | string | undefined>;

/**
 * 운영 로그는 route/request ID/지연 시간과 안전한 운영 메타데이터만 보낸다.
 * 프롬프트, 모델 응답, 질문, 프로필, 사용자 ID 및 원본 에러 메시지는 절대 넣지 않는다.
 */
export function logAIGeneration(
  telemetry: AIGenerationTelemetry,
  event: AIGenerationLogEvent,
  fields: SafeLogFields = {},
): void {
  const entry = {
    event: "ai_generation",
    outcome: event,
    route: telemetry.route,
    kind: telemetry.kind,
    requestId: telemetry.requestId,
    durationMs: Math.max(0, Date.now() - telemetry.startedAtMs),
    ...omitUndefined(fields),
  };
  const output = JSON.stringify(entry);
  if (event === "failed" || event === "limit_check_unavailable") {
    console.error(output);
  } else {
    console.info(output);
  }
}

/** 원본 에러 문자열을 기록하지 않고, 운영에 필요한 범주만 남긴다. */
export function aiGenerationErrorKind(error: unknown): string {
  if (error instanceof AIGenerationDisabledError) return "disabled";
  const status = readStatus(error);
  if (status === 429) return "upstream_rate_limited";
  if (status !== null && status >= 500) return "upstream_unavailable";
  return "generation_failed";
}

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/.test(value.trim())) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

function isTruthy(value: string | undefined): boolean {
  return /^(?:1|true|yes|on)$/i.test(value?.trim() ?? "");
}

function isExplicitlyFalse(value: string | undefined): boolean {
  return /^(?:0|false|no|off)$/i.test(value?.trim() ?? "");
}

function readStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("status" in error)) return null;
  const status = Number(error.status);
  return Number.isInteger(status) ? status : null;
}

function omitUndefined(fields: SafeLogFields): Record<string, boolean | number | string> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Record<string, boolean | number | string>;
}
