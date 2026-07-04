import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import GlobalProgress from "@/components/GlobalProgress";
import "./globals.css";

export const metadata: Metadata = {
  title: "사주언니 × 기질오빠 — 사주·기질 풀이",
  description: "사주언니와 기질오빠가 나의 사주와 기질을 차분히 풀어주는 서비스",
};

// 모바일 스케일 + iPhone 노치/홈 인디케이터 영역 활용. 다크 모드 대응(라이트/다크 themeColor).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#15140f" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard — UI / Gowun — 브랜드 톤 / Noto Serif KR — 풀이 본문 / Gothic A1 — 숫자·스탯 */}
        <link
          rel="stylesheet"
          as="style"
          // eslint-disable-next-line @next/next/no-page-custom-font
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        <link
          rel="stylesheet"
          // eslint-disable-next-line @next/next/no-page-custom-font
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;400;700&family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&family=Noto+Serif+KR:wght@400;600;700&display=swap"
        />
      </head>
      <body>
        <GlobalProgress />
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
