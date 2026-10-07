import { NextResponse } from "next/server";
import { SAJU_TCI_PACKAGE } from "@/lib/package/product";
import { paymentAvailability } from "@/lib/package/paymentMode";
import { createPendingPackageOrder, getPackageEntitlement } from "@/lib/store/package";
import { resolveScopeOrNull } from "@/lib/store/session";

export const runtime = "nodejs";

/**
 * 결제창을 열기 전에 서버에서 먼저 주문(pending)을 만든다.
 * 금액은 상품 정의로 다시 정하고 클라이언트가 보낸 값은 쓰지 않는다.
 * 이용권은 ★지금 활성 인물★에게 열리므로, 주문에 그 스코프를 함께 적어 둔다.
 */
export async function POST() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (await getPackageEntitlement(scope.scopeId)) {
    return NextResponse.json({ error: "이미 사주+기질 풀이가 열려 있어요.", code: "ALREADY_ENTITLED" }, { status: 409 });
  }

  const mode = paymentAvailability();
  if (mode === "unavailable") {
    return NextResponse.json(
      { error: "결제를 준비하고 있어요. 조금만 기다려 주세요.", code: "PAYMENT_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const order = await createPendingPackageOrder(scope.userId, scope.scopeId, mode);
  return NextResponse.json({
    paymentId: order.paymentId,
    amount: order.amount,
    orderName: SAJU_TCI_PACKAGE.orderName,
    mode,
  });
}
