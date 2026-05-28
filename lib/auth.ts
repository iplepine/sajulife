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
