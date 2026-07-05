// KV 네임스페이스
// - prompts: 전역 프롬프트 스토어 (5종 PromptConfig: 4리포트 + consult)
// - user:{scopeId}:{kind}: 인물별 입력 데이터 (profile / tci / family)
//   ※ `tci`는 레거시 키(약식 응답). 신규 코드는 user:{scopeId}:tci:{variant} 사용.
// - user:{scopeId}:tci:{variant}: TCI 응답 (short / full)
// - user:{scopeId}:report:{reportKind}: 인물별 저장된 리포트 (tci/personal/family/fusion)
// - user:{scopeId}:consults: 단건 상담 리포트 히스토리 (SavedConsult[], 최신순)
// - user:{scopeId}:actions: 코칭 액션 플랜 (ActionItem[], 최신순)
// - user:{scopeId}:consult-basis: 상담 근거 — 리포트 종류별 요약 모음 (ConsultBasisDoc)
// - user:{userId}:people: 계정의 인물 목록 + 활성 인물 (PeopleStore). ★항상 real userId 키★
//
// scopeId는 활성 인물을 반영한 데이터 스코프다(lib/store/scope.ts):
//   본인(self)  → bare userId (레거시 데이터 그대로)
//   추가 인물   → `${userId}:p:${personId}`
// userId는 Supabase auth.uid() (UUID).

import type { ReportKind, TciVariant } from "./types";

export const PROMPTS_KEY = "prompts";

/** 계정의 인물 목록 + 활성 인물 — user:{userId}:people. ★스코프 대상 아님(항상 real userId).★ */
export function userPeopleKey(userId: string): string {
  return `user:${userId}:people`;
}

export type UserDataKind = "profile" | "tci" | "family";

export function userKey(userId: string, kind: UserDataKind): string {
  return `user:${userId}:${kind}`;
}

export function userReportKey(userId: string, kind: ReportKind): string {
  return `user:${userId}:report:${kind}`;
}

/** 리포트 비동기 생성 작업 상태 — user:{userId}:report-job:{kind} → ReportJob. */
export function userReportJobKey(userId: string, kind: ReportKind): string {
  return `user:${userId}:report-job:${kind}`;
}

export function userTciKey(userId: string, variant: TciVariant): string {
  return `user:${userId}:tci:${variant}`;
}

export function userConsultsKey(userId: string): string {
  return `user:${userId}:consults`;
}

/** 코칭 액션 플랜 — user:{userId}:actions → ActionItem[] (최신순). */
export function userActionsKey(userId: string): string {
  return `user:${userId}:actions`;
}

/** 상담 근거 모음 — user:{userId}:consult-basis → ConsultBasisDoc. */
export function userConsultBasisKey(userId: string): string {
  return `user:${userId}:consult-basis`;
}

/**
 * 용신 풀이 — user:{userId}:yongsin-reading → YongsinReading.
 * 4종 리포트(ReportKind)와 달리 공유·상담근거에 엮지 않는 단독 풀이라 별도 키로 둔다.
 */
export function userYongsinReadingKey(userId: string): string {
  return `user:${userId}:yongsin-reading`;
}

/** 용신 풀이 비동기 생성 작업 상태 — user:{userId}:yongsin-reading-job → ReportJob. */
export function userYongsinReadingJobKey(userId: string): string {
  return `user:${userId}:yongsin-reading-job`;
}

/** 공개 공유 스냅샷 — share:{token} → ShareSnapshot. 비로그인 열람용이라 userId를 키에 넣지 않는다. */
export function shareKey(token: string): string {
  return `share:${token}`;
}

/** (user, kind)당 발급된 공유 토큰 1개를 가리키는 역방향 키 — 재공유 시 같은 링크 재사용. 값 = token. */
export function userShareKey(userId: string, kind: ReportKind): string {
  return `user:${userId}:share:${kind}`;
}
