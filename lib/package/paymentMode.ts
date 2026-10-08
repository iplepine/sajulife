/**
 * 지금 결제를 어떻게 받을지.
 *
 * 2026-10-09 대표 결정 — "일단은 실결제 없이 넘어갈 수 있게": 기본은 ★베타 무료★다.
 * 결제 화면은 그대로 거치되 돈은 받지 않고 이용권을 바로 연다.
 *
 * - free(기본): 결제 없이 이용권을 연다. 정가(4,900원)는 화면에 '베타 무료'와 함께 보여준다.
 * - portone: `NEXT_PUBLIC_PACKAGE_PAYMENT=portone`을 ★명시적으로 켜고★ PortOne 키 3종이 모두 있을 때만 실결제.
 *   키를 넣는 것만으로는 실결제가 켜지지 않는다 — 테스트 키를 넣었다가 실수로 과금되는 일을 막는다.
 * - unavailable: 실결제를 켰는데 키가 빠졌을 때 — 결제 버튼 대신 "결제 준비 중"을 보여준다.
 *
 * `NEXT_PUBLIC_` 값이라 빌드 때 화면 코드에도 같은 값이 들어간다(랜딩·약관처럼 로그인 전 화면도 같은 말을 한다).
 * Vercel에서 값을 바꾸면 다시 배포해야 반영된다.
 */
export type PaymentAvailability = "portone" | "free" | "unavailable";

export function portOneConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PORTONE_STORE_ID &&
      process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY &&
      process.env.PORTONE_API_SECRET,
  );
}

/** 실결제를 켰는지 — 화면(클라이언트)에서도 읽을 수 있는 값만 본다. */
export function paidModeRequested(): boolean {
  return process.env.NEXT_PUBLIC_PACKAGE_PAYMENT === "portone";
}

export function paymentAvailability(): PaymentAvailability {
  if (!paidModeRequested()) return "free";
  return portOneConfigured() ? "portone" : "unavailable";
}
