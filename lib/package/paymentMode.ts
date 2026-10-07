/**
 * 지금 결제를 어떻게 받을지 — ★서버 전용★(API 시크릿 존재 여부를 본다).
 *
 * - portone: PortOne 키 3종(스토어 ID·채널 키·API 시크릿)이 모두 있으면 실결제.
 * - mock: 키가 없을 때, 로컬 개발(next dev) 또는 PAYMENT_MOCK=1을 켠 프리뷰에서만 쓰는 가짜 결제.
 *         ★Vercel 운영 배포(VERCEL_ENV=production)에서는 어떤 설정으로도 열리지 않는다.★
 * - unavailable: 그 밖(운영인데 키가 없음) — 결제 버튼 대신 "결제 준비 중"을 보여준다.
 */
export type PaymentAvailability = "portone" | "mock" | "unavailable";

export function portOneConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PORTONE_STORE_ID &&
      process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY &&
      process.env.PORTONE_API_SECRET,
  );
}

export function mockPaymentAllowed(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.NODE_ENV === "development" || process.env.PAYMENT_MOCK === "1";
}

export function paymentAvailability(): PaymentAvailability {
  if (portOneConfigured()) return "portone";
  if (mockPaymentAllowed()) return "mock";
  return "unavailable";
}
