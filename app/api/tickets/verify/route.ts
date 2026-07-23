import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { fetchPortOnePayment } from "@/lib/tickets/portone";
import { getTicketBalance, getTicketOrder, markTicketOrderFailed, markTicketOrderPaidOnce } from "@/lib/store/tickets";

export const runtime = "nodejs";

/**
 * 결제창이 닫힌 뒤 클라이언트가 호출 — PortOne 서버에 paymentId로 직접 조회해
 * status===PAID && amount가 우리가 만든 주문과 일치할 때만 티켓 잔액을 반영한다.
 * 이미 반영된 주문이면(재호출) 그대로 현재 잔액을 반환한다 — 멱등.
 */
export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { paymentId?: unknown };
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  if (!paymentId) return NextResponse.json({ error: "paymentId가 없어요." }, { status: 400 });

  const order = await getTicketOrder(paymentId);
  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "주문을 찾을 수 없어요." }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ ok: true, balance: await getTicketBalance(userId) });
  }

  let payment;
  try {
    payment = await fetchPortOnePayment(paymentId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "결제 확인에 실패했어요." },
      { status: 502 },
    );
  }

  if (payment.status !== "PAID" || payment.amount.total !== order.amount) {
    await markTicketOrderFailed(order, `status=${payment.status} amount=${payment.amount?.total}`);
    return NextResponse.json({ ok: false, error: "결제가 확인되지 않았어요." }, { status: 400 });
  }

  await markTicketOrderPaidOnce(order);
  return NextResponse.json({ ok: true, balance: await getTicketBalance(userId) });
}
