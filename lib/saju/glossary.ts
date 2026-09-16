/**
 * 명리 용어 → 일상어 풀이 (사용자 노출용 단일 출처).
 *
 * CLAUDE.md 규칙: 한자·명리 용어는 써도 되지만 ★반드시 옆 괄호에 일상어 풀이★를 붙인다.
 * 화면마다 풀이를 따로 지어내면 같은 용어가 화면마다 다른 말로 설명된다 — 여기서만 정한다.
 * (/saju/yongsin 섹션 제목 "격국 · 타고난 그릇 / 억부 · 힘의 균형 / 조후 · 온도 균형"과 같은 말)
 */
export const TERM_GLOSS = {
  격국: "타고난 그릇",
  억부: "힘의 균형",
  조후: "온도 균형",
  대운: "10년 단위 흐름",
  세운: "한 해 흐름",
  월운: "한 달 흐름",
  원국: "타고난 사주표",
  십성: "나와의 관계로 본 역할",
  일간: "태어난 날의 기운, 곧 나",
  지지: "아랫줄 글자",
  장간: "그 안에 숨은 기운",
  신살: "자리마다 붙는 특수 표시",
  귀인: "도움이 붙는 자리",
} as const;

export type GlossTerm = keyof typeof TERM_GLOSS;

/** "격국(타고난 그릇)" 형태로 붙인다. */
export function withGloss(term: GlossTerm): string {
  return `${term}(${TERM_GLOSS[term]})`;
}

/** 여러 용어를 "·"로 이어 붙인다 — "격국(타고난 그릇)·억부(힘의 균형)·조후(온도 균형)". */
export function withGlosses(...terms: GlossTerm[]): string {
  return terms.map(withGloss).join("·");
}
