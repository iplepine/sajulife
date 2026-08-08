import { Redis } from "@upstash/redis";

// Vercel Marketplace의 Upstash KV 통합이 KV_REST_API_URL / KV_REST_API_TOKEN 환경변수를 주입한다.
// `Redis.fromEnv()`는 이를 자동 인식한다.
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (_redis) return _redis;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error(
      "KV_REST_API_URL / KV_REST_API_TOKEN 환경변수가 없습니다. `vercel env pull .env.local`을 실행하거나 Vercel KV(Upstash) 통합이 연결됐는지 확인하세요."
    );
  }
  _redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
  return _redis;
}

/**
 * KV에서 JSON 값을 읽는다. 값이 없으면 fallback을 반환한다.
 * Upstash Redis SDK는 객체 값을 자동으로 직렬화/역직렬화한다.
 */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  const value = await getRedis().get<T>(key);
  return value ?? fallback;
}

/**
 * JSON 값을 KV에 쓴다.
 */
export async function writeJson(key: string, data: unknown): Promise<void> {
  await getRedis().set(key, data);
}

/**
 * KV 값을 삭제한다. 잘못 저장된 캐시/리포트 정리에 사용한다.
 */
export async function deleteJson(key: string): Promise<void> {
  await getRedis().del(key);
}

/**
 * 정수 카운터를 원자적으로 증가시키고 새 값을 반환한다 (예: 티켓 잔액).
 * JSON 블롭이 아니라 bare integer로 저장해 read-modify-write 경합을 피한다.
 */
export async function incrBy(key: string, amount: number): Promise<number> {
  return getRedis().incrby(key, amount);
}

/**
 * 고정 기간 카운터를 원자적으로 증가시키고, 첫 증가 시점에 만료 시각을 설정한다.
 *
 * `INCR` 뒤에 별도 `EXPIREAT`를 호출하면 그 사이 프로세스가 중단됐을 때 무기한
 * 카운터가 남을 수 있다. Lua script로 두 동작을 하나의 Redis 명령으로 묶어
 * rate limit 같은 비용 보호용 카운터가 경쟁 조건 없이 동작하게 한다.
 */
const INCREMENT_WITH_EXPIRY_SCRIPT = `
  local result = {}
  for index, key in ipairs(KEYS) do
    local count = redis.call("INCR", key)
    if count == 1 then
      redis.call("EXPIREAT", key, ARGV[1])
    end
    result[#result + 1] = count
    result[#result + 1] = redis.call("TTL", key)
  end
  return result
`;

export async function incrementManyWithExpiry(
  keys: readonly string[],
  expiresAtUnixSeconds: number,
): Promise<Array<{ count: number; ttlSeconds: number }>> {
  if (keys.length === 0 || new Set(keys).size !== keys.length) {
    throw new Error("keys must contain at least one unique key");
  }
  if (!Number.isSafeInteger(expiresAtUnixSeconds) || expiresAtUnixSeconds <= 0) {
    throw new Error("expiresAtUnixSeconds must be a positive Unix timestamp");
  }

  const result = await getRedis().eval<[string], number[]>(
    INCREMENT_WITH_EXPIRY_SCRIPT,
    [...keys],
    [String(expiresAtUnixSeconds)],
  );
  if (result.length !== keys.length * 2 || result.some((value) => !Number.isFinite(value))) {
    throw new Error("Upstash fixed-window counter returned an invalid response");
  }

  return keys.map((_, index) => ({
    count: result[index * 2],
    ttlSeconds: result[index * 2 + 1],
  }));
}

export async function incrementWithExpiry(
  key: string,
  expiresAtUnixSeconds: number,
): Promise<{ count: number; ttlSeconds: number }> {
  const [counter] = await incrementManyWithExpiry([key], expiresAtUnixSeconds);
  return counter;
}

/** 정수 카운터를 읽는다. 없으면 0. */
export async function readInt(key: string): Promise<number> {
  const value = await getRedis().get<number>(key);
  return value ?? 0;
}

/**
 * 키가 아직 없을 때만 값을 쓰고 true를 반환한다(원자적 SETNX).
 * 이미 있으면 아무것도 하지 않고 false — 결제 검증처럼 "딱 한 번만 처리"가
 * 필요한 곳에서 중복 실행(재시도·중복 클릭)을 막는 데 쓴다.
 */
export async function claimOnce(key: string): Promise<boolean> {
  const result = await getRedis().set(key, "1", { nx: true });
  return result === "OK";
}
