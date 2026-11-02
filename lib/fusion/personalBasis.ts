import type { SajuResult } from "../saju/calculator";
import type { SavedReport } from "../store/types";
import { JUDGMENT_VERSION } from "../saju/judgmentVersion";
import { parsePersonalReport } from "../report/types";

export const NO_PERSONAL_READING_BASIS = "참고 가능한 1차 사주 서술 없음. 위 계산 자료만 사용하고 이전 풀이 내용을 추측하지 않는다.";

/** 같은 출생 정보·명식·판정 기준의 저장본만 최종 풀이의 참고 해석으로 사용한다. */
export function personalReadingBasisForPrompt(saved: SavedReport | null, saju: SajuResult): string {
  if (!saved || saved.judgment !== JUDGMENT_VERSION || !saved.meta || typeof saved.meta !== "object") return NO_PERSONAL_READING_BASIS;
  const previous = (saved.meta as { saju?: Partial<SajuResult> }).saju;
  if (!previous?.input || !previous.pillars) return NO_PERSONAL_READING_BASIS;
  const keys = ["birthDate", "birthTime", "birthTimeKnown", "calendar", "gender", "calculationBirthDate", "calculationBirthTime"] as const;
  if (keys.some((key) => previous.input?.[key] !== saju.input[key])) return NO_PERSONAL_READING_BASIS;
  if ((["year", "month", "day", "time"] as const).some((key) => previous.pillars?.[key]?.raw !== saju.pillars[key]?.raw)) return NO_PERSONAL_READING_BASIS;
  const parsed = parsePersonalReport(saved.report);
  if (!parsed) return NO_PERSONAL_READING_BASIS;
  const relevant = new Set(["타고난 기질과 성격", "강점과 잠재력", "필요한 것", "기본성향", "평생 실행전략"]);
  const parts = parsed.sections.filter((section) => section && typeof section === "object" && relevant.has(section.id) && typeof section.summary === "string").map((section) => `${section.id}: ${section.summary.slice(0, 400)}`);
  if (!parts.length) return NO_PERSONAL_READING_BASIS;
  return ["동일 출생 정보와 판정 기준으로 작성된 1차 사주의 해석 요약. 계산 근거나 심리검사 결과가 아니라 참고 서술이다.", ...parts].join("\n").slice(0, 1800);
}
