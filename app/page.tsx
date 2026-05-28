"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 현재 세션 조회
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setIsAnonymous(Boolean(data.user?.is_anonymous));
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleGuestLogin() {
    setLoading(true);
    setError(null);
    try {
      // 이미 세션이 있으면 그대로 진행
      const { data: existing } = await supabase.auth.getUser();
      if (!existing.user) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) throw signInError;
      }
      router.push("/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>sajulife</h1>
      <p className="muted">
        AI 사주 리포트 프롬프트 튜닝 프로토타입. 로그인 없이 게스트로 시작합니다.
      </p>

      <div className="card stack" style={{ marginTop: 24 }}>
        <div>
          {userId ? (
            <>
              현재 세션: <code>{userId.slice(0, 8)}…</code>
              {isAnonymous && <span className="muted"> (익명)</span>}
            </>
          ) : (
            "세션 없음"
          )}
        </div>
        <button className="btn--primary" onClick={handleGuestLogin} disabled={loading}>
          {loading ? "처리 중…" : userId ? "이어서 시작하기" : "게스트로 시작"}
        </button>
        {error && (
          <p style={{ color: "var(--danger, crimson)" }}>{error}</p>
        )}
        <p className="muted">
          익명 세션이 Supabase에 등록되며, 입력한 사주/설문/가족 정보는 KV에
          <code>user:{`{userId}`}:profile</code> 등의 키로 저장됩니다. 추후
          이메일/소셜 연결 시 같은 user id가 유지되어 데이터를 이어쓸 수 있습니다.
        </p>
      </div>
    </main>
  );
}
