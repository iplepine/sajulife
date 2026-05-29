import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="container">
      <h1>인증에 실패했어요</h1>
      <div className="card stack" style={{ marginTop: 16 }}>
        <p style={{ margin: 0 }}>
          인증 링크가 만료되었거나 이미 사용되었을 수 있습니다. 다시 시도해주세요.
        </p>
        <div className="row">
          <Link href="/auth/login" className="btn--primary" style={{ textDecoration: "none" }}>
            로그인
          </Link>
          <Link href="/auth/signup" className="muted">
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}
