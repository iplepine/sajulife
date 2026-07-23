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
