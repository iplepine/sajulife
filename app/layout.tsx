import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import GlobalProgress from "@/components/GlobalProgress";
import "./globals.css";

export const metadata: Metadata = {
  title: "sajulife — AI 사주·기질 리포트",
  description: "나의 사주와 기질을 AI가 차분히 풀어주는 서비스",
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
        {/* Pretendard — 한글 타이포가 화면을 이끈다 */}
        <link
          rel="stylesheet"
          as="style"
          // eslint-disable-next-line @next/next/no-page-custom-font
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>
        <GlobalProgress />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
