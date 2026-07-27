"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { SajuResult } from "@/lib/saju/calculator";
import { seasonOfBranch, type Season as SeasonKo } from "@/lib/saju/seasonClock";

type ThemeSeason = "spring" | "summer" | "autumn" | "winter";

const THEME_BY_SEASON: Record<SeasonKo, ThemeSeason> = {
  봄: "spring",
  여름: "summer",
  가을: "autumn",
  겨울: "winter",
};

function calendarTheme(): ThemeSeason {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function personalTheme(saju: SajuResult | null, currentYear: number): ThemeSeason {
  if (!saju) return calendarTheme();
  const current = (saju.daewoon ?? [])
    .filter((period) => period.startYear <= currentYear)
    .sort((a, b) => b.startYear - a.startYear)[0];
  const branch = current?.zhi.hanja ?? saju.pillars.month?.zhi.hanja;
  return branch ? THEME_BY_SEASON[seasonOfBranch(branch).season] : calendarTheme();
}

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

    apply(calendarTheme());
    if (pathname === "/" || pathname.startsWith("/auth/") || pathname.startsWith("/share/")) {
      return () => controller.abort();
    }
    void fetch("/api/saju/chart", { signal: controller.signal })
      .then(async (response) => response.ok ? await response.json() as { saju?: SajuResult | null; currentYear?: number } : null)
      .then((payload) => {
        if (payload) apply(personalTheme(payload.saju ?? null, payload.currentYear ?? new Date().getFullYear()));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [pathname]);

  return <>{children}</>;
}
