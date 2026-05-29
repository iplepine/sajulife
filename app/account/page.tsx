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
    return () => { mounted = false; };
  }, [supabase]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return <div className="page muted">불러오는 중...</div>;

  const isAnonymous = Boolean(user?.is_anonymous);
  const isMember = Boolean(user && !user.is_anonymous);

  return (
    <div className="page-narrow">
      <h2 className="h-app">계정</h2>

      <div className="card mt4">
        <div className="field" style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 12 }}>상태</div>
          <div style={{ fontWeight: 700 }}>{isMember ? "정식 회원" : isAnonymous ? "게스트 (익명)" : "세션 없음"}</div>
        </div>
        {isMember && user?.email && (
          <div className="field" style={{ marginBottom: 12 }}>
            <div className="muted" style={{ fontSize: 12 }}>이메일</div>
            <div>{user.email}</div>
          </div>
        )}
        {user && (
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="muted" style={{ fontSize: 12 }}>사용자 ID</div>
            <code style={{ wordBreak: "break-all" }}>{user.id}</code>
          </div>
        )}
      </div>

      {isAnonymous && (
        <div className="card mt4">
          <div style={{ fontWeight: 700 }}>회원으로 전환</div>
          <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
            이메일을 등록하면 지금까지 입력한 데이터를 그대로 유지하면서 회원이 됩니다.
            기기를 바꿔도 같은 계정으로 이어서 이용할 수 있어요.
          </p>
          <Link href="/auth/signup" className="btn btn-primary btn-block mt4" style={{ textDecoration: "none" }}>
            이메일로 회원 전환
          </Link>
        </div>
      )}

      <button className="btn btn-danger btn-block mt5" onClick={handleSignOut} disabled={signingOut}>
        {signingOut ? "로그아웃 중…" : "로그아웃"}
      </button>
    </div>
  );
}
