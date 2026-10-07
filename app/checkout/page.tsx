"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import { trackEvent } from "@/lib/analytics";
import {
  fetchPackageInfo,
  startPackageCheckout,
  verifyPackagePayment,
  type PackageInfo,
} from "@/lib/package/client";
import { nextJourneyStep } from "@/lib/package/journey";
import { formatWon, PACKAGE_STEPS, SAJU_TCI_PACKAGE } from "@/lib/package/product";

const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

/**
 * 사주+기질 풀이 결제 화면.
 * 홈의 "사주+기질 분석하기"가 바로 여기로 온다. 결제가 끝나면 다음 단계(사주 정보 입력 또는 사주 풀이)로
 * 곧장 넘긴다 — 다음 단계는 lib/package/journey.ts 한 곳에서 정한다.
 */
function CheckoutBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<PackageInfo | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnHandled = useRef(false);

  // 결제가 끝나면 최신 상태로 다음 걸음을 다시 계산해 넘긴다.
  async function goNext() {
    setDone(true);
    try {
      const fresh = await fetchPackageInfo();
      router.replace(nextJourneyStep(fresh.state).href);
    } catch {
      router.replace("/dashboard");
    }
  }

  async function confirm(paymentId: string) {
    const result = await verifyPackagePayment(paymentId);
    if (result.ok) {
      trackEvent("purchase_completed", { product: SAJU_TCI_PACKAGE.id });
      await goNext();
      return;
    }
    setError(result.pending ? "아직 결제가 끝나지 않았어요. 잠시 뒤 다시 확인해 주세요." : (result.error ?? "결제 확인에 실패했어요."));
  }

  useEffect(() => {
    let alive = true;
    fetchPackageInfo()
      .then((data) => { if (alive) setInfo(data); })
      .catch(() => { if (alive) setLoadFailed(true); });

    // 모바일처럼 결제창이 페이지를 떠났다 돌아오는 방식은 paymentId를 달고 여기로 온다 — 도착하자마자 확인한다.
    const paymentId = searchParams.get("paymentId");
    if (paymentId && !returnHandled.current) {
      returnHandled.current = true;
      const code = searchParams.get("code");
      router.replace("/checkout");
      if (code) {
        setError(searchParams.get("message") ?? "결제가 취소됐어요.");
      } else {
        setBusy(true);
        void confirm(paymentId).finally(() => { if (alive) setBusy(false); });
      }
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePay() {
    if (busy) return;
    setBusy(true);
    setError(null);
    trackEvent("purchase_started", { product: SAJU_TCI_PACKAGE.id });
    try {
      const order = await startPackageCheckout();
      if (order.mode === "mock") {
        await confirm(order.paymentId);
        return;
      }
      if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY) {
        throw new Error("결제를 준비하고 있어요. 조금만 기다려 주세요.");
      }
      const PortOne = await import("@portone/browser-sdk/v2");
      const response = await PortOne.requestPayment({
        storeId: PORTONE_STORE_ID,
        channelKey: PORTONE_CHANNEL_KEY,
        paymentId: order.paymentId,
        orderName: order.orderName,
        totalAmount: order.amount,
        currency: "KRW",
        payMethod: "CARD",
        redirectUrl: `${window.location.origin}/checkout`,
      });
      // 리디렉션 방식이면 여기 도달하지 않고 페이지가 이동한다.
      if (response?.code) {
        setError(response.message ?? "결제가 취소됐어요.");
        return;
      }
      if (!response?.paymentId) {
        setError("결제 응답을 확인할 수 없어요.");
        return;
      }
      await confirm(response.paymentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 중 문제가 생겼어요.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <main className="page-narrow"><PageLoading label="결제가 끝났어요. 다음 단계로 넘어갈게요" /></main>;
  if (!info && !loadFailed) return <main className="page-narrow"><PageLoading label="결제 화면을 준비하고 있어요" /></main>;

  if (loadFailed || !info) {
    return (
      <main className="page-narrow">
        <h1 className="h-app">사주+기질 풀이</h1>
        <p className="error mt4">지금 결제 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>
        <Link href="/dashboard" className="btn btn-ghost btn-block mt4" style={{ textDecoration: "none" }}>홈으로</Link>
      </main>
    );
  }

  const price = formatWon(info.product.price);

  if (info.state.entitled) {
    const next = nextJourneyStep(info.state);
    return (
      <main className="page-narrow checkout-page">
        <h1 className="h-app">사주+기질 풀이</h1>
        <section className="card mt4 checkout-card" aria-label="이용 중">
          <p className="checkout-done-title">이미 열려 있어요</p>
          <p className="muted m0">{next.note}</p>
        </section>
        <Link href={next.href} className="btn btn-primary btn-block mt4" style={{ textDecoration: "none" }}>
          {next.label} <span aria-hidden>→</span>
        </Link>
      </main>
    );
  }

  const unavailable = info.payment === "unavailable";

  return (
    <main className="page-narrow checkout-page">
      <p className="checkout-kicker">사주 + 기질</p>
      <h1 className="h-app">사주+기질 풀이</h1>
      <p className="lead mt2">사주로 타고난 나를, 기질 검사로 요즘의 나를 읽고 둘을 겹쳐 올해 운세까지 풀어드려요.</p>

      <section className="card mt4 checkout-card" aria-label="포함된 풀이">
        <ol className="checkout-steps">
          {PACKAGE_STEPS.map((step) => (
            <li key={step.step}>
              <span className="checkout-step-no" aria-hidden>{step.step}</span>
              <span className="checkout-step-copy">
                <strong>{step.title}</strong>
                <span>{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="checkout-note">사주 풀이를 먼저 보여드리고, 기질 검사를 마치면 사주와 겹친 올해 운세를 만들어요.</p>
      </section>

      <section className="card mt4 checkout-card" aria-label="결제 정보">
        <div className="checkout-row">
          <span>누구의 풀이인가요?</span>
          <PersonSwitcher nameOnly />
        </div>
        <div className="checkout-row checkout-row--price">
          <span>결제 금액</span>
          <strong>{price}</strong>
        </div>
        <p className="checkout-note">
          지금 선택된 한 사람의 풀이가 열려요. 첫 풀이가 만들어지기 전에는 전액 환불되고, 만들어진 뒤에는 디지털 콘텐츠라 청약철회가 제한돼요(생성 오류는 환불).{" "}
          <Link href="/refund">환불 정책 보기</Link>
        </p>
      </section>

      {error && <p className="error mt4" role="alert">{error}</p>}
      <button
        type="button"
        className="btn btn-primary btn-block mt4 checkout-pay"
        onClick={() => void handlePay()}
        disabled={busy || unavailable}
      >
        {busy ? "결제 진행 중…" : unavailable ? "결제 준비 중" : `${price} 결제하기`}
      </button>
      {unavailable && <p className="muted mt2" style={{ fontSize: 13 }}>결제를 준비하고 있어요. 조금만 기다려 주세요.</p>}
      {info.payment === "mock" && (
        <p className="muted mt2" style={{ fontSize: 13 }}>개발 환경 테스트 결제예요. 실제로 돈이 나가지 않아요.</p>
      )}
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="page-narrow"><PageLoading label="결제 화면을 준비하고 있어요" /></main>}>
      <CheckoutBody />
    </Suspense>
  );
}
