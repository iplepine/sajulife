import { getTicketProduct } from "@/lib/tickets/products";
import { claimOnce, incrBy, readInt, readJson, writeJson } from "./kv";
import { ticketOrderKey, userTicketsKey } from "./keys";
import type { TicketOrder } from "./types";

/** 계정의 티켓 잔액. 인물별이 아니라 계정 전체 공용(userId 기준). */
export async function getTicketBalance(userId: string): Promise<number> {
  return readInt(userTicketsKey(userId));
}

/** 결제창을 열기 전, "pending" 상태 주문을 먼저 만든다 — 결제 검증 시 금액 대조 기준이 된다. */
export async function createPendingOrder(userId: string, productId: string): Promise<TicketOrder> {
  const product = getTicketProduct(productId);
  if (!product) throw new Error(`알 수 없는 티켓 상품: ${productId}`);

  const order: TicketOrder = {
    paymentId: `ticket_${crypto.randomUUID()}`,
    userId,
    productId: product.id,
    quantity: product.quantity,
    amount: product.price,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await writeJson(ticketOrderKey(order.paymentId), order);
  return order;
}

export async function getTicketOrder(paymentId: string): Promise<TicketOrder | null> {
  return readJson<TicketOrder | null>(ticketOrderKey(paymentId), null);
}

/**
 * 결제 검증 성공 후 호출 — 이 주문을 "딱 한 번만" 잔액에 반영한다.
 * claimOnce(SETNX)로 동시/중복 호출(재시도, 중복 클릭)에도 잔액이 두 번 늘지 않게 막는다.
 * 이미 처리된 주문이면 false를 반환한다(호출부는 이를 정상 케이스로 다뤄도 된다 — 멱등).
 */
export async function markTicketOrderPaidOnce(order: TicketOrder): Promise<boolean> {
  const claimed = await claimOnce(`${ticketOrderKey(order.paymentId)}:claim`);
  if (!claimed) return false;

  await incrBy(userTicketsKey(order.userId), order.quantity);
  const paid: TicketOrder = { ...order, status: "paid", paidAt: new Date().toISOString() };
  await writeJson(ticketOrderKey(order.paymentId), paid);
  return true;
}

export async function markTicketOrderFailed(order: TicketOrder, reason: string): Promise<void> {
  const failed: TicketOrder = { ...order, status: "failed", failReason: reason };
  await writeJson(ticketOrderKey(order.paymentId), failed);
}
