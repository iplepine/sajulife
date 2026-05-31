import { isAdminUser } from "@/lib/auth";

/**
 * 관리자 권한이 있을 때만 children을 렌더링한다.
 * 권한 없으면 안내 화면을 보여준다.
 *
 * 서버 컴포넌트 — 클라이언트가 DOM을 받기 전 차단하므로,
 * 비관리자는 편집 UI 자체를 못 본다.
 */
export default async function AdminOnly({ children }: { children: React.ReactNode }) {
  const ok = await isAdminUser();
  if (!ok) {
    return (
      <main className="page-narrow">
        <h1 className="h-app">권한 없음</h1>
        <p className="muted mt3">
          이 페이지는 관리자만 접근할 수 있어요. 잘못 들어왔다면 홈으로 돌아가 주세요.
        </p>
        <a href="/" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>
          홈으로
        </a>
      </main>
    );
  }
  return <>{children}</>;
}
