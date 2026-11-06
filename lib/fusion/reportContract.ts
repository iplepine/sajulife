/** 최종 통합 리포트의 화면·프롬프트·검증이 공유하는 계약. 클라이언트 안전. */
export const FUSION_SECTION_TITLES = [
  "▣ 나를 읽는 핵심 요약",
  "▣ 다섯 가지 힘의 조합",
  "▣ 사주와 검사 응답이 함께 말하는 것",
  "▣ 일과 자원을 다루는 방식",
  "▣ 관계와 스트레스, 회복의 조건",
  "▣ 시기별 성장 과제와 장기 방향",
  "▣ 올해와 내년, 선택에 적용하기",
  "▣ 핵심 요약과 실천 방향",
] as const;

export const FUSION_FORCE_NAMES = ["큰 나무", "타는 불", "너른 흙", "흐르는 물", "단단한 쇠"] as const;

/** 이미 만들어진 v30 저장본을 다시 해석할 때만 사용하는 이전 계약. */
export const LEGACY_FUSION_SECTION_TITLES = [
  "▣ 먼저 결론: 올해 너는 이런 한 해야",
  "▣ 원래의 너: 사주로 타고난 결",
  "▣ 요즘의 너: 기질 검사로 본 지금 상태",
  "▣ 원래의 너와 요즘의 너: 겹치는 곳과 어긋나는 곳",
  "▣ 올해 흐름: 올해가 지금의 너한테 가져오는 것",
  "▣ 올해 남은 달: 밀 때와 쉴 때",
  "▣ 내년 미리보기: 이렇게 바뀔 수 있으니 이걸 준비해",
  "▣ 올해 남은 기간, 이렇게 써: 세 가지 실행",
] as const;

export function isFinalFusionReport(report: string | null | undefined): boolean {
  return typeof report === "string" && report.trimStart().startsWith(FUSION_SECTION_TITLES[0]);
}
