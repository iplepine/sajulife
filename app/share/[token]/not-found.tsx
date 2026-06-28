import Link from "next/link";

export default function ShareNotFound() {
  return (
    <div className="share-public">
      <header className="share-pub-head">
        <span className="share-pub-brand">sajulife</span>
        <h1 className="share-pub-title">공유된 풀이를 찾을 수 없어요</h1>
      </header>
      <p className="muted">링크가 잘못됐거나 더 이상 유효하지 않은 주소일 수 있어요.</p>
      <Link href="/" className="btn btn-primary btn-block share-pub-cta" style={{ textDecoration: "none" }}>
        sajulife 둘러보기
      </Link>
    </div>
  );
}
