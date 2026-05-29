"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/safe-redirect";

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

  // 세션 확인. 이미 정식 회원이면 이동. 게스트(익명)면 "전환" 모드로 동작.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setIsAnonymous(Boolean(u?.is_anonymous));
      setChecking(false);
      if (u && !u.is_anonymous) router.replace(next);
    });
    return () => {
      mounted = false;
    };
  }, [supabase, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cleanEmail = email.trim();
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;

      if (isAnonymous) {
        // 게스트 → 회원 전환: 기존 익명 계정에 이메일/비밀번호를 연동한다.
        // user.id가 그대로 유지되므로 게스트로 입력한 사주/설문/가족/리포트가 보존된다.
        const { data, error: updateError } = await supabase.auth.updateUser(
          { email: cleanEmail, password },
          { emailRedirectTo }
        );
        if (updateError) throw updateError;
        // 이메일 확인이 꺼진 환경에서는 즉시 정식 회원이 되어(is_anonymous=false) email이 적용된다 → 바로 이동.
        // 확인이 켜진 환경에서는 아직 익명이고 new_email 확인 대기 상태 → 인증 메일 안내 화면.
        if (data.user && !data.user.is_anonymous) {
          router.replace(next);
          return;
        }
        setOutcome("guest-linked");
      } else {
        // 신규 회원가입.
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo },
        });
        if (signUpError) throw signUpError;
        // 이메일 확인이 꺼진 환경에서는 즉시 세션이 생긴다 → 바로 이동.
        if (data.session) {
          router.replace(next);
          return;
        }
        setOutcome("signup-confirm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="container">
        <p className="muted">세션 확인 중...</p>
      </main>
    );
  }

  if (outcome === "guest-linked") {
    return (
      <main className="container">
        <h1>인증 메일을 보냈어요</h1>
        <div className="card stack" style={{ marginTop: 16 }}>
          <p style={{ margin: 0 }}>
            <code>{email}</code>로 인증 메일을 보냈습니다. 메일의 링크를 클릭하면
            게스트 계정이 정식 회원으로 전환됩니다.
          </p>
          <p className="muted" style={{ margin: 0 }}>
            전환되어도 같은 계정이 유지되므로, 지금까지 입력한 사주·설문·가족 정보와
            리포트가 그대로 남습니다. 인증 전에도 계속 이용할 수 있습니다.
          </p>
          <Link href="/dashboard" className="btn--primary" style={{ textAlign: "center", textDecoration: "none" }}>
            대시보드로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  if (outcome === "signup-confirm") {
    return (
      <main className="container">
        <h1>인증 메일을 보냈어요</h1>
        <div className="card stack" style={{ marginTop: 16 }}>
          <p style={{ margin: 0 }}>
            <code>{email}</code>로 인증 메일을 보냈습니다. 메일의 링크를 클릭해
            가입을 완료해주세요.
          </p>
          <Link href="/auth/login" className="muted" style={{ textAlign: "center" }}>
            로그인 화면으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>{isAnonymous ? "회원으로 전환" : "회원가입"}</h1>
      <p className="muted">
        {isAnonymous
          ? "이메일과 비밀번호를 등록하면 게스트로 입력한 데이터를 그대로 유지하면서 회원이 됩니다."
          : "이메일과 비밀번호로 가입합니다."}
      </p>

      <form className="card stack" style={{ marginTop: 16 }} onSubmit={handleSubmit}>
        <label>
          <span>이메일</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label>
          <span>비밀번호 (6자 이상)</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <button className="btn--primary btn--block" disabled={loading}>
          {loading ? "처리 중…" : isAnonymous ? "회원으로 전환하기" : "회원가입"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      {!isAnonymous && (
        <p className="muted" style={{ marginTop: 16 }}>
          이미 계정이 있으신가요? <Link href="/auth/login">로그인</Link>
        </p>
      )}
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <p className="muted">불러오는 중...</p>
        </main>
      }
    >
      <SignupBody />
    </Suspense>
  );
}
