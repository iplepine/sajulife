"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import { createClient } from "@/lib/supabase/client";

/**
 * 인증된 앱 화면을 감싸는 반응형 셸.
 * - 데스크톱(≥768): 좌측 사이드바
 * - 모바일(<768): 하단 탭바
 * 랜딩("/")과 인증 흐름("/auth/*")에서는 셸 없이 children만 렌더한다.
 */

type NavItem = { href: string; label: string; match: string[]; icon: BrandIconName };

const SIDEBAR: NavItem[] = [
  { href: "/dashboard", label: "홈", match: ["/dashboard"], icon: "dashboard" },
  { href: "/materials", label: "풀이", match: ["/materials", "/saju", "/tci", "/fusion", "/family", "/onboarding"], icon: "saju" },
  { href: "/history", label: "기록", match: ["/history", "/consult", "/coaching"], icon: "consult" },
  { href: "/account", label: "계정", match: ["/account"], icon: "account" },
];

const TABS: NavItem[] = [
  { href: "/dashboard", label: "홈", match: ["/dashboard"], icon: "dashboard" },
  { href: "/materials", label: "풀이", match: ["/materials", "/saju", "/tci", "/fusion", "/family", "/onboarding"], icon: "saju" },
  { href: "/history", label: "기록", match: ["/history", "/consult", "/coaching"], icon: "consult" },
  { href: "/account", label: "계정", match: ["/account"], icon: "account" },
];

function isActive(pathname: string, match: string[]): boolean {
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}

function hasChrome(pathname: string): boolean {
  if (pathname === "/") return false;
  if (pathname.startsWith("/auth/")) return false;
  // 공개 공유 페이지는 앱 네비 없이 단독 렌더 (비로그인 방문자)
  if (pathname.startsWith("/share/")) return false;
  // 홈 리디자인 결정 페이지는 자체 폰 프레임을 풀스크린으로 보여줘야 하므로 셸 없이 단독 렌더
  if (pathname === "/home-redesign") return false;
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

  if (!hasChrome(pathname)) return <>{children}</>;

  return (
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
        {SIDEBAR.map((it) => (
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
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={isActive(pathname, t.match) ? "on" : ""}
          >
            <BrandIcon name={t.icon} />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
