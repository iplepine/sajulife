/**
 * 기운 판정(억부·조후) 기준 버전 — 풀이를 저장할 때 같이 남긴다.
 *
 * 2: 2026-10-25 점검(전문가 견본 甲午 丙寅 己未 丁卯 대조) — 억부는 지지 속 지장간까지 비중대로 세고,
 *    돕는 기운(인성)이 넘쳐 센 사주엔 관을 용신에서 뺀다. 조후는 봄·가을 과열과, 이미 불(물)이 넉넉한
 *    겨울(여름)생을 본다. 기준 케이스는 lib/saju/judgment.test.ts.
 *
 * 화면의 처방판·분석 칸은 늘 지금 기준으로 다시 계산하므로, 옛 기준으로 쓴 풀이 글과 다를 수 있다.
 * 저장본에 이 값이 없거나 낮으면 화면이 "판정 기준을 손봤어" 안내를 붙인다.
 */
export const JUDGMENT_VERSION = 2;

/** 이 저장본이 지금 판정 기준보다 먼저 쓰였나. 저장본이 없으면 false. */
export function isOldJudgment(saved: { judgment?: number } | null | undefined): boolean {
  return !!saved && (saved.judgment ?? 1) < JUDGMENT_VERSION;
}
