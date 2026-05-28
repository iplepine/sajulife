"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 미들웨어가 보호 경로를 막을 때 redirectedFrom 쿼리로 원래 가려던 경로를 넘긴다.
 * 다만 외부 URL이나 잘못된 값으로 인한 오픈 리다이렉트를 막기 위해 내부 경로만 허용.
 */
function sanitizeRedirect(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null; // protocol-relative URL 방어
  return raw;
}

function HomePageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/dashboard";

  // 마운트 시 세션 조회. 이미 로그인되어 있으면 곧장 이동.
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setUserId(u?.id ?? null);
      setIsAnonymous(Boolean(u?.is_anonymous));
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
      // redirectedFrom이 있으면 거기로, 없으면 onboarding으로
      router.replace(sanitizeRedirect(searchParams.get("redirectedFrom")) ?? "/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // 세션 확인 중에는 빈 화면(짧음). 깜빡임 방지.
  if (checking) {
    return (
      <main className="container">
        <p className="muted">세션 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>sajulife</h1>
      <p className="muted">
        AI 사주·기질 리포트 서비스. 로그인 없이 게스트로 시작할 수 있습니다.
      </p>

      <div className="card stack" style={{ marginTop: 24 }}>
        <div>
          {userId ? (
            <>
              현재 세션: <code>{userId.slice(0, 8)}…</code>
              {isAnonymous && <span className="muted"> (익명)</span>}
            </>
          ) : (
            "세션 없음 — 로그인이 필요합니다."
          )}
        </div>
        <button className="btn--primary" onClick={handleGuestLogin} disabled={loading}>
          {loading ? "처리 중…" : userId ? "이어서 시작하기" : "게스트로 시작"}
        </button>
        {error && <p className="error">{error}</p>}
        <p className="muted">
          익명 세션이 Supabase에 등록되며, 입력한 사주·설문·가족 정보는 서버에
          사용자별로 저장됩니다. 추후 이메일/소셜 연결 시 같은 user id가 유지되어
          데이터를 이어쓸 수 있습니다.
        </p>
      </div>
    </main>
  );
}

export default function HomePage() {
  // useSearchParams()는 Suspense 경계가 필요하다 (Next.js 권장).
  return (
    <Suspense fallback={<main className="container"><p className="muted">불러오는 중...</p></main>}>
      <HomePageBody />
    </Suspense>
  );
}
