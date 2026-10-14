/** 무료 베타는 구매 기록 없이 바로 사용한다. 유료/결제 준비 중에는 기존 구매 권한만 인정한다. */
export function canUsePackage(payment: "free" | "portone" | "unavailable", hasEntitlement: boolean): boolean {
  return payment === "free" || hasEntitlement;
}
