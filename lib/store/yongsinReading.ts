import { deleteJson, readJson, writeJson } from "./kv";
import { userYongsinReadingJobKey, userYongsinReadingKey } from "./keys";
import type { ReportJob } from "./types";

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

// ── 비동기 생성 작업(ReportJob) ─────────────────────────────────────────────
// 개인 사주 리포트와 동일한 패턴: 생성이 요청과 분리돼 백그라운드(after)에서 도는 동안
// 진행/실패 상태를 별도 키에 둔다. 성공하면 이 레코드를 지운다(최신 저장본이 완료 신호).
// staleness/TTL 판정은 reports.ts의 순수 헬퍼(isReportJobStale/isReportErrorExpired)를 재사용한다.

export async function getYongsinJob(userId: string): Promise<ReportJob | null> {
  return readJson<ReportJob | null>(userYongsinReadingJobKey(userId), null);
}

export async function setYongsinJob(userId: string, job: ReportJob): Promise<void> {
  await writeJson(userYongsinReadingJobKey(userId), job);
}

export async function clearYongsinJob(userId: string): Promise<void> {
  await deleteJson(userYongsinReadingJobKey(userId));
}
