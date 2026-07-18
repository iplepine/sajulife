"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import { trackEvent } from "@/lib/analytics";
import PageLoading from "@/components/PageLoading";

type Outcome = null | "signup-confirm" | "guest-linked";

function SignupBody() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);

  const next = sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/dashboard";

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setIsAnonymous(Boolean(u?.is_anonymous));
      setChecking(false);
      if (u && !u.is_anonymous) router.replace(next);
    });
    return () => { mounted = false; };
  }, [supabase, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cleanEmail = email.trim();
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;

      if (isAnonymous) {
        const { data, error: updateError } = await supabase.auth.updateUser(
          { email: cleanEmail, password },
          { emailRedirectTo }
        );
        if (updateError) throw updateError;
        trackEvent("signup", { from: "guest" });
        if (data.user && !data.user.is_anonymous) { router.replace(next); return; }
        setOutcome("guest-linked");
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail, password, options: { emailRedirectTo },
        });
        if (signUpError) throw signUpError;
        trackEvent("signup");
        if (data.session) { router.replace(next); return; }
        setOutcome("signup-confirm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <main className="auth-page"><p className="muted">세션 확인 중...</p></main>;
  }

  if (outcome === "guest-linked" || outcome === "signup-confirm") {
    return (
      <main className="auth-page">
        <div className="auth-inner">
          <h1>인증 메일을 보냈어요</h1>
          <div className="card mt4">
            <p style={{ margin: 0 }}>
              <code>{email}</code>로 인증 메일을 보냈습니다. 메일의 링크를 클릭하면{" "}
              {outcome === "guest-linked" ? "게스트 계정이 정식 회원으로 전환됩니다." : "가입이 완료됩니다."}
            </p>
            {outcome === "guest-linked" && (
              <p className="muted" style={{ margin: "12px 0 0" }}>
                전환되어도 같은 계정이 유지되므로, 입력한 사주·설문·가족·풀이가 그대로 남습니다.
              </p>
            )}
            <Link
              href={outcome === "guest-linked" ? "/dashboard" : "/auth/login"}
              className="btn btn-primary btn-block mt4"
              style={{ textDecoration: "none" }}
            >
              {outcome === "guest-linked" ? "홈으로" : "로그인 화면으로"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-inner">
        <h1>{isAnonymous ? "회원으로 전환" : "회원가입"}</h1>
        <p className="lead">
          {isAnonymous
            ? "이메일과 비밀번호를 등록하면 게스트로 입력한 데이터를 그대로 유지하면서 회원이 됩니다."
            : "이메일과 비밀번호로 가입합니다."}
        </p>

        <form className="card mt4" onSubmit={handleSubmit}>
          <div className="field">
            <label>이메일</label>
            <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>비밀번호 (6자 이상)</label>
            <input className="input" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block mt4" disabled={loading}>
            {loading ? "처리 중…" : isAnonymous ? "회원으로 전환하기" : "회원가입"}
          </button>
        </form>

        {!isAnonymous && (
          <p className="muted" style={{ marginTop: 16, textAlign: "center" }}>
            이미 계정이 있으신가요? <Link href="/auth/login">로그인</Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="auth-page"><PageLoading label="회원가입 화면을 준비하고 있어요" /></main>}>
      <SignupBody />
    </Suspense>
  );
}
