import { isReportGenerationFailure, isInvalidSavedReport } from "@/lib/report/guards";
import { deleteJson, readJson, writeJson } from "./kv";
import { userReportJobKey, userReportKey } from "./keys";
import type { ReportJob, ReportKind, SavedReport } from "./types";

/**
 * 저장된 리포트 조회. 없으면 null.
 */
export async function getSavedReport(
  userId: string,
  kind: ReportKind,
): Promise<SavedReport | null> {
  const key = userReportKey(userId, kind);
  const saved = await readJson<SavedReport | null>(key, null);
  if (isInvalidSavedReport(saved)) {
    if (saved) await deleteJson(key);
    return null;
  }
  return saved;
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
  if (isReportGenerationFailure(data.report)) {
    throw new Error("실패 응답은 풀이로 저장하지 않습니다.");
  }
  await writeJson(userReportKey(userId, kind), data);
}

// ── 비동기 생성 작업(ReportJob) ─────────────────────────────────────────────
// 생성이 요청과 분리돼 백그라운드에서 도는 동안, 진행/실패 상태를 별도 키에 둔다.
// 성공하면 이 레코드를 지운다(최신 SavedReport가 완료 신호). 실패면 error로 남긴다.

/** generating이 이 시간을 넘기면 백그라운드 작업이 죽은 것으로 간주 — 폴링 무한 대기 방지. */
const REPORT_JOB_STALE_MS = 3 * 60 * 1000;
/** error 상태를 이 시간 이상 노출하지 않는다 — 오래된 실패가 매 방문마다 뜨는 것 방지. */
const REPORT_ERROR_TTL_MS = 10 * 60 * 1000;

export async function getReportJob(userId: string, kind: ReportKind): Promise<ReportJob | null> {
  return readJson<ReportJob | null>(userReportJobKey(userId, kind), null);
}

export async function setReportJob(userId: string, kind: ReportKind, job: ReportJob): Promise<void> {
  await writeJson(userReportJobKey(userId, kind), job);
}

export async function clearReportJob(userId: string, kind: ReportKind): Promise<void> {
  await deleteJson(userReportJobKey(userId, kind));
}

/** generating 작업이 stale(백그라운드가 죽음)인지. */
export function isReportJobStale(job: ReportJob): boolean {
  return Date.now() - new Date(job.startedAt).getTime() > REPORT_JOB_STALE_MS;
}

/** error 작업을 더 이상 노출하지 않아도 되는지(오래됨). */
export function isReportErrorExpired(job: ReportJob): boolean {
  return Date.now() - new Date(job.startedAt).getTime() > REPORT_ERROR_TTL_MS;
}
