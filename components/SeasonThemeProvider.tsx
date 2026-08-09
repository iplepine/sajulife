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
      const root = document.documentElement;
      if (root.dataset.seasonTheme === season) return;

      // 첫 진입에는 기본 계절색 → 개인 계절색으로 카드마다 천천히 번지는 인상을 막는다.
      // CSS 변수는 한 프레임에 바꾸고, 그 프레임에만 모든 개별 전환을 끈다.
      root.dataset.seasonThemeApplying = "true";
      void root.offsetWidth;
      root.dataset.seasonTheme = season;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => delete root.dataset.seasonThemeApplying);
      });
    };

    if (pathname === "/" || pathname.startsWith("/auth/") || pathname.startsWith("/share/")) {
      apply(calendarTheme());
      return () => controller.abort();
    }
    // 쿠키가 없을 때 달력 계절을 먼저 칠하지 않는다. 개인 사주 응답이 오면 그 색으로
    // 단 한 번 확정해, 여름 파랑이 먼저 보였다가 다른 색으로 번지는 깜빡임을 없앤다.
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
