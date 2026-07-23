/**
 * 티켓 상품 정의 — 단품/3개 묶음/9개 묶음 3종 SKU.
 * 클라이언트(구매 페이지)와 서버(결제 검증 시 금액 대조) 양쪽에서 같은 값을 써야
 * 위변조를 막을 수 있어, 이 파일은 서버 전용 import 없이 순수하게 둔다.
 */

export type TicketProductId = "single" | "pack3" | "pack9";

export type TicketProduct = {
  id: TicketProductId;
  quantity: number;
  discountPercent: number;
  /** 원 단위 총 결제 금액 (수량 × 단가 × (1 - 할인율)). */
  price: number;
  label: string;
};

const UNIT_PRICE = 990;

function buildProduct(id: TicketProductId, quantity: number, discountPercent: number): TicketProduct {
  const price = Math.round(quantity * UNIT_PRICE * (1 - discountPercent / 100));
  const label = discountPercent > 0 ? `티켓 ${quantity}장 (${discountPercent}% 할인)` : `티켓 ${quantity}장`;
  return { id, quantity, discountPercent, price, label };
}

export const TICKET_PRODUCTS: TicketProduct[] = [
  buildProduct("single", 1, 0),
  buildProduct("pack3", 3, 10),
  buildProduct("pack9", 9, 20),
];

export function getTicketProduct(id: string): TicketProduct | undefined {
  return TICKET_PRODUCTS.find((p) => p.id === id);
}
