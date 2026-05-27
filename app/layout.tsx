import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "sajulife — 사주 리포트 프로토타입",
  description: "AI 사주 리포트 프롬프트 튜닝 프로토타입",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="top">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/onboarding">사주 정보</Link>
          <Link href="/tci">기질 검사</Link>
          <Link href="/saju">개인 사주</Link>
          <Link href="/family">가족 사주</Link>
          <Link href="/fusion">기질+사주</Link>
          <span style={{ flex: 1 }} />
          <Link href="/tci/debug">tci debug</Link>
          <Link href="/saju/debug">saju debug</Link>
          <Link href="/family/debug">family debug</Link>
          <Link href="/fusion/debug">fusion debug</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
