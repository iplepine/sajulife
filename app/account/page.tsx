"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return <main className="container">불러오는 중...</main>;

  const isAnonymous = Boolean(user?.is_anonymous);
  const isMember = Boolean(user && !user.is_anonymous);

  return (
    <main className="container">
      <h1>계정</h1>

      <div className="card stack" style={{ marginTop: 16 }}>
        <div>
          <div className="muted">상태</div>
          <div>{isMember ? "정식 회원" : isAnonymous ? "게스트 (익명)" : "세션 없음"}</div>
        </div>
        {isMember && user?.email && (
          <div>
            <div className="muted">이메일</div>
            <div>{user.email}</div>
          </div>
        )}
        {user && (
          <div>
            <div className="muted">사용자 ID</div>
            <code>{user.id}</code>
          </div>
        )}
      </div>

      {isAnonymous && (
        <div className="card stack" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600 }}>회원으로 전환</div>
          <p className="muted" style={{ margin: 0 }}>
            이메일을 등록하면 지금까지 입력한 데이터를 그대로 유지하면서 회원이 됩니다.
            기기를 바꿔도 같은 계정으로 이어서 이용할 수 있습니다.
          </p>
          <Link
            href="/auth/signup"
            className="btn--primary"
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            이메일로 회원 전환
          </Link>
        </div>
      )}

      <div className="stack" style={{ marginTop: 16 }}>
        <button
          className="btn--ghost"
          onClick={handleSignOut}
          disabled={signingOut}
          style={{ color: "var(--danger)" }}
        >
          {signingOut ? "로그아웃 중…" : "로그아웃"}
        </button>
      </div>
    </main>
  );
}
