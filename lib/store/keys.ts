// KV 네임스페이스
// - prompts: 전역 프롬프트 스토어 (5종 PromptConfig: 4리포트 + consult)
// - user:{userId}:{kind}: 사용자별 입력 데이터 (profile / tci / family)
// - user:{userId}:report:{reportKind}: 사용자별 저장된 리포트 (tci/personal/family/fusion)
// - user:{userId}:consults: 단건 상담 리포트 히스토리 (SavedConsult[], 최신순)
//   userId는 Supabase auth.uid() (UUID)

import type { ReportKind } from "./types";

export const PROMPTS_KEY = "prompts";

export type UserDataKind = "profile" | "tci" | "family";

export function userKey(userId: string, kind: UserDataKind): string {
  return `user:${userId}:${kind}`;
}

export function userReportKey(userId: string, kind: ReportKind): string {
  return `user:${userId}:report:${kind}`;
}

export function userConsultsKey(userId: string): string {
  return `user:${userId}:consults`;
}
