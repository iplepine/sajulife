import type { User } from "@supabase/supabase-js";

export type ConfirmationEmailType = "signup" | "email_change";

export type EmailVerificationState =
  | { status: "not-applicable" }
  | { status: "verified"; email: string }
  | { status: "pending"; email: string; confirmationType: ConfirmationEmailType };

/**
 * Supabase User의 이메일 확인 상태를 클라이언트 UI에서 안전하게 표현한다.
 * 익명 계정에 이메일을 연결하는 경우는 `email_change` 확인 절차를 따른다.
 */
export function getEmailVerificationState(user: User | null): EmailVerificationState {
  if (!user) return { status: "not-applicable" };

  const pendingEmail = user.new_email?.trim();
  if (pendingEmail) {
    return { status: "pending", email: pendingEmail, confirmationType: "email_change" };
  }

  const email = user.email?.trim();
  if (!email) return { status: "not-applicable" };

  // 익명 계정에 이메일을 추가한 직후에는 Supabase 설정에 따라 `new_email` 대신
  // `email`만 채워질 수 있다. 이 경우에도 기존 계정의 이메일 변경 확인으로 재전송한다.
  if (user.is_anonymous) {
    return { status: "pending", email, confirmationType: "email_change" };
  }

  if (user.email_confirmed_at || user.confirmed_at) {
    return { status: "verified", email };
  }

  return { status: "pending", email, confirmationType: "signup" };
}

type AuthErrorLike = { code?: unknown; message?: unknown; status?: unknown };

/**
 * Supabase의 내부 오류 문구를 그대로 노출하지 않고, 인증 화면에 맞는 안내로 바꾼다.
 */
export function getAuthErrorMessage(error: unknown, fallback = "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요."): string {
  const candidate = error as AuthErrorLike | null;
  const source = [candidate?.code, candidate?.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (source.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  }
  if (source.includes("email not confirmed")) {
    return "이메일 인증이 아직 완료되지 않았어요. 인증 메일을 확인해주세요.";
  }
  if (source.includes("user already registered") || source.includes("already been registered")) {
    return "이미 가입된 이메일이에요. 로그인하거나 비밀번호를 재설정해주세요.";
  }
  if (source.includes("password") && (source.includes("least") || source.includes("short") || source.includes("weak"))) {
    return "비밀번호는 6자 이상으로 입력해주세요.";
  }
  if (source.includes("rate limit") || source.includes("too many requests") || source.includes("over_request_rate_limit")) {
    return "요청이 많아요. 잠시 후 다시 시도해주세요.";
  }
  if (source.includes("network") || source.includes("fetch")) {
    return "네트워크 연결을 확인한 뒤 다시 시도해주세요.";
  }

  return fallback;
}

export function isEmailUnconfirmedError(error: unknown): boolean {
  const candidate = error as AuthErrorLike | null;
  return [candidate?.code, candidate?.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase()
    .includes("email not confirmed");
}

export type AuthLinkFailureReason = "expired" | "invalid";

/** 인증 콜백의 상세 오류를 URL에 노출하지 않기 위한 최소 분류. */
export function getAuthLinkFailureReason(error: unknown): AuthLinkFailureReason {
  const candidate = error as AuthErrorLike | null;
  const source = [candidate?.code, candidate?.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (
    source.includes("expired") ||
    source.includes("otp_expired") ||
    source.includes("flow_state_expired")
  ) {
    return "expired";
  }

  return "invalid";
}
