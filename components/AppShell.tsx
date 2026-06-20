"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * 인증된 앱 화면을 감싸는 반응형 셸.
 * - 데스크톱(≥768): 좌측 사이드바
 * - 모바일(<768): 하단 탭바
 * 랜딩("/")과 인증 흐름("/auth/*")에서는 셸 없이 children만 렌더한다.
 */

type NavItem = { href: string; label: string; match: string[] };

const SIDEBAR: NavItem[] = [
  { href: "/dashboard", label: "대시보드", match: ["/dashboard"] },
  { href: "/tci/report", label: "기질 리포트", match: ["/tci"] },
  { href: "/saju", label: "개인 사주", match: ["/saju"] },
  { href: "/fusion", label: "융합", match: ["/fusion"] },
  { href: "/family", label: "가족", match: ["/family"] },
  { href: "/consult", label: "AI 상담", match: ["/consult"] },
  { href: "/coaching", label: "코칭 플랜", match: ["/coaching"] },
];

const TABS: { href: string; label: string; match: string[] }[] = [
  { href: "/dashboard", label: "홈", match: ["/dashboard"] },
  { href: "/saju", label: "사주", match: ["/saju", "/tci", "/fusion"] },
  { href: "/family", label: "가족", match: ["/family"] },
  { href: "/consult", label: "상담", match: ["/consult"] },
  { href: "/coaching", label: "코칭", match: ["/coaching"] },
  { href: "/account", label: "계정", match: ["/account"] },
];

function isActive(pathname: string, match: string[]): boolean {
  return match.some((m) => pathname === m || pathname.startsWith(m + "/"));
}

function hasChrome(pathname: string): boolean {
  if (pathname === "/") return false;
  if (pathname.startsWith("/auth/")) return false;
  // 공개 공유 페이지는 앱 네비 없이 단독 렌더 (비로그인 방문자)
  if (pathname.startsWith("/share/")) return false;
  return true;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [whoLabel, setWhoLabel] = useState("게스트");

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
        <div className="logo">sajulife</div>
        {SIDEBAR.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`nav-item${isActive(pathname, it.match) ? " on" : ""}`}
          >
            <span className="ic" aria-hidden />
            {it.label}
          </Link>
        ))}
        <Link href="/account" className="who">
          <span className="av" aria-hidden />
          {whoLabel}
        </Link>
      </aside>

      <div className="app-main">{children}</div>

      <nav className="tabbar" aria-label="주요 메뉴">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={isActive(pathname, t.match) ? "on" : ""}
          >
            <span className="ic" aria-hidden />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
