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
