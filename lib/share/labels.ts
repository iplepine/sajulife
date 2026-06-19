import type { ReportKind } from "@/lib/store/types";

/** 공유 카드·페이지 헤더에 쓰는 리포트 종류 라벨. API·공개 페이지·OG가 같은 출처를 쓴다. */
export const REPORT_LABEL: Record<ReportKind, string> = {
  personal: "개인 사주 리포트",
  tci: "기질 리포트",
  fusion: "사주 × 기질 융합 리포트",
  family: "가족 사주 리포트",
};

/** "○○님의 개인 사주 리포트" — 공유 카드 제목·페이지 헤더. */
export function shareTitle(ownerName: string, kind: ReportKind): string {
  return `${ownerName}님의 ${REPORT_LABEL[kind]}`;
}

/** 공유 카드/OG 설명 — UI 크롬이라 존댓말. */
export function shareDescription(_ownerName: string, kind: ReportKind): string {
  return `AI가 풀어준 ${REPORT_LABEL[kind]}예요. 지금 확인해보세요.`;
}
