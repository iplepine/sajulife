import { readJson, writeJson } from "./kv";
import { userReportKey } from "./keys";
import type { ReportKind, SavedReport } from "./types";

/**
 * 저장된 리포트 조회. 없으면 null.
 */
export async function getSavedReport(
  userId: string,
  kind: ReportKind,
): Promise<SavedReport | null> {
  return readJson<SavedReport | null>(userReportKey(userId, kind), null);
}

/**
 * 리포트 저장 (덮어쓰기).
 * 동일 종류 리포트를 다시 생성하면 이전 결과는 덮어쓴다 — 히스토리는 유지하지 않는다.
 */
export async function saveReport(
  userId: string,
  kind: ReportKind,
  data: SavedReport,
): Promise<void> {
  await writeJson(userReportKey(userId, kind), data);
}
