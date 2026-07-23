/**
 * PortOne(아임포트) V2 서버 API — 결제 단건 조회.
 * 클라이언트가 보낸 결제 성공 응답은 절대 그대로 신뢰하지 않고, 여기서
 * paymentId로 PortOne 서버에 직접 물어 status/amount를 재검증한다.
 * https://developers.portone.io/api/rest-v2/payment
 */

const PORTONE_API_BASE = "https://api.portone.io";

export type PortOnePaymentStatus =
  | "READY"
  | "PENDING"
  | "VIRTUAL_ACCOUNT_ISSUED"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "PARTIAL_CANCELLED";

export type PortOnePayment = {
  id: string;
  status: PortOnePaymentStatus;
  amount: { total: number };
};

export async function fetchPortOnePayment(paymentId: string): Promise<PortOnePayment> {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) throw new Error("PORTONE_API_SECRET 환경변수가 없습니다.");

  const res = await fetch(`${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `PortOne ${secret}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PortOne 결제 조회 실패 (${res.status}): ${text}`);
  }
  return res.json();
}
