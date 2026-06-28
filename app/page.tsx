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

    // 세션 확인이 auth 락/네트워크로 지연돼도(예: 로그아웃 직후) 화면이
    // "세션 확인 중..."에 영구히 갇히지 않도록, 타임아웃으로 랜딩을 강제 노출한다.
    const fallback = setTimeout(() => {
      if (mounted) setChecking(false);
    }, 2000);

    // getUser()는 매번 서버 검증(네트워크)을 해 지연·hang에 취약하다. 랜딩은
    // "이미 로그인된 사용자를 대시보드로 보낼지"만 판단하면 되고, 보호 경로는
    // 미들웨어가 서버에서 다시 getUser로 검증하므로 로컬 getSession이면 충분하다.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        clearTimeout(fallback);
        const u = data.session?.user ?? null;
        setUserId(u?.id ?? null);
        setChecking(false);
        if (u) router.replace(redirectTo);
      })
      .catch(() => {
        if (!mounted) return;
        clearTimeout(fallback);
        setChecking(false);
      });

    return () => {
      mounted = false;
      clearTimeout(fallback);
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
          나의 사주와 기질을,<br />언니오빠가 차분히 풀어줍니다.
        </h1>
        <p className="lead mt4" style={{ fontSize: 15.5 }}>
          진로, 관계, 이직 — 지금의 고민에<br />위로와 방향을 함께 드릴게요.
        </p>

        <div className="card mt5" style={{ padding: "12px 16px" }}>
          <div className="row gap3">
            <span className="el-dot wood" />
            <span style={{ fontSize: 13.5 }}>상담 · 사주/기질 기준 정보</span>
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
