"use client";

import { Suspense, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirect } from "@/lib/safe-redirect";
import PageLoading from "@/components/PageLoading";

const STEMS = ["甲", "丁", "戊", "己", "丙", "辛", "癸", "乙"];

function HomePageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/dashboard";
  const month = new Date().getMonth() + 1;
  const season = month >= 3 && month <= 5
    ? { key: "spring", art: "/hero-art/life-path-spring-wide-v1.png", orb: "/hero-art/orbs/seasonal-orb-spring-v1.png", constellation: "/hero-art/orbs/stem-constellation-spring-v1.svg", stem: "甲" }
    : month >= 6 && month <= 8
      ? { key: "summer", art: "/hero-art/life-path-summer-wide-v1.png", orb: "/hero-art/orbs/seasonal-orb-summer-v1.png", constellation: "/hero-art/orbs/stem-constellation-summer-v1.svg", stem: "壬" }
      : month >= 9 && month <= 11
        ? { key: "autumn", art: "/hero-art/life-path-autumn-wide-v1.png", orb: "/hero-art/orbs/seasonal-orb-autumn-v1.png", constellation: "/hero-art/orbs/stem-constellation-autumn-v1.svg", stem: "戊" }
        : { key: "winter", art: "/hero-art/life-path-winter-wide-v1.png", orb: "/hero-art/orbs/seasonal-orb-winter-v1.png", constellation: "/hero-art/orbs/stem-constellation-winter-v1.svg", stem: "癸" };

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
    <main className={`landing life-path-landing life-path-landing--${season.key}`}>
      <img className="life-path-landing-art" src={season.art} alt="" draggable={false} />
      <div className="landing-inner life-path-landing-inner">
        <div className="life-path-landing-stems" aria-hidden>{STEMS.join(" ")}</div>
        <div className="landing-kicker">SAJULIFE · LIFE CONSULTING</div>
        <h1>사주로 나를 읽고,<br />다음 선택을 설계해요.</h1>
        <p className="lead">사주와 기질을 바탕으로 지금의 고민을 정리하고, 내 삶에 맞는 행동까지 함께 찾아갑니다.</p>
        <div className="life-path-stems life-path-landing-constellation" aria-hidden>
          <img className="life-path-stem-lines" src={season.constellation} alt="" draggable={false} />
          <img className="life-path-orb" src={season.orb} alt="" draggable={false} />
          <span className="life-path-orb-character">{season.stem}</span>
          {STEMS.map((stem, index) => <span className="life-path-stem" key={stem} style={{ "--stem-index": index } as CSSProperties}>{stem}</span>)}
        </div>
        <div className="grow" />
        <button className="btn btn-primary btn-block life-path-landing-cta" onClick={handleGuestLogin} disabled={loading}>
          {loading ? "처리 중…" : userId ? "이어서 시작하기" : "내 인생 흐름 읽기"}
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
    <Suspense fallback={<main className="landing"><PageLoading label="시작 화면을 준비하고 있어요" /></main>}>
      <HomePageBody />
    </Suspense>
  );
}
