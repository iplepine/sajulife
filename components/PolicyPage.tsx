import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 정책 문서 화면의 공통 뼈대 (이용약관·개인정보 처리방침·환불 정책).
 *
 * ★비로그인도 읽을 수 있어야 한다★ — 가입 전에 확인해야 의미가 있는 문서다.
 * 경로는 middleware의 PUBLIC_PATHS에 함께 등록돼 있다.
 *
 * ★검토 중 고지를 반드시 단다★ — 아래 본문은 실제 구현 동작(docs/product/TRUST_AND_PRIVACY.md)을
 * 근거로 정리한 ★베타 기준 초안★이지, 법률 검토를 마친 확정본이 아니다.
 * 확정 전까지 이 배너를 임의로 떼지 않는다.
 *
 * ★톤★: 정책 문서는 사용자 노출 UI 텍스트 중 '존댓말 유지' 쪽이다(반말 팩폭 톤 아님).
 */
export default function PolicyPage({
  title,
  effectiveDate,
  intro,
  children,
}: {
  title: string;
  /** 적용일 — 확정 전에는 "확정 전"처럼 사실대로 적는다. */
  effectiveDate: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="page-narrow policy-page">
      <p className="policy-eyebrow">SAJULIFE</p>
      <h1 className="h-app">{title}</h1>
      <p className="policy-meta">적용일: {effectiveDate}</p>

      <div className="policy-review" role="note">
        <strong>검토 중인 초안이에요</strong>
        <p>
          아래 내용은 현재 베타 서비스가 실제로 하는 일을 정리한 초안이며, 법률 검토를 마친 확정본이 아니에요.
          확정되면 이 안내를 내리고 적용일을 다시 적을게요.
        </p>
      </div>

      <p className="policy-intro">{intro}</p>

      <div className="policy-body">{children}</div>

      <section className="policy-contact" aria-label="문의">
        <h2>문의</h2>
        <p>
          이 문서나 내 데이터에 대해 물어볼 게 있으면{" "}
          <a href="mailto:hello@sajulife.kr">hello@sajulife.kr</a>로 보내주세요.
        </p>
      </section>

      <nav className="policy-nav" aria-label="다른 정책 문서">
        <Link href="/terms">이용약관</Link>
        <Link href="/privacy">개인정보 처리방침</Link>
        <Link href="/refund">환불 정책</Link>
      </nav>
    </main>
  );
}

/** 정책 문서의 한 조항. 제목 + 문단/목록. */
export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="policy-sec">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
