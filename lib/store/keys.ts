// KV 네임스페이스
// - prompts: 전역 프롬프트 스토어 (5종 PromptConfig: 4리포트 + consult)
// - user:{userId}:{kind}: 사용자별 입력 데이터 (profile / tci / family)
//   ※ `tci`는 레거시 키(약식 응답). 신규 코드는 user:{userId}:tci:{variant} 사용.
// - user:{userId}:tci:{variant}: TCI 응답 (short / full)
// - user:{userId}:report:{reportKind}: 사용자별 저장된 리포트 (tci/personal/family/fusion)
// - user:{userId}:consults: 단건 상담 리포트 히스토리 (SavedConsult[], 최신순)
// - user:{userId}:actions: 코칭 액션 플랜 (ActionItem[], 최신순)
//   userId는 Supabase auth.uid() (UUID)

import type { ReportKind, TciVariant } from "./types";

export const PROMPTS_KEY = "prompts";

export type UserDataKind = "profile" | "tci" | "family";

export function userKey(userId: string, kind: UserDataKind): string {
  return `user:${userId}:${kind}`;
}

export function userReportKey(userId: string, kind: ReportKind): string {
  return `user:${userId}:report:${kind}`;
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

/** 공개 공유 스냅샷 — share:{token} → ShareSnapshot. 비로그인 열람용이라 userId를 키에 넣지 않는다. */
export function shareKey(token: string): string {
  return `share:${token}`;
}

/** (user, kind)당 발급된 공유 토큰 1개를 가리키는 역방향 키 — 재공유 시 같은 링크 재사용. 값 = token. */
export function userShareKey(userId: string, kind: ReportKind): string {
  return `user:${userId}:share:${kind}`;
}
