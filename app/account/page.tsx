"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import PeopleManager from "@/components/PeopleManager";
import { createClient } from "@/lib/supabase/client";
import PageLoading from "@/components/PageLoading";
import ResendConfirmationButton from "@/components/ResendConfirmationButton";
import { getEmailVerificationState } from "@/lib/auth-client-utils";

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
  const emailVerification = getEmailVerificationState(user);
  const pendingGuestConversion = isAnonymous && emailVerification.status === "pending";

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
        {emailVerification.status !== "not-applicable" && (
          <div className="field" style={{ marginBottom: user ? 12 : 0 }}>
            <div className="muted" style={{ fontSize: 12 }}>이메일 인증</div>
            <div style={{ fontWeight: 700 }}>
              {emailVerification.status === "verified" ? "인증 완료" : "인증 대기"}
            </div>
            {emailVerification.status === "verified" ? (
              <p className="hint" style={{ marginBottom: 0 }}>
                인증된 이메일로 새 기기에서도 로그인해 데이터를 이어갈 수 있어요.
              </p>
            ) : (
              <p className="hint" style={{ marginBottom: 0 }}>
                {emailVerification.email}로 보낸 가장 최근 인증 메일을 열어주세요.
              </p>
            )}
          </div>
        )}
      </div>

      {emailVerification.status === "pending" && (
        <div className="card mt4">
          <div style={{ fontWeight: 700 }}>이메일 인증을 완료해주세요</div>
          <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
            인증을 마쳐야 이메일로 계정을 복구하거나 새 기기에서 이어서 이용할 수 있어요. 인증 전에는 로그아웃하거나 브라우저 데이터를 지우지 마세요.
          </p>
          <ResendConfirmationButton
            email={emailVerification.email}
            confirmationType={emailVerification.confirmationType}
          />
        </div>
      )}

      <PeopleManager />

      {/* 하단 '기록' 탭을 없애면서 여기로 옮겼다 — 진입로는 홈이 다 갖고 있고,
          이 화면의 값어치는 "내가 뭘 뽑아놨나"를 한눈에 보는 상태 목록 쪽이다. */}
      <div className="card mt4">
        <div style={{ fontWeight: 700 }}>내 풀이 모아보기</div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
          지금까지 뽑은 풀이를 한자리에서 다시 보고, 아직 없는 건 여기서 이어서 시작할 수 있어.
        </p>
        <Link href="/materials" className="btn btn-ghost btn-block" style={{ textDecoration: "none" }}>
          내 풀이 보러 가기
        </Link>
      </div>

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
          <div style={{ fontWeight: 700 }}>{pendingGuestConversion ? "회원 전환 인증 대기" : "회원으로 전환"}</div>
          <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
            {pendingGuestConversion
              ? "인증 메일을 열면 현재 게스트 계정이 같은 사용자 ID를 유지한 채 회원으로 전환됩니다. 전환이 끝날 때까지 이 브라우저에서 로그아웃하거나 사이트 데이터를 지우지 마세요."
              : "게스트 데이터는 지금 사용 중인 브라우저 세션에 연결돼 있어요. 기기를 바꾸거나 브라우저 데이터를 지우면 복구하지 못할 수 있으니, 이메일을 등록해 회원으로 전환해주세요."}
          </p>
          {!pendingGuestConversion && (
            <Link href="/auth/signup" className="btn btn-primary btn-block mt4" style={{ textDecoration: "none" }}>
              이메일로 회원 전환
            </Link>
          )}
        </div>
      )}

      {isMember && (
        <div className="card mt4">
          <div style={{ fontWeight: 700 }}>비밀번호</div>
          <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
            비밀번호를 잊었거나 새로 설정하려면 이메일로 재설정 링크를 받을 수 있어요.
          </p>
          <Link href="/auth/forgot-password" className="btn btn-ghost btn-block" style={{ textDecoration: "none" }}>
            비밀번호 재설정
          </Link>
        </div>
      )}

      <button className="btn btn-danger btn-block mt5" onClick={handleSignOut} disabled={signingOut}>
        {signingOut ? "로그아웃 중…" : "로그아웃"}
      </button>
    </div>
  );
}
