import { SAJU_TCI_PACKAGE } from "@/lib/package/product";
import { claimOnce, readJson, writeJson } from "./kv";
import { packageOrderKey, userPackageKey } from "./keys";
import type { PackageEntitlement, PackageOrder, PackagePaymentMode } from "./types";

/** 인물(스코프)의 사주+기질 풀이 이용권. 없으면 null. */
export async function getPackageEntitlement(scopeId: string): Promise<PackageEntitlement | null> {
  return readJson<PackageEntitlement | null>(userPackageKey(scopeId), null);
}

export async function hasPackage(scopeId: string): Promise<boolean> {
  return (await getPackageEntitlement(scopeId)) !== null;
}

/**
 * 결제창을 열기 전, "pending" 주문을 먼저 만든다 — 결제 검증 때 금액 대조 기준이 된다.
 * 금액은 클라이언트가 아니라 상품 정의에서 가져온다.
 */
export async function createPendingPackageOrder(
  userId: string,
  scopeId: string,
  mode: PackagePaymentMode,
): Promise<PackageOrder> {
  const order: PackageOrder = {
    paymentId: `${mode === "mock" ? "mock_" : ""}package_${crypto.randomUUID()}`,
    userId,
    scopeId,
    productId: SAJU_TCI_PACKAGE.id,
    amount: SAJU_TCI_PACKAGE.price,
    mode,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await writeJson(packageOrderKey(order.paymentId), order);
  return order;
}

export async function getPackageOrder(paymentId: string): Promise<PackageOrder | null> {
  return readJson<PackageOrder | null>(packageOrderKey(paymentId), null);
}

/**
 * 결제 검증 성공 후 호출 — 이 주문을 "딱 한 번만" 이용권으로 바꾼다.
 * claimOnce(SETNX)로 동시·중복 호출(재시도, 중복 클릭, 결제창 복귀 + 수동 확인)에도 한 번만 처리한다.
 * 이미 이용권이 있는 인물이면 기존 이용권을 덮어쓰지 않는다(첫 구매 시각·생성 기록 보존).
 * 이미 처리된 주문이면 false — 호출부는 이를 정상(멱등) 케이스로 다룬다.
 */
export async function markPackageOrderPaidOnce(order: PackageOrder): Promise<boolean> {
  const claimed = await claimOnce(`${packageOrderKey(order.paymentId)}:claim`);
  if (!claimed) return false;

  const paidAt = new Date().toISOString();
  const existing = await getPackageEntitlement(order.scopeId);
  if (!existing) {
    const entitlement: PackageEntitlement = {
      productId: order.productId,
      paymentId: order.paymentId,
      amount: order.amount,
      mode: order.mode,
      purchasedAt: paidAt,
    };
    await writeJson(userPackageKey(order.scopeId), entitlement);
  }
  await writeJson(packageOrderKey(order.paymentId), { ...order, status: "paid", paidAt } satisfies PackageOrder);
  return true;
}

export async function markPackageOrderFailed(order: PackageOrder, reason: string): Promise<void> {
  await writeJson(packageOrderKey(order.paymentId), { ...order, status: "failed", failReason: reason } satisfies PackageOrder);
}

/**
 * 이 이용권으로 첫 풀이가 만들어진 시각을 한 번만 남긴다.
 * 환불 기준("첫 풀이 생성 전 전액 환불")을 고객 문의 때 확인하는 근거다. 실패해도 생성은 막지 않는다.
 */
export async function markPackageFirstGenerated(scopeId: string): Promise<void> {
  const entitlement = await getPackageEntitlement(scopeId);
  if (!entitlement || entitlement.firstGeneratedAt) return;
  await writeJson(userPackageKey(scopeId), { ...entitlement, firstGeneratedAt: new Date().toISOString() });
}
