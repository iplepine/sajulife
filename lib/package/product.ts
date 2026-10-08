/**
 * 사주+기질 풀이 — 이 서비스의 대표 상품(2026-10-08 대표 결정).
 *
 * 한 번 결제하면 ★활성 인물 한 명★에게 아래 세 단계가 열린다.
 *   ① 사주 풀이(평생 흐름) → ② 기질 검사 → ③ 사주+기질 올해 운세 풀이
 *
 * 클라이언트(결제 화면)와 서버(주문 생성·결제 금액 대조)가 같은 값을 써야 금액 위변조를 막을 수 있어,
 * 이 파일은 서버 전용 import 없이 순수하게 둔다.
 */

export const SAJU_TCI_PACKAGE = {
  id: "saju-tci",
  name: "사주+기질 풀이",
  /** 원 단위 결제 금액. 바꾸면 환불 정책 화면과 결제 화면 문구가 함께 바뀐다. */
  price: 4900,
  orderName: "사주+기질 풀이 · 사주언니 × 기질오빠",
} as const;

export type PackageStepInfo = { step: 1 | 2 | 3; title: string; desc: string };

/** 결제 화면과 홈이 같은 순서·같은 말로 세 단계를 보여준다. */
export const PACKAGE_STEPS: readonly PackageStepInfo[] = [
  { step: 1, title: "사주 풀이", desc: "타고난 결과 평생 흐름을 먼저 읽어요." },
  { step: 2, title: "기질 검사", desc: "35문항으로 요즘의 반응 습관을 재요." },
  { step: 3, title: "사주+기질 올해 운세", desc: "타고난 결에 요즘의 나를 겹쳐 올해와 내년을 풀어요." },
];

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 결제 방식에 맞는 가격 표기. 베타 무료(2026-10-09 대표 결정)일 땐 "베타 무료"라고 말한다 —
 * 정가를 같이 적을지는 화면마다 정한다(결제 화면은 정가를 함께 보여준다).
 */
export function offerPriceLabel(payment: "portone" | "free" | "unavailable", price: number = SAJU_TCI_PACKAGE.price): string {
  return payment === "free" ? "베타 무료" : formatWon(price);
}

/**
 * 로그인 전 화면(랜딩·약관·환불 정책)처럼 서버 상태를 못 읽는 곳의 판정.
 * 서버의 lib/package/paymentMode.ts와 같은 공개 설정값(NEXT_PUBLIC_PACKAGE_PAYMENT)을 본다.
 */
export function isFreeBetaPublic(): boolean {
  return process.env.NEXT_PUBLIC_PACKAGE_PAYMENT !== "portone";
}
