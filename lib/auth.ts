import { createClient } from "./supabase/server";

/**
 * 현재 세션의 user.id를 반환한다. 익명/정식 사용자 모두 동일하게 처리.
 * 세션이 없으면 null.
 */
export async function getUserIdOrNull(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * 인증된 user.id를 반환하거나 에러를 throw한다. 보호된 API 라우트에서 사용.
 */
export async function requireUserId(): Promise<string> {
  const id = await getUserIdOrNull();
  if (!id) {
    throw new AuthRequiredError("로그인 세션이 없습니다.");
  }
  return id;
}

export class AuthRequiredError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

/**
 * 현재 세션의 user.email을 반환한다. 세션 없으면 null.
 */
export async function getUserEmailOrNull(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.email ?? null;
}

/**
 * 관리자 이메일 화이트리스트.
 * 환경변수 ADMIN_EMAILS (쉼표 구분)로만 설정. 미설정·빈값이면 관리자가 없는
 * fail-closed 상태가 되어 모든 편집이 차단된다 — 운영팀 누락보다 보안이 안전.
 * 비교는 대소문자 무시.
 */
function adminEmailList(): string[] {
  const env = process.env.ADMIN_EMAILS;
  if (!env) return [];
  return env
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** 현재 세션이 관리자 권한을 가졌는지. */
export async function isAdminUser(): Promise<boolean> {
  const email = await getUserEmailOrNull();
  if (!email) return false;
  return adminEmailList().includes(email.toLowerCase());
}
