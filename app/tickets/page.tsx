import Link from "next/link";

/**
 * 결제와 권한 모델을 검증하기 전의 베타 안내 화면.
 * 이전 티켓 구매 화면으로 들어온 직접 링크도 결제 제안 대신 무료 이용 정책을 명확히 보여준다.
 */
export default function TicketsPage() {
  return (
    <main className="page-narrow">
      <h1 className="h-app">베타 이용 안내</h1>
      <p className="lead mt2">현재 베타 기간에는 티켓을 사거나 차감하지 않아요.</p>
      <section className="card mt4" aria-label="개인 사주 베타 안내">
        <p className="m0">개인 사주 풀이는 무료로 이용할 수 있어요. 결제·가격·환불 정책은 베타 관찰을 마친 뒤 별도로 안내할게요.</p>
      </section>
      <Link href="/explore/personal" className="btn btn-primary btn-block mt4" style={{ textDecoration: "none" }}>
        무료로 개인 사주 보기 <span aria-hidden>→</span>
      </Link>
    </main>
  );
}
