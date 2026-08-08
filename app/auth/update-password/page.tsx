"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth-client-utils";
import PageLoading from "@/components/PageLoading";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(Boolean(data.session));
      setChecking(false);
    }).catch(() => {
      if (mounted) setChecking(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("비밀번호는 6자 이상으로 입력해주세요.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("새 비밀번호가 서로 달라요.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setComplete(true);
      setPassword("");
      setPasswordConfirmation("");
    } catch (updateError) {
      setError(getAuthErrorMessage(updateError, "새 비밀번호를 저장하지 못했어요. 링크를 다시 요청해주세요."));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <main className="auth-page"><PageLoading label="재설정 링크를 확인하고 있어요" /></main>;
  }

  if (!hasSession) {
    return (
      <main className="auth-page">
        <div className="auth-inner">
          <h1>재설정 링크가 만료됐어요</h1>
          <div className="card mt4">
            <p style={{ margin: 0 }}>링크가 만료되었거나 이미 사용되었어요. 새 메일을 요청한 뒤 가장 최근 링크를 열어주세요.</p>
            <Link href="/auth/forgot-password" className="btn btn-primary btn-block mt4" style={{ textDecoration: "none" }}>
              재설정 메일 다시 받기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (complete) {
    return (
      <main className="auth-page">
        <div className="auth-inner">
          <h1>비밀번호를 바꿨어요</h1>
          <div className="card mt4">
            <p style={{ margin: 0 }}>새 비밀번호로 다음 로그인부터 계정을 계속 이용할 수 있어요.</p>
            <Link href="/dashboard" className="btn btn-primary btn-block mt4" style={{ textDecoration: "none" }}>
              홈으로 가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-inner">
        <h1>새 비밀번호 설정</h1>
        <p className="lead">본인 확인이 끝난 상태예요. 새 비밀번호를 6자 이상으로 입력해주세요.</p>

        <form className="card mt4" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="new-password">새 비밀번호</label>
            <input
              id="new-password"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="new-password-confirmation">새 비밀번호 확인</label>
            <input
              id="new-password-confirmation"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
            />
          </div>
          {error && <p className="error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block mt4" disabled={loading}>
            {loading ? "저장 중…" : "새 비밀번호 저장"}
          </button>
        </form>
      </div>
    </main>
  );
}
