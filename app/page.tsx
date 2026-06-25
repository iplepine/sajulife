"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/safe-redirect";

function HomePageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/dashboard";

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setUserId(u?.id ?? null);
      setChecking(false);
      if (u) router.replace(redirectTo);
    });
    return () => {
      mounted = false;
    };
  }, [supabase, router, redirectTo]);

  async function handleGuestLogin() {
    setLoading(true);
    setError(null);
    try {
      const { data: existing } = await supabase.auth.getUser();
      if (!existing.user) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
      }
      router.replace(sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="landing">
        <p className="muted">세션 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="landing">
      <div className="landing-inner">
        <div className="landing-duo-wrap" aria-hidden="true">
          <img className="landing-duo" src="/brand-icons/persona-duo.png" alt="" draggable={false} />
        </div>
        <div className="ohaeng landing-ohaeng">
          <span className="wood" /><span className="fire" /><span className="earth" /><span className="metal" /><span className="water" />
        </div>
        <div className="landing-kicker">
          사주언니 × 기질오빠
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.3, margin: "14px 0 0" }}>
          나의 사주와 기질을,<br />AI가 차분히 풀어줍니다.
        </h1>
        <p className="lead mt4" style={{ fontSize: 15.5 }}>
          진로, 관계, 이직 — 지금의 고민에<br />위로와 방향을 함께 드릴게요.
        </p>

        <div className="card mt5" style={{ padding: "12px 16px" }}>
          <div className="row gap3">
            <span className="el-dot wood" />
            <span style={{ fontSize: 13.5 }}>4가지 AI 리포트 · 익명 게스트 시작</span>
          </div>
        </div>

        <div className="grow" />

        <button className="btn btn-primary btn-block mt5" onClick={handleGuestLogin} disabled={loading}>
          {loading ? "처리 중…" : userId ? "이어서 시작하기" : "게스트로 시작하기"}
        </button>
        {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}

        <div className="row center gap4" style={{ marginTop: 14 }}>
          <Link href={`/auth/login?redirectedFrom=${encodeURIComponent(redirectTo)}`}>이메일로 로그인</Link>
          <Link href={`/auth/signup?redirectedFrom=${encodeURIComponent(redirectTo)}`}>이메일로 회원가입</Link>
        </div>
        <p className="hint" style={{ textAlign: "center", marginTop: 14 }}>
          가입 없이 익명으로 시작해요. 정보는 안전하게 보관됩니다.
        </p>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="landing"><p className="muted">불러오는 중...</p></main>}>
      <HomePageBody />
    </Suspense>
  );
}
