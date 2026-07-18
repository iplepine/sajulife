"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import PageLoading from "@/components/PageLoading";

function LoginBody() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/dashboard";

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setIsAnonymous(Boolean(u?.is_anonymous));
      if (u && !u.is_anonymous) router.replace(next);
    });
    return () => { mounted = false; };
  }, [supabase, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-inner">
        <h1>로그인</h1>
        <p className="lead">이메일과 비밀번호로 로그인합니다.</p>

        {isAnonymous && (
          <div className="card card-flat mt4">
            <p className="muted" style={{ margin: 0 }}>
              현재 게스트로 이용 중입니다. 다른 계정으로 로그인하면 게스트 데이터는 더 이상 보이지 않아요.
              데이터를 유지하려면 <Link href="/auth/signup">회원가입(전환)</Link>을 이용하세요.
            </p>
          </div>
        )}

        <form className="card mt4" onSubmit={handleSubmit}>
          <div className="field">
            <label>이메일</label>
            <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>비밀번호</label>
            <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
          <button className="btn btn-primary btn-block mt4" disabled={loading}>{loading ? "로그인 중…" : "로그인"}</button>
        </form>

        <p className="muted" style={{ marginTop: 16, textAlign: "center" }}>
          계정이 없으신가요? <Link href="/auth/signup">회원가입</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-page"><PageLoading label="로그인 화면을 준비하고 있어요" /></main>}>
      <LoginBody />
    </Suspense>
  );
}
