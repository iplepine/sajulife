"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import PageLoading from "@/components/PageLoading";
import { formatWon, PACKAGE_STEPS, SAJU_TCI_PACKAGE } from "@/lib/package/product";


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
      // 로그인 후 첫 화면은 홈 — 사주+기질 풀이가 메인이고, 거기서 결제 → 사주 정보 입력으로 이어진다.
      router.replace(sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="ink-landing">
        <p className="ink-landing-muted">세션 확인 중...</p>
      </main>
    );
  }

  // ★로그인 전 첫 화면은 흰 바탕 + 검은 궁서체★(2026-10-08 대표 결정). 계절 테마·풍경 그림은
  // 로그인한 뒤의 앱 화면에만 쓴다 — 첫인상은 '먹으로 쓴 한 장'처럼 단정하게.
  return (
    <main className="ink-landing">
      <div className="ink-landing-inner">
        <p className="ink-landing-brand">sajulife</p>
        <p className="ink-landing-kicker">사주 + 기질</p>
        <h1 className="ink-landing-title">
          <span>타고난 나와</span>
          <span>요즘의 나,</span>
          <span>겹쳐서 올해를 읽다</span>
        </h1>
        <p className="ink-landing-lead">
          사주로 원래의 결을 읽고, 기질 검사로 요즘의 나를 재요. 둘을 겹쳐 올해와 내년을 풀어드려요.
        </p>

        <ol className="ink-landing-steps" aria-label="풀이 순서">
          {PACKAGE_STEPS.map((step) => (
            <li key={step.step}>
              <span className="ink-landing-step-no" aria-hidden>{step.step}</span>
              <span className="ink-landing-step-copy">
                <strong>{step.title}</strong>
                <span>{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="ink-landing-price">
          {SAJU_TCI_PACKAGE.name} · {formatWon(SAJU_TCI_PACKAGE.price)}
        </p>

        <div className="grow" />
        <button className="ink-landing-cta" onClick={handleGuestLogin} disabled={loading}>
          {loading ? "처리 중…" : userId ? "이어서 시작하기" : "시작하기"}
        </button>
        {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}

        <div className="ink-landing-links">
          <Link href={`/auth/login?redirectedFrom=${encodeURIComponent(redirectTo)}`}>이메일로 로그인</Link>
          <Link href={`/auth/signup?redirectedFrom=${encodeURIComponent(redirectTo)}`}>이메일로 회원가입</Link>
        </div>
        <p className="ink-landing-muted ink-landing-center">가입 없이 익명으로 시작해요.</p>

        <p className="ink-landing-notice" role="note">
          풀이·상담을 만들면 입력한 출생 정보와 고민이 OpenAI에 전송돼요. OpenAI가 일시적으로 불가하면 Gemini에 전송될 수 있어요. 공유 링크는 누구나 열 수 있어요.
        </p>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="ink-landing"><PageLoading label="시작 화면을 준비하고 있어요" /></main>}>
      <HomePageBody />
    </Suspense>
  );
}
