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
  // 게스트 로그아웃은 한 번 더 묻는다 — 익명 사용자는 다시 들어올 수단이 없다.
  const [confirmingGuestSignOut, setConfirmingGuestSignOut] = useState(false);

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

  /**
   * ★게스트에게 가장 중요한 안내는 맨 아래가 아니라 맨 위에 둔다.★
   * 예전엔 이 카드가 마이 화면 맨 아래(카드 5장 밑)에 있어서, 설문·가족을 공들여 넣은 게스트도
   * "브라우저 데이터를 지우면 복구 못 한다"는 사실을 거의 보지 못했다.
   */
  const guestConversionCard = isAnonymous ? (
    <div className="card mt4 account-guest-card">
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
  ) : null;

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

      {guestConversionCard}

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

      {/* ★재방문 동선의 고정 진입로★ — /history는 화면이 있어도 찾아갈 길이 없었다.
          '풀이 기록'(/materials)은 ★풀이★를 모아 보는 곳이고, 여기는 ★액션·상담★이다.
          같은 이름으로 부르면 사용자가 액션을 찾다가 풀이 목록에 도착한다.
          기록이 0건이어도, 액션 후보가 없어 등록 컴포넌트가 안 뜨는 화면에서도 이 링크는 남는다. */}
      <div className="card mt4">
        <div style={{ fontWeight: 700 }}>저장한 액션·지난 상담</div>
        <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
          풀이에서 담아둔 실천 액션과, 지금까지 나눈 상담을 여기서 다시 꺼내 볼 수 있어.
        </p>
        <Link href="/history" className="btn btn-ghost btn-block" style={{ textDecoration: "none" }}>
          액션·상담 기록 보기
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

      {/* ★게스트 로그아웃은 되돌릴 수 없다★ — 익명 사용자는 이메일·비밀번호가 없어서, 로그아웃하면
          같은 브라우저에서도 그 데이터로 다시 들어올 방법이 없다(다음 시작은 새 익명 사용자다).
          그래서 게스트는 한 번 더 묻고, 먼저 회원 전환을 권한다. 회원은 다시 로그인하면 되므로 바로 나간다. */}
      {isAnonymous && confirmingGuestSignOut ? (
        <section className="card mt5 account-signout-confirm" role="alertdialog" aria-labelledby="guest-signout-title" aria-describedby="guest-signout-desc">
          <strong id="guest-signout-title">로그아웃하면 지금 데이터를 다시 못 찾아요</strong>
          <p id="guest-signout-desc">
            게스트는 이메일·비밀번호가 없어서, 로그아웃하면 이 브라우저에서도 다시 들어올 방법이 없어요.
            입력한 사주 정보·설문 응답·가족·풀이가 모두 보이지 않게 돼요.
          </p>
          {!pendingGuestConversion && (
            <Link href="/auth/signup" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
              이메일로 회원 전환하고 지키기
            </Link>
          )}
          <div className="row gap2 mt3">
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmingGuestSignOut(false)} autoFocus>
              취소
            </button>
            <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "로그아웃 중…" : "그래도 로그아웃"}
            </button>
          </div>
        </section>
      ) : (
        <button
          className="btn btn-danger btn-block mt5"
          onClick={() => (isAnonymous ? setConfirmingGuestSignOut(true) : void handleSignOut())}
          disabled={signingOut}
        >
          {signingOut ? "로그아웃 중…" : "로그아웃"}
        </button>
      )}
    </div>
  );
}
