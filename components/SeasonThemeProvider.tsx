"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { SajuResult } from "@/lib/saju/calculator";
import { calendarTheme, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";

/**
 * 개인의 현재 대운(없으면 월지) 계절을 앱 전역 CSS 토큰에 연결한다.
 * 사주 정보가 없거나 인증 전에는 달력 계절을 안전한 기본값으로 쓴다.
 */
export default function SeasonThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    const apply = (season: ThemeSeason) => {
      document.documentElement.dataset.seasonTheme = season;
    };

    if (pathname === "/" || pathname.startsWith("/auth/") || pathname.startsWith("/share/")) {
      apply(calendarTheme());
      return () => controller.abort();
    }
    // 인물 전환 직후에는 서버가 심어둔 쿠키 테마가 이미 첫 화면부터 적용돼 있다.
    // 여기서 달력 계절로 되돌렸다가 차트 응답을 기다리면 색이 한 번 튀고 늦게 느껴진다.
    if (!document.documentElement.dataset.seasonTheme) apply(calendarTheme());
    void fetch("/api/saju/chart", { signal: controller.signal })
      .then(async (response) => response.ok ? await response.json() as { saju?: SajuResult | null; currentYear?: number } : null)
      .then((payload) => {
        if (payload) apply(themeForSaju(payload.saju ?? null, payload.currentYear ?? new Date().getFullYear()));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [pathname]);

  return <>{children}</>;
}
