import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirect } from "@/lib/safe-redirect";

/**
 * 이메일 인증 콜백.
 *
 * Supabase가 보내는 인증 메일 링크가 최종적으로 이 라우트로 돌아온다. 두 가지 형태를 모두 지원:
 *  - PKCE 플로우: `?code=...`        → exchangeCodeForSession  (@supabase/ssr 브라우저 클라이언트 기본값)
 *  - OTP 플로우:  `?token_hash=&type=` → verifyOtp            (이메일 템플릿을 token_hash로 커스텀한 경우)
 *
 * 성공하면 세션 쿠키가 설정되고 `next`(기본 /dashboard)로 리다이렉트한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeRedirect(searchParams.get("next")) ?? "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/auth/auth-error", origin));
}
