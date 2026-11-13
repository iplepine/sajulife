/**
 * 음력 윤달 — 같은 '음력 5월'이라도 윤5월은 한 달 뒤라 월주(태어난 달 기둥)가 달라질 수 있다.
 * 2026-11-14 UT: 음력 입력에 윤달 선택이 없어 윤달생이 조용히 평달로 계산되던 문제를 막는다.
 *
 * 입력 폼(클라이언트)에서도 쓰므로 lunar-javascript를 끌어오지 않고 표로 둔다.
 * 표는 lunar-javascript의 LunarYear.getLeapMonth()로 만들었고, lunarLeap.test.ts가 같은지 지킨다.
 */

/** 음력 연도 → 윤달 월 (1900~2100, 윤달 있는 해만). */
export const LEAP_MONTH_BY_YEAR: Readonly<Record<number, number>> = {
  1900: 8, 1903: 5, 1906: 4, 1909: 2, 1911: 6, 1914: 5, 1917: 2, 1919: 7, 1922: 5, 1925: 4, 1928: 2, 1930: 6, 1933: 5, 1936: 3, 1938: 7, 1941: 6, 1944: 4, 1947: 2, 1949: 7, 1952: 5, 1955: 3, 1957: 8, 1960: 6, 1963: 4, 1966: 3, 1968: 7, 1971: 5, 1974: 4, 1976: 8, 1979: 6, 1982: 4, 1984: 10, 1987: 6, 1990: 5, 1993: 3, 1995: 8, 1998: 5, 2001: 4, 2004: 2, 2006: 7, 2009: 5, 2012: 4, 2014: 9, 2017: 6, 2020: 4, 2023: 2, 2025: 6, 2028: 5, 2031: 3, 2033: 11, 2036: 6, 2039: 5, 2042: 2, 2044: 7, 2047: 5, 2050: 3, 2052: 8, 2055: 6, 2058: 4, 2061: 3, 2063: 7, 2066: 5, 2069: 4, 2071: 8, 2074: 6, 2077: 4, 2080: 3, 2082: 7, 2085: 5, 2088: 4, 2090: 8, 2093: 6, 2096: 4, 2099: 2,
};

/** 그 음력 해의 윤달 월(1~12). 윤달이 없는 해면 0. */
export function leapMonthOf(lunarYear: number): number {
  return LEAP_MONTH_BY_YEAR[lunarYear] ?? 0;
}

/** 이 음력 연·월에 윤달이 실제로 있는가 — 윤달 선택지를 보여줄지 정한다. */
export function hasLeapMonth(lunarYear: number, month: number): boolean {
  return month > 0 && leapMonthOf(lunarYear) === month;
}

type LeapInput = { calendar: string; birthDate?: string; isLeapMonth?: boolean };

/** 실제로 윤달로 계산해야 하는가 — 음력 + 윤달 체크 + 그 해에 그 윤달이 있음. */
export function isEffectiveLeapMonth(p: LeapInput): boolean {
  if (p.calendar !== "lunar" || !p.isLeapMonth || !p.birthDate) return false;
  const [y, m] = p.birthDate.split("-").map(Number);
  return hasLeapMonth(y, m);
}

/** 화면·프롬프트에 쓰는 달력 이름 — "양력" / "음력" / "음력 윤달". */
export function calendarLabel(p: LeapInput): string {
  if (p.calendar !== "lunar") return "양력";
  return isEffectiveLeapMonth(p) ? "음력 윤달" : "음력";
}
