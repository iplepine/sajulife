import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { fetchPortOnePayment } from "@/lib/tickets/portone";
import { getPackageOrder, markPackageOrderFailed, markPackageOrderPaidOnce } from "@/lib/store/package";

export const runtime = "nodejs";

/**
 * 결제창이 닫힌 뒤(또는 모바일 결제 후 돌아온 뒤) 클라이언트가 호출한다.
 * - 실결제: PortOne 서버에 paymentId로 직접 물어 status===PAID && 금액 일치일 때만 이용권을 연다.
 *   클라이언트가 보낸 "결제 성공"은 그대로 믿지 않는다.
 * - 베타 무료 주문은 주문 생성 때 이미 열리므로 여기서 다시 처리하지 않는다.
 * 이미 처리된 주문이면 그대로 성공을 돌려준다(멱등).
 */
export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { paymentId?: unknown };
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  if (!paymentId) return NextResponse.json({ error: "paymentId가 없어요." }, { status: 400 });

  const order = await getPackageOrder(paymentId);
  if (!order || order.userId !== userId) {
    return NextResponse.json({ error: "주문을 찾을 수 없어요." }, { status: 404 });
  }
  if (order.status === "paid") return NextResponse.json({ ok: true });

  if (order.mode !== "portone") {
    return NextResponse.json({ ok: false, error: "확인할 결제가 아니에요." }, { status: 400 });
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

  // 아직 끝나지 않은 결제(대기·발급)는 실패로 굳히지 않는다 — 다시 확인할 수 있어야 한다.
  if (payment.status === "READY" || payment.status === "PENDING" || payment.status === "VIRTUAL_ACCOUNT_ISSUED") {
    return NextResponse.json({ ok: false, pending: true, error: "아직 결제가 끝나지 않았어요." }, { status: 409 });
  }
  if (payment.status !== "PAID" || payment.amount.total !== order.amount) {
    await markPackageOrderFailed(order, `status=${payment.status} amount=${payment.amount?.total}`);
    return NextResponse.json({ ok: false, error: "결제가 확인되지 않았어요." }, { status: 400 });
  }

  await markPackageOrderPaidOnce(order);
  return NextResponse.json({ ok: true });
}
