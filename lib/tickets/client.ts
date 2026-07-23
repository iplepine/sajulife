import { TICKET_PRODUCTS, type TicketProduct } from "./products";

export type { TicketProduct };
export { TICKET_PRODUCTS };

async function readJsonOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? fallbackMsg);
  }
  return res.json();
}

export async function fetchTicketBalance(): Promise<number> {
  const res = await fetch("/api/tickets/balance");
  const data = await readJsonOrThrow<{ balance: number }>(res, "잔액을 불러오지 못했어요.");
  return data.balance;
}

export type CheckoutOrder = { paymentId: string; amount: number; quantity: number; orderName: string };

export async function startTicketCheckout(productId: string): Promise<CheckoutOrder> {
  const res = await fetch("/api/tickets/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  return readJsonOrThrow<CheckoutOrder>(res, "주문 생성에 실패했어요.");
}

export async function verifyTicketPayment(paymentId: string): Promise<{ ok: boolean; balance: number }> {
  const res = await fetch("/api/tickets/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
  return readJsonOrThrow<{ ok: boolean; balance: number }>(res, "결제 확인에 실패했어요.");
}
