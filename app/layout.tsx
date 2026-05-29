import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "sajulife — 사주 리포트 프로토타입",
  description: "AI 사주 리포트 프롬프트 튜닝 프로토타입",
};

// 모바일에서 올바른 스케일로 렌더되도록 viewport 지정.
// viewportFit: cover 로 iPhone 노치/홈 인디케이터 영역까지 활용 (safe-area-inset CSS와 짝).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="top" aria-label="주요 메뉴">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/onboarding">사주 정보</Link>
          <Link href="/tci">기질 검사</Link>
          <Link href="/saju">개인 사주</Link>
          <Link href="/family">가족 사주</Link>
          <Link href="/fusion">기질+사주</Link>
          <Link href="/consult">상담하기</Link>
          <Link href="/account">계정</Link>
          <span className="nav-spacer" aria-hidden />
          <Link href="/tci/debug" className="nav-debug">tci debug</Link>
          <Link href="/saju/debug" className="nav-debug">saju debug</Link>
          <Link href="/family/debug" className="nav-debug">family debug</Link>
          <Link href="/fusion/debug" className="nav-debug">fusion debug</Link>
          <Link href="/consult/debug" className="nav-debug">consult debug</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
