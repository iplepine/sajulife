"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import BottomTabIcon, { type BottomTabIconName } from "@/components/BottomTabIcon";
import SeasonThemeProvider from "@/components/SeasonThemeProvider";
import { createClient } from "@/lib/supabase/client";

/**
 * 인증된 앱 화면을 감싸는 반응형 셸.
 * - 데스크톱(≥768): 좌측 사이드바
 * - 모바일(<768): 하단 탭바
 * 랜딩("/")과 인증 흐름("/auth/*")에서는 셸 없이 children만 렌더한다.
 */

type NavItem = { href: string; label: string; match: string[]; icon: BrandIconName; tabIcon: BottomTabIconName };

// 4탭 구조. ★'기록' 탭을 뺐다★ — 홈 퀵액션이 이미 개인사주·용신상담·가족·기질 진입로를
// 전부 들고 있어서, 기록 탭은 같은 문을 하나 더 낸 것에 가까웠다.
// 풀이 목록(/materials)은 라우트로 살아 있고 마이에서 들어간다 — 진입로가 아니라
// "내가 뭘 뽑아놨나"를 보는 상태 화면이라 재방문 가치가 따로 있다.
const NAV: NavItem[] = [
  { href: "/dashboard", label: "홈", match: ["/dashboard"], icon: "dashboard", tabIcon: "home" },
  { href: "/consult", label: "용신상담", match: ["/consult"], icon: "consult", tabIcon: "consult" },
  { href: "/family", label: "가족", match: ["/family"], icon: "family", tabIcon: "family" },
  { href: "/account", label: "마이", match: ["/account", "/materials"], icon: "account", tabIcon: "account" },
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
  const [whoLabel, setWhoLabel] = useState("게스트");
  const showMobileTopbar = pathname !== "/dashboard";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      if (u.is_anonymous) setWhoLabel("게스트");
      else setWhoLabel(u.email ?? "회원");
    });
  }, [pathname]);

  if (!hasChrome(pathname)) return <SeasonThemeProvider>{children}</SeasonThemeProvider>;

  return (
    <SeasonThemeProvider>
    <div className="app-shell">
      <aside className="sidebar" aria-label="주요 메뉴">
        <div className="brand-lockup" aria-label="사주언니 × 기질오빠">
          <span className="brand-lockup-icons">
            <BrandIcon name="saju-unni" />
            <BrandIcon name="gijil-oppa" />
          </span>
          <span className="brand-lockup-copy">
            <span className="brand-wordmark">사주언니 × 기질오빠</span>
            <span className="brand-system-name">SAJULIFE</span>
          </span>
        </div>
        {NAV.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`nav-item${isActive(pathname, it.match) ? " on" : ""}`}
          >
            <BrandIcon name={it.icon} />
            {it.label}
          </Link>
        ))}
        <Link href="/account" className="who">
          <span className="av" aria-hidden />
          {whoLabel}
        </Link>
      </aside>

      {showMobileTopbar && (
        <header className="mobile-topbar" aria-label="브랜드">
          <div className="mobile-brand" aria-label="사주언니 × 기질오빠">
            <span className="mobile-brand-icons">
              <BrandIcon name="saju-unni" />
              <BrandIcon name="gijil-oppa" />
            </span>
            <span className="mobile-logo">사주언니 × 기질오빠</span>
          </div>
        </header>
      )}

      <div className="app-main">{children}</div>

      <nav className="tabbar" aria-label="주요 메뉴">
        {NAV.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`tabbar-item tabbar-item--${t.tabIcon}${isActive(pathname, t.match) ? " on" : ""}`}
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
