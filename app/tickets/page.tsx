import { redirect } from "next/navigation";

/**
 * 옛 티켓 구매 주소. 2026-10-08부터 상품은 사주+기질 풀이 하나라, 들어오면 결제 화면으로 보낸다.
 * (티켓 차감 모델은 쓰지 않는다 — 결제는 lib/package/*가 맡는다.)
 */
export default function TicketsPage() {
  redirect("/checkout");
}
