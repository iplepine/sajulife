import Link from "next/link";

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const expired = reason === "expired";

  return (
    <main className="auth-page">
      <div className="auth-inner">
        <h1>{expired ? "인증 링크가 만료됐어요" : "인증 링크를 확인할 수 없어요"}</h1>
        <div className="card mt4">
          <p style={{ margin: 0 }}>
            {expired
              ? "인증 링크는 한 번만 사용할 수 있고 유효 시간이 지나면 만료됩니다. 새 메일을 요청한 뒤 가장 최근 링크를 열어주세요."
              : "링크가 이미 사용되었거나 올바르지 않을 수 있습니다. 가장 최근에 받은 메일의 링크를 다시 열어주세요."}
          </p>
          <div className="row gap2 mt4">
            <Link href="/auth/login" className="btn btn-primary" style={{ textDecoration: "none" }}>로그인</Link>
            <Link href="/auth/signup" className="btn btn-ghost" style={{ textDecoration: "none" }}>회원가입</Link>
          </div>
          <Link href="/auth/forgot-password" style={{ display: "inline-block", marginTop: 16 }}>
            비밀번호 재설정 메일 받기
          </Link>
        </div>
      </div>
    </main>
  );
}
