"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLoading from "@/components/PageLoading";
import { fetchTicketBalance, startTicketCheckout, verifyTicketPayment, TICKET_PRODUCTS } from "@/lib/tickets/client";

const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

function TicketsPageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [balance, setBalance] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchTicketBalance().then(setBalance).catch(() => setBalance(0));
  }, []);

  // 모바일 등 리디렉션 결제 방식은 여기로 paymentId와 함께 돌아온다 — 도착 즉시 검증한다.
  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const code = searchParams.get("code");
    if (!paymentId) return;
    router.replace("/tickets");
    if (code) {
      setError(searchParams.get("message") ?? "결제가 취소됐어요.");
      return;
    }
    verifyTicketPayment(paymentId)
      .then((result) => {
        if (result.ok) {
          setBalance(result.balance);
          setNotice("티켓 구매가 완료됐어요.");
        } else {
          setError("결제 확인에 실패했어요.");
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "결제 확인에 실패했어요."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBuy(productId: string) {
    if (busyId) return;
    setError(null);
    setNotice(null);
    setBusyId(productId);
    try {
      if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
        throw new Error("결제 연동이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.");
      }
      const order = await startTicketCheckout(productId);
      const PortOne = await import("@portone/browser-sdk/v2");
      const response = await PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: order.paymentId,
        orderName: order.orderName,
        totalAmount: order.amount,
        currency: "KRW",
        payMethod: "CARD",
        redirectUrl: `${window.location.origin}/tickets`,
      });

      // redirectUrl 방식이면 여기 도달하지 않고 페이지가 이동한다.
      if (response?.code) {
        setError(response.message ?? "결제가 취소됐어요.");
        return;
      }
      if (!response?.paymentId) {
        setError("결제 응답을 확인할 수 없어요.");
        return;
      }
      const result = await verifyTicketPayment(response.paymentId);
      if (!result.ok) {
        setError("결제 확인에 실패했어요.");
        return;
      }
      setBalance(result.balance);
      setNotice("티켓 구매가 완료됐어요.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 중 문제가 발생했어요.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-narrow">
      <h2 className="h-app">티켓 구매</h2>
      <p className="lead mt2">티켓으로 사주·기질 리포트를 만들 수 있어요.</p>

      <div className="card mt4 ticket-balance-card">
        <div className="muted" style={{ fontSize: 12 }}>보유 티켓</div>
        <div className="ticket-balance-count">{balance === null ? "—" : `${balance}장`}</div>
      </div>

      <div className="ticket-product-list mt4">
        {TICKET_PRODUCTS.map((product) => {
          const unitPrice = Math.round(product.price / product.quantity);
          return (
            <button
              key={product.id}
              type="button"
              className={`ticket-product${product.discountPercent > 0 ? " is-deal" : ""}`}
              onClick={() => handleBuy(product.id)}
              disabled={busyId !== null}
            >
              {product.discountPercent > 0 && (
                <span className="ticket-product-badge">{product.discountPercent}% 할인</span>
              )}
              <span className="ticket-product-info">
                <span className="ticket-product-qty">티켓 {product.quantity}장</span>
                {product.discountPercent > 0 && (
                  <span className="ticket-product-unit">장당 {unitPrice.toLocaleString()}원</span>
                )}
              </span>
              <span className="ticket-product-action">
                <span className="ticket-product-price">{product.price.toLocaleString()}원</span>
                <span className="btn btn-primary ticket-product-cta">
                  {busyId === product.id ? "결제 진행 중…" : "구매하기"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {notice && <p className="ok mt3">{notice}</p>}
      {error && <p className="error mt3">{error}</p>}

      <p className="hint mt4">
        결제는 PortOne(아임포트)을 통해 안전하게 처리돼요. 구매 후 청약철회·환불 문의는 고객센터로 연락해 주세요.
      </p>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<main className="page"><PageLoading label="티켓 정보를 불러오고 있어요" /></main>}>
      <TicketsPageBody />
    </Suspense>
  );
}
