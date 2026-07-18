"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import PeopleManager from "@/components/PeopleManager";
import { createClient } from "@/lib/supabase/client";
import PageLoading from "@/components/PageLoading";

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
    // 로컬 세션(쿠키)부터 확실히 지운다. 기본 scope("global")은 토큰 폐기
    // 네트워크 요청을 하면서 auth 락을 쥐고, 그 요청이 지연되면 ① 로컬 세션
    // 제거가 그 뒤라 로그아웃이 안 되고 ② 랜딩의 세션 확인이 같은 락을 기다리다
    // "세션 확인 중..."에 갇혔다. local scope는 네트워크 없이 즉시 락을 푼다.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    router.replace("/");
  }

  if (loading) return <main className="page"><PageLoading label="내 정보를 불러오고 있어요" /></main>;

  const isAnonymous = Boolean(user?.is_anonymous);
  const isMember = Boolean(user && !user.is_anonymous);

  return (
    <div className="page-narrow">
      <h2 className="h-app">내 정보</h2>

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

      <PeopleManager />

      <div className="card mt4">
        <div style={{ fontWeight: 700 }}>내 만세력 원본</div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
          풀이에 쓰이는 사주 원국·대운·세운·월운을 그대로 펼쳐서 볼 수 있어. 정확한 만세력 기준이라 어디 가서 봐도 같은 값이야.
        </p>
        <Link href="/saju/manseryeok" className="btn btn-ghost btn-block" style={{ textDecoration: "none" }}>
          내 만세력 펼쳐보기
        </Link>
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
