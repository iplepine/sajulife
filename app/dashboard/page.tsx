"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PageLoading from "@/components/PageLoading";
import type { PackageInfo } from "@/lib/package/client";
import { isBeforeStart, nextJourneyStep, PACKAGE_INTRO_HREF, PACKAGE_PITCH, type JourneyStep } from "@/lib/package/journey";
import { formatWon, PACKAGE_STEPS } from "@/lib/package/product";
import styles from "./home.module.css";

/**
 * 하단 정책 링크 — ★글자가 아니라 실제로 열리는 링크★여야 한다.
 * 정책 문서는 비로그인도 읽을 수 있게 middleware의 PUBLIC_PATHS에 등록돼 있다.
 */
const COMPANY_LINKS: Array<{ label: string; href: string }> = [
  { label: "이용약관", href: "/terms" },
  { label: "개인정보 처리방침", href: "/privacy" },
  { label: "환불 정책", href: "/refund" },
  { label: "고객센터", href: "mailto:hello@sajulife.kr" },
];

/**
 * ★확인된 정보만 적는다★ — 예전엔 `000-00-00000`, `2026-서울중랑-0000` 같은 자리표시 번호가
 * 실제 화면에 그대로 노출됐다. 없는 번호를 지어내는 것보다 안 적는 쪽이 정직하다.
 * 사업자등록번호·통신판매업신고번호는 ★운영 담당자 확인 후★ 아래 배열에 넣는다(현재 승인 대기).
 */
const COMPANY_INFO = [
  "데브호하우스 | 대표: 박정호",
  "서울특별시 중랑구 신내로 155",
  "문의: hello@sajulife.kr",
];

type HomeData = {
  /**
   * 홈에 필요한 프로필·사주·기질·통합 진행 상태의 단일 출처.
   * 조회 실패는 미입력·미구매와 다르므로 다음 단계로 보내지 않는다.
   */
  pkg: PackageInfo | null;
  packageLoadFailed: boolean;
};
const EMPTY_HOME_DATA: HomeData = {
  pkg: null,
  packageLoadFailed: false,
};
export default function DashboardPage() {
  const [data, setData] = useState<HomeData>(EMPTY_HOME_DATA);
  const [initializing, setInitializing] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const requestInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    requestInFlight.current = true;
    void (async () => {
      try {
        // 예전 홈의 개별 조회 아홉 개를 반복하지 않고, 진행 상태를 이 응답으로 한 번만 확정한다.
        // 계절용 사주표는 공통 SeasonThemeProvider가 따로 관리한다.
        const response = await fetch("/api/package", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Package status unavailable");
        const pkg = (await response.json()) as PackageInfo;
        if (!pkg?.state || typeof pkg.state.hasProfile !== "boolean") throw new Error("Invalid package status");
        if (!cancelled) setData({ pkg, packageLoadFailed: false });
      } catch {
        if (!cancelled) setData({ pkg: null, packageLoadFailed: true });
      } finally {
        window.clearTimeout(timeout);
        if (!cancelled) {
          requestInFlight.current = false;
          setInitializing(false);
          setRetrying(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [reloadToken]);

  function retryPackage() {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRetrying(true);
    setReloadToken((token) => token + 1);
  }

  /**
   * 홈의 큰 버튼 — ★사주+기질 풀이가 메인★(2026-10-08 대표 결정).
   * 결제 → 사주 정보 → 사주 풀이 → 기질 검사 → 올해 운세 순서를 lib/package/journey.ts가 정한다.
   * 조회 실패는 '아직 안 함'과 다른 상태다 — 실패를 결제·새 입력으로 밀지 않고 다시 불러오게만 한다.
   */
  const journey: JourneyStep | null = data.pkg ? nextJourneyStep(data.pkg.state) : null;
  // 시작 전인 사람은 결제·입력 화면으로 바로 보내지 않고, 어떻게 진행되고 뭘 받는지 보여주는 소개부터 연다.
  const beforeStart = journey !== null && data.pkg !== null && isBeforeStart(journey, data.pkg.payment);
  const loadFailed = data.packageLoadFailed || !journey;
  const heroCta: { note: string; href: string; label: string } = loadFailed
      ? {
          note: "지금 풀이 상태를 불러오지 못했어요. 결제나 저장본이 있는지는 아직 알 수 없어요.",
          href: "/dashboard",
          label: "다시 불러오기",
        }
      : beforeStart
        ? { note: PACKAGE_PITCH, href: PACKAGE_INTRO_HREF, label: "사주와 기질, 한 번에 보기" }
        : { note: journey.note, href: journey.href, label: journey.label };


  if (initializing) {
    return <main className="page"><PageLoading label="내 흐름을 준비하고 있어요" /></main>;
  }

  return (
    <div className={`page home-page ${styles.home}`}>
      <section className={styles.hero} data-home-portrait aria-labelledby="life-path-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>사주와 기질로 함께 읽는 나</p>
          <h1 id="life-path-title"><span>사주에 기질을 더해</span><span>나를 더 선명하게</span></h1>
          <p className={styles.lead}>태어난 정보와 기질 설문을 함께 살펴<br />나의 성향과 선택의 방향을 읽어드려요.</p>
        </div>
        <figure className={styles.portrait}>
          <div className={styles.portraitFrame}>
            <picture>
              <source media="(max-width: 767px)" srcSet="/hero-art/self-portrait-v1-640.webp" />
              <Image className="home-portrait-image" src="/hero-art/self-portrait-v1.webp" width={1280} height={1280} unoptimized loading="eager" fetchPriority="high" alt="사주의 정돈된 구조와 기질의 유기적인 흐름이 겹쳐 한 사람을 완성하는 상징적 초상. 개인 분석 결과가 아닙니다." />
            </picture>
            <svg className={styles.sightlines} viewBox="0 0 600 600" fill="none" aria-hidden="true">
              <g className={styles.sajuSight}>
                <text className={styles.sightlineText} x="24" y="200">사주</text>
                <path d="M34 216H134L212 266M201 252l11 14-17-1" />
                <circle cx="212" cy="266" r="3" />
              </g>
              <g className={styles.temperamentSight}>
                <text className={styles.sightlineText} x="575" y="139" textAnchor="end">기질</text>
                <path d="M561 155H493L462 220M460 203l2 17 14-10" />
                <circle cx="462" cy="220" r="3" />
              </g>
            </svg>
          </div>
        </figure>
        <div className={`home-fusion-action ${styles.action}`}>
          {loadFailed ? (
            <button type="button" className={`home-fusion-cta ${styles.cta}`} onClick={retryPackage} disabled={retrying} aria-busy={retrying} aria-describedby="home-status-note">
              {retrying ? "다시 불러오는 중" : heroCta.label} <span className={styles.arrow} aria-hidden />
            </button>
          ) : (
            <Link href={heroCta.href} className={`home-fusion-cta ${styles.cta}`}>{heroCta.label} <span className={styles.arrow} aria-hidden /></Link>
          )}
          <p id="home-status-note" role={loadFailed ? "status" : undefined}>{heroCta.note}</p>
        </div>
      </section>
      {journey && <PackageSteps journey={journey} beforeStart={beforeStart} price={data.pkg?.product.price} free={data.pkg?.payment === "free"} />}
      <section className="home-other" aria-labelledby="home-other-title">
        <div className="home-other-heading"><h2 id="home-other-title">다른 궁금함도 있다면</h2></div>
        <nav className="home-other-links" aria-label="다른 풀이 둘러보기">
          {[
            { title: "가족 사주", note: "우리 사이의 다른 결", href: "/explore/family" },
            { title: "궁합", note: "두 사람이 만나는 자리", href: "/explore/compat" },
            { title: "용신 풀이", note: "내게 힘을 더하는 기운", href: "/explore/yongsin" },
            { title: "고민 상담", note: "지금의 선택을 함께 정리", href: "/explore/consult" },
          ].map((item) => <Link key={item.href} href={item.href} className="home-other-link"><span><strong>{item.title}</strong><small>{item.note}</small></span><span className={`${styles.arrow} ${styles.arrowChevron}`} aria-hidden /></Link>)}
        </nav>
      </section>
      <footer className="home-company-footer" aria-label="회사 정보"><div className="home-company-top"><strong>SAJULIFE</strong><span>사주언니 x 기질오빠</span></div><p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p><div className="home-company-links" aria-label="정책 안내">{COMPANY_LINKS.map((item) => item.href.startsWith("mailto:") ? <a key={item.label} href={item.href}>{item.label}</a> : <Link key={item.label} href={item.href}>{item.label}</Link>)}</div><address>{COMPANY_INFO.map((item) => <span key={item}>{item}</span>)}</address><small>© 2026 SAJULIFE. All rights reserved.</small></footer>
    </div>
  );
}

/**
 * 사주+기질 풀이 세 단계 — 지금 어디까지 왔는지만 보여준다(누르는 곳은 위 큰 버튼 하나).
 * 시작 전에는 무엇이 들어 있는지와 가격을 함께 보여준다.
 */
function PackageSteps({ journey, beforeStart, price, free }: { journey: JourneyStep; beforeStart: boolean; price?: number; free?: boolean }) {
  const stateOf = (step: number): "done" | "now" | "todo" => {
    if (journey.key === "done") return "done";
    if (beforeStart) return "todo";
    if (step < journey.stage) return "done";
    return step === journey.stage ? "now" : "todo";
  };
  const label = { done: "완료", now: "지금", todo: "" } as const;
  // ★이미 받은 풀이로 돌아가는 길★ — 큰 버튼은 늘 '다음 단계'를 가리켜서, 사주를 이미 본 사람은
  // 홈에서 자기 사주로 돌아갈 입구가 없었다. 끝난 단계 줄을 눌러 다시 보게 한다(기질 검사는 볼 화면이 따로 없어 제외).
  const revisitHref: Partial<Record<number, string>> = { 1: "/saju", 3: "/fusion" };
  const homeStepCopy = [
    { title: "사주", description: "타고난 특징과 삶의 흐름" },
    { title: "기질", description: "평소의 반응과 행동 성향" },
    { title: "통합", description: "나에게 맞는 선택의 방향" },
  ];
  return (
    <div className="home-package">
      <h2 className="home-package-heading">나를 이해하는 세 단계</h2>
      <ol className="home-package-steps" aria-label="사주+기질 풀이 진행">
        {PACKAGE_STEPS.map((s) => {
          const st = stateOf(s.step);
          const href = st === "done" ? revisitHref[s.step] : undefined;
          const content = (
            <>
              <span className="home-package-no" aria-hidden>{st === "done" ? "✓" : s.step}</span>
              <span className="home-package-title">{homeStepCopy[s.step - 1].title}<small className="home-package-description">{homeStepCopy[s.step - 1].description}</small></span>
              {href ? (
                <span className="home-package-state">다시 보기 <span className={styles.arrow} aria-hidden /></span>
              ) : (
                label[st] && <span className="home-package-state">{label[st]}</span>
              )}
            </>
          );
          return (
            <li key={s.step} className={`home-package-step is-${st}`}>
              {href ? <Link href={href} className="home-package-step-link">{content}</Link> : content}
            </li>
          );
        })}
      </ol>
      {beforeStart && price != null && (
        <p className="home-package-price">
          {free ? `세 단계 모두 베타 기간 무료 (정가 ${formatWon(price)})` : `세 단계 모두 ${formatWon(price)}`}
        </p>
      )}
    </div>
  );
}
