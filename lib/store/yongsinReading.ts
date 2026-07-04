import { readJson, writeJson } from "./kv";
import { userYongsinReadingKey } from "./keys";

/**
 * 저장된 용신 풀이 1건. 4종 리포트(SavedReport)와 달리 meta/actions 없이
 * 본문 텍스트만 보관한다(공유·상담근거·코칭 미연동 — 단독 풀이).
 * 같은 사용자가 다시 생성하면 덮어쓴다.
 */
export type YongsinReading = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
};

export async function getYongsinReading(userId: string): Promise<YongsinReading | null> {
  return readJson<YongsinReading | null>(userYongsinReadingKey(userId), null);
}

export async function saveYongsinReading(userId: string, data: YongsinReading): Promise<void> {
  await writeJson(userYongsinReadingKey(userId), data);
}
