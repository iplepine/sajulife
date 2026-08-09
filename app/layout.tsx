import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import GenerationCenter from "@/components/GenerationCenter";
import GlobalProgress from "@/components/GlobalProgress";
import { SEASON_THEME_COOKIE } from "@/lib/saju/seasonTheme";
import "./globals.css";

export const metadata: Metadata = {
  title: "sajulife — 사주로 읽고, 다음 선택을 설계하다",
  description: "사주와 기질을 바탕으로 삶의 고민을 정리하고 다음 행동을 함께 설계하는 AI 인생 컨설팅 서비스",
};

// 모바일 스케일 + iPhone 노치/홈 인디케이터 영역 활용. 다크 모드 대응(라이트/다크 themeColor).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#15140f" },
  ],
};

// 서버에서 쿠키를 읽으면 전체 앱이 동적 렌더가 된다. 파서가 body를 그리기 전에 실행되는
// 이 스크립트로만 안전한 계절 값 4개를 허용해, 전환 뒤 첫 페인트를 맞춘다.
const APPLY_THEME_FROM_COOKIE = `(function(){var p=location.pathname;if(p==='/'||p.indexOf('/auth/')===0||p.indexOf('/share/')===0)return;var m=document.cookie.match(/(?:^|; )${SEASON_THEME_COOKIE}=([^;]+)/);var s=m&&decodeURIComponent(m[1]);if(s!=='spring'&&s!=='summer'&&s!=='autumn'&&s!=='winter'){var n=new Date().getMonth()+1;s=n>=3&&n<=5?'spring':n>=6&&n<=8?'summer':n>=9&&n<=11?'autumn':'winter';}document.documentElement.dataset.seasonTheme=s;})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPLY_THEME_FROM_COOKIE }} />
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
        <GenerationCenter />
        <Analytics />
      </body>
    </html>
  );
}
