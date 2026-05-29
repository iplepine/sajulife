"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/safe-redirect";

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

  // 이미 정식 회원으로 로그인된 상태면 곧장 이동. 게스트(익명)는 머무르게 둔다.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setIsAnonymous(Boolean(u?.is_anonymous));
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>로그인</h1>
      <p className="muted">이메일과 비밀번호로 로그인합니다.</p>

      {isAnonymous && (
        <div className="card" style={{ marginTop: 16, background: "#fffbe6" }}>
          <p className="muted" style={{ margin: 0 }}>
            현재 게스트로 이용 중입니다. 다른 계정으로 로그인하면 게스트로 입력한
            데이터는 더 이상 보이지 않습니다. 게스트 데이터를 유지하려면{" "}
            <Link href="/auth/signup">회원가입(전환)</Link>을 이용하세요.
          </p>
        </div>
      )}

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
          <span>비밀번호</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <button className="btn--primary btn--block" disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      <p className="muted" style={{ marginTop: 16 }}>
        계정이 없으신가요? <Link href="/auth/signup">회원가입</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <p className="muted">불러오는 중...</p>
        </main>
      }
    >
      <LoginBody />
    </Suspense>
  );
}
