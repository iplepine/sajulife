import type { SajuResult } from "./calculator";
import { seasonOfBranch, type Season as SeasonKo } from "./seasonClock";

export type ThemeSeason = "spring" | "summer" | "autumn" | "winter";

export const SEASON_THEME_COOKIE = "sajulife-season-theme";

const THEME_BY_SEASON: Record<SeasonKo, ThemeSeason> = {
  봄: "spring",
  여름: "summer",
  가을: "autumn",
  겨울: "winter",
};

export function isThemeSeason(value: unknown): value is ThemeSeason {
  return value === "spring" || value === "summer" || value === "autumn" || value === "winter";
}

export function calendarTheme(date = new Date()): ThemeSeason {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/** 현재 대운의 지지(없으면 월지)에서 앱 표면 테마를 고른다. */
export function themeForSaju(saju: SajuResult | null, currentYear: number): ThemeSeason {
  if (!saju) return calendarTheme();
  const current = (saju.daewoon ?? [])
    .filter((period) => period.startYear <= currentYear)
    .sort((a, b) => b.startYear - a.startYear)[0];
  const branch = current?.zhi.hanja ?? saju.pillars.month?.zhi.hanja;
  return branch ? THEME_BY_SEASON[seasonOfBranch(branch).season] : calendarTheme();
}
