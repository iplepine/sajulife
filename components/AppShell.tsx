"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import BottomTabIcon, { type BottomTabIconName } from "@/components/BottomTabIcon";
import SeasonThemeProvider from "@/components/SeasonThemeProvider";
import PersonSwitcher from "@/components/PersonSwitcher";

/**
 * 인증된 앱 화면을 감싸는 반응형 셸.
 * - 데스크톱(≥768): 스튜디오 공통 상단 내비게이션
 * - 모바일(<768): 하단 탭바
 * 랜딩("/")과 인증 흐름("/auth/*")에서는 셸 없이 children만 렌더한다.
 */

type NavItem = { href: string; label: string; match: string[]; icon: BrandIconName; tabIcon: BottomTabIconName };

// 모바일에서도 핵심 상품과 저장본으로 바로 돌아갈 수 있게 '내 풀이'를 둔다.
const NAV: NavItem[] = [
  { href: "/dashboard", label: "홈", match: ["/dashboard"], icon: "dashboard", tabIcon: "home" },
  { href: "/materials", label: "내 풀이", match: ["/materials", "/history", "/saju", "/tci", "/fusion", "/explore/personal", "/explore/temperament", "/explore/fusion", "/explore/yongsin", "/onboarding", "/checkout"], icon: "saju", tabIcon: "reports" },
  { href: "/consult", label: "용신상담", match: ["/consult", "/coaching", "/explore/consult"], icon: "consult", tabIcon: "consult" },
  { href: "/family", label: "가족", match: ["/family", "/compat", "/explore/family", "/explore/compat"], icon: "family", tabIcon: "family" },
  { href: "/account", label: "마이", match: ["/account"], icon: "account", tabIcon: "account" },
];

function isActive(pathname: string, match: string[]): boolean {
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}

function hasChrome(pathname: string): boolean {
  if (pathname === "/") return false;
  if (pathname.startsWith("/auth/")) return false;
  // 공개 공유 페이지는 앱 네비 없이 단독 렌더 (비로그인 방문자)
  if (pathname.startsWith("/share/")) return false;
  // 드래곤 시안 선택 페이지는 자체 폰 프레임을 풀스크린으로 보여줘야 하므로 셸 없이 단독 렌더
  if (pathname === "/home-dragon-designs" || pathname === "/home-impact-designs" || pathname === "/home-report-designs") return false;
  return true;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (!hasChrome(pathname)) return <SeasonThemeProvider>{children}</SeasonThemeProvider>;

  return (
    <SeasonThemeProvider>
    <div className="app-shell modern-app-shell">
      <header className="studio-header" aria-label="서비스 상단">
        <div className="studio-header-inner">
          <Link className="studio-logo" href="/dashboard" aria-label="sajulife 홈">sajulife</Link>
          <nav className="studio-nav" aria-label="공간 메뉴">
            {[
              { href: "/dashboard", label: "나의 공간", match: ["/dashboard"] },
              { href: "/materials", label: "내 풀이", match: ["/materials", "/history", "/saju", "/tci", "/fusion", "/onboarding", "/checkout", "/explore/personal", "/explore/temperament", "/explore/fusion", "/explore/yongsin"] },
              { href: "/consult", label: "관계와 상담", match: ["/consult", "/family", "/compat", "/coaching", "/explore/family", "/explore/compat", "/explore/consult"] },
            ].map((item) => <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.match) ? "page" : undefined}>{item.label}</Link>)}
          </nav>
          <div className="studio-account">
            <PersonSwitcher nameOnly refreshOnOpen reloadPath={pathname === "/consult" ? "/consult" : undefined} />
            <Link href="/account" className="studio-account-link">마이</Link>
            <Link href="/notifications" className="studio-notice" aria-label="알림 보기"><BrandIcon name="notification" /></Link>
          </div>
        </div>
      </header>

      <div className="app-main">{children}</div>

      <nav className="tabbar" aria-label="주요 메뉴">
        {NAV.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`tabbar-item tabbar-item--${t.tabIcon}${isActive(pathname, t.match) ? " on" : ""}`}
            aria-current={isActive(pathname, t.match) ? "page" : undefined}
          >
            <BottomTabIcon name={t.tabIcon} />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
    </SeasonThemeProvider>
  );
}
