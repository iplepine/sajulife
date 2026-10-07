import type { PackageJourneyState } from "./journey";

/** GET /api/package 응답 — 진행 상태와 결제 가능 여부. */
export type PackageInfo = {
  product: { id: string; name: string; price: number };
  payment: "portone" | "mock" | "unavailable";
  purchasedAt: string | null;
  state: PackageJourneyState;
};

export type PackageOrderResponse = {
  paymentId: string;
  amount: number;
  orderName: string;
  mode: "portone" | "mock";
};

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return data.error ?? fallback;
}

/** 조회만 한다 — 비용이 생기지 않는다. */
export async function fetchPackageInfo(signal?: AbortSignal): Promise<PackageInfo> {
  const res = await fetch("/api/package", { cache: "no-store", signal });
  if (!res.ok) throw new Error(await errorMessage(res, "풀이 상태를 불러오지 못했어요."));
  return res.json();
}

export async function startPackageCheckout(): Promise<PackageOrderResponse> {
  const res = await fetch("/api/package/checkout", { method: "POST" });
  if (!res.ok) throw new Error(await errorMessage(res, "주문을 만들지 못했어요."));
  return res.json();
}

/** 결제 확인. 아직 끝나지 않은 결제는 pending으로 돌려준다(실패로 굳히지 않는다). */
export async function verifyPackagePayment(paymentId: string): Promise<{ ok: boolean; pending?: boolean; error?: string }> {
  const res = await fetch("/api/package/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; pending?: boolean; error?: string };
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, pending: data.pending, error: data.error ?? "결제 확인에 실패했어요." };
}
