"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-client-utils";

const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || remaining > 0) return;

    setLoading(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/auth/update-password")}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (resetError) throw resetError;

      // 등록 여부를 드러내지 않아 이메일 주소 추측에 악용되지 않게 한다.
      setSent(true);
      setRemaining(COOLDOWN_SECONDS);
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError, "재설정 메일을 보낼 수 없어요. 잠시 후 다시 시도해주세요."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-inner">
        <h1>비밀번호 재설정</h1>
        <p className="lead">가입한 이메일로 새 비밀번호를 설정할 수 있는 링크를 보냅니다.</p>

        <form className="card mt4" onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="reset-email">이메일</label>
            <input
              id="reset-email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {sent && (
            <p className="hint" role="status" style={{ marginTop: 12 }}>
              계정이 있다면 재설정 링크를 보냈어요. 받은편지함과 스팸함을 확인해주세요.
            </p>
          )}
          {error && <p className="error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block mt4" disabled={loading || remaining > 0}>
            {loading ? "메일 보내는 중…" : remaining > 0 ? `다시 보내기 (${remaining}초)` : sent ? "재설정 메일 다시 보내기" : "재설정 메일 보내기"}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 16, textAlign: "center" }}>
          비밀번호가 기억나셨나요? <Link href="/auth/login">로그인</Link>
        </p>
      </div>
    </main>
  );
}
