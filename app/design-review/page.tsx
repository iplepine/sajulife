import Link from "next/link";
import styles from "./review.module.css";

const SCREENS = [
  ["홈", "/dashboard", "대표 캐릭터와 사주·기질 통합 진입"],
  ["풀이 소개", "/explore/fusion", "사주부터 최종 풀이까지 받는 내용"],
  ["사주 입력", "/onboarding", "태어난 정보와 시간 입력"],
  ["기질 검사", "/tci?variant=short", "기질오빠 안내와 설문 응답"],
  ["사주 풀이", "/saju", "사주언니와 개인 풀이 읽기"],
  ["통합 풀이", "/fusion", "두 관점과 최종 리포트"],
  ["내 풀이", "/materials", "저장본과 다음 단계"],
  ["용신상담", "/consult", "고민 입력과 상담 기록"],
  ["가족", "/family", "가족 구성원과 관계 풀이"],
  ["마이", "/account", "계정과 등록 정보"],
] as const;

function variantHref(href: string, design: "a" | "b") {
  return `${href}${href.includes("?") ? "&" : "?"}design=${design}`;
}

export default function DesignReviewPage() {
  return <main className={styles.review}>
    <header><p className={styles.kicker}>SAJULIFE · DESIGN REVIEW</p><h1>현재 화면은 A,<br />캐릭터 중심 새 화면은 B.</h1><p className={styles.lead}>같은 실제 서비스에서 두 디자인을 선택해 볼 수 있어요.<br />로그인 전 흰 바탕·검정 궁서 화면은 공통으로 유지해요.</p></header>
    <section className={styles.variants} aria-label="디자인 선택">
      <article><span className={styles.type}>TYPE A</span><h2>현재 서비스</h2><p>현재 홈과 모든 화면의 디자인을 그대로 사용해요.</p><a className={styles.aButton} href="/dashboard?design=a">A로 실제 서비스 보기 <span aria-hidden="true">→</span></a></article>
      <article><span className={styles.type}>TYPE B</span><h2>사주언니 × 기질오빠</h2><picture><source media="(max-width:767px)" srcSet="/design-b/duo-front-mobile.webp" /><img src="/design-b/duo-front.webp" width="1440" height="720" alt="코발트의 사주언니와 테라코타의 기질오빠" /></picture><p>두 캐릭터를 중심으로 홈부터 입력·검사·풀이·상담까지 이어져요.</p><a className={styles.bButton} href="/dashboard?design=b">B로 실제 서비스 보기 <span aria-hidden="true">→</span></a></article>
    </section>
    <section className={styles.screens} aria-labelledby="screen-list"><h2 id="screen-list">같은 화면을 A/B로 비교해요</h2>{SCREENS.map(([name,href,note])=><div className={styles.row} key={href}><div><strong>{name}</strong><small>{note}</small></div><a href={variantHref(href,"a")} aria-label={`${name} A 디자인`}>A 보기 ↗</a><a href={variantHref(href,"b")} aria-label={`${name} B 디자인`}>B 보기 ↗</a></div>)}</section>
    <footer>선택한 디자인은 이 브라우저의 다음 화면에도 이어져요. A를 선택하면 현재 디자인으로 돌아가요.<br />기능·저장된 내용·결제 조건은 두 안이 같아요. 방문자를 자동 배정하는 실험은 설정하지 않았어요.<br /><Link href="/">로그인 전 공통 화면 보기 ↗</Link></footer>
  </main>;
}
