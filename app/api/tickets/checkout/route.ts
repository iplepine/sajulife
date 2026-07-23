import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { getTicketProduct } from "@/lib/tickets/products";
import { createPendingOrder } from "@/lib/store/tickets";

export const runtime = "nodejs";

/**
 * 결제창을 열기 전 서버에서 먼저 주문(pending)을 만든다.
 * 가격은 여기서 상품 카탈로그로 다시 계산해 반환 — 클라이언트가 보낸 금액은 쓰지 않는다.
 */
export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { productId?: unknown };
  const productId = typeof body.productId === "string" ? body.productId : "";
  const product = getTicketProduct(productId);
  if (!product) return NextResponse.json({ error: "알 수 없는 상품이에요." }, { status: 400 });

  const order = await createPendingOrder(userId, product.id);
  return NextResponse.json({
    paymentId: order.paymentId,
    amount: order.amount,
    quantity: order.quantity,
    orderName: `${product.label} · 사주언니 × 기질오빠`,
  });
}
