"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { SajuProfile } from "@/lib/store/types";

const COMPANY_LINKS = ["이용약관", "개인정보 처리방침", "환불 정책", "고객센터"];
const COMPANY_INFO = [
  "데브호하우스 | 대표: 박정호 | 사업자등록번호: 000-00-00000",
  "통신판매업신고번호: 2026-서울중랑-0000",
  "서울특별시 중랑구 신내로 155 | 문의: hello@sajulife.kr",
];

type HomeData = { profile: SajuProfile | null; tciAnswersDone: boolean };
type Feature = {
  art: string;
  name: string;
  description: string;
  href: string;
  emphasis?: "saju";
};
type Spotlight = { icon: BrandIconName; name: string; href: string; element: string; kicker: string; title: string; detail: string; cta: string; art?: string };

const EMPTY_HOME_DATA: HomeData = { profile: null, tciAnswersDone: false };

export default function DashboardPage() {
  const [data, setData] = useState<HomeData>(EMPTY_HOME_DATA);
  const [profileResolved, setProfileResolved] = useState(false);
  const [activeSpotlight, setActiveSpotlight] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const spotlightTouchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressSpotlightClick = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function readJson<T>(url: string): Promise<T | null> {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        return response.ok ? (await response.json()) as T : null;
      } catch {
        return null;
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void (async () => {
      const profileRes = await readJson<{ profile?: SajuProfile }>("/api/profile");
      const profile = profileRes?.profile ?? null;
      if (!profile) {
        if (!cancelled) {
          setData(EMPTY_HOME_DATA);
          setProfileResolved(true);
        }
        return;
      }
      const tciRes = await readJson<{ tci?: unknown }>("/api/tci/answers");
      if (!cancelled) {
        setData({ profile, tciAnswersDone: !!tciRes?.tci });
        setProfileResolved(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const hasProfile = !!data.profile;
  const withProfile = (href: string) => !profileResolved || hasProfile ? href : `/onboarding?next=${encodeURIComponent(href)}`;
  const spotlights: Spotlight[] = [
    { icon: "home-saju", kicker: "내 사주", title: "내 사주, 어떤 흐름일까?", detail: "타고난 구조와 삶의 흐름을 먼저 읽어봐.", cta: "개인 사주 알아보기", name: "개인 사주", href: "/explore/personal", element: "土", art: "/yongsin-dragon-assets/sliced/dragons/dragon-earth.png" },
    { icon: "saju", kicker: "내 용신", title: "내게 필요한 기운은 뭘까?", detail: "내 사주를 바탕으로 용신을 집중적으로 풀어봐.", cta: "용신 알아보기", name: "용신", href: "/explore/yongsin", element: "水", art: "/yongsin-dragon-assets/sliced/dragons/dragon-water.png" },
    { icon: "consult", kicker: "용신상담", title: "지금 필요한 기운으로 풀어볼까?", detail: "내 용신을 기준으로 고민을 정리하고 다음 선택을 찾아봐.", cta: "용신상담 시작", name: "용신상담", href: withProfile("/consult"), element: "用" },
    { icon: "home-family", kicker: "가족 사주", title: "우리 가족은 왜 다르게 반응할까?", detail: "가족 관계의 결, 대화 포인트를 함께 봐.", cta: "가족 사주 알아보기", name: "가족 사주", href: "/explore/family", element: "金", art: "/yongsin-dragon-assets/sliced/dragons/dragon-metal.png" },
    { icon: "account", kicker: "새 사람 추가", title: "다른 사람의 흐름도 같이 볼까?", detail: "가족·친구의 정보를 더하면 각자 기준으로 리포트를 볼 수 있어.", cta: "사람 추가하기", name: "새 사람 추가", href: "/account", element: "人" },
    data.tciAnswersDone
      ? { icon: "tci", kicker: "나의 기질", title: "내 반응의 결을 알아볼까?", detail: "일곱 기질 차원에서 나의 성향과 반응을 읽어봐.", cta: "기질 알아보기", name: "나의 기질", href: "/explore/temperament", element: "心" }
      : { icon: "tci", kicker: "기질 검사", title: "나는 왜 이렇게 반응할까?", detail: "내 타고난 반응과 성향을 기질 검사로 찾아봐.", cta: "기질 알아보기", name: "기질 검사", href: "/explore/temperament", element: "心" },
  ];

  useEffect(() => {
    if (!autoRotate || reducedMotion) return;
    const timer = window.setInterval(() => setActiveSpotlight((current) => (current + 1) % spotlights.length), 6_000);
    return () => window.clearInterval(timer);
  }, [autoRotate, reducedMotion, spotlights.length]);

  function selectSpotlight(index: number) { setActiveSpotlight(index); setAutoRotate(false); }
  function moveSpotlight(direction: 1 | -1) { setActiveSpotlight((current) => (current + direction + spotlights.length) % spotlights.length); setAutoRotate(false); }
  function onSpotlightTouchStart(event: React.TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    spotlightTouchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    setAutoRotate(false);
  }
  function onSpotlightTouchEnd(event: React.TouchEvent<HTMLElement>) {
    const start = spotlightTouchStart.current;
    const end = event.changedTouches[0];
    spotlightTouchStart.current = null;
    if (!start || !end) return;
    const deltaX = end.clientX - start.x;
    const deltaY = end.clientY - start.y;
    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    suppressSpotlightClick.current = true;
    moveSpotlight(deltaX < 0 ? 1 : -1);
    window.setTimeout(() => { suppressSpotlightClick.current = false; }, 400);
  }

  const features: Feature[] = [
    {
      art: "/brand-icons/saju-compass-ink.png",
      name: "개인 사주",
      description: "타고난 구조와 흐름",
      href: "/explore/personal",
      emphasis: "saju",
    },
    {
      art: "/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png",
      name: "내 용신",
      description: "내게 필요한 기운",
      href: "/explore/yongsin",
    },
    {
      art: "/brand-icons/family-ink.png",
      name: "가족 사주",
      description: "우리 관계의 결",
      href: "/explore/family",
    },
    {
      art: "/brand-icons/temperament-ribbons-ink.png",
      name: data.tciAnswersDone ? "나의 기질" : "기질 검사",
      description: data.tciAnswersDone ? "나의 반응과 성향" : "나의 반응과 성향을 찾아봐요",
      href: "/explore/temperament",
    },
  ];

  return (
    <div className="page home-page">
      <header className="home-dashboard-bar" aria-label="홈 상단">
        <span className="home-dashboard-brand">사주언니 x 기질오빠</span>
        <span className="home-dashboard-actions"><PersonSwitcher className="home-dashboard-person" /><Link href="/notifications" className="home-dashboard-history" aria-label="알림 보기"><BrandIcon name="notification" /></Link></span>
      </header>
      <section className="home-spotlight" aria-label="대표 리포트 소개" onMouseEnter={() => setAutoRotate(false)} onFocusCapture={() => setAutoRotate(false)}>
        <div className="home-spotlight-deck home-ledger-deck" onTouchStart={onSpotlightTouchStart} onTouchEnd={onSpotlightTouchEnd} onClickCapture={(event) => { if (!suppressSpotlightClick.current) return; suppressSpotlightClick.current = false; event.preventDefault(); event.stopPropagation(); }}>
          {spotlights.map((spotlight, index) => {
            const isActive = index === activeSpotlight;
            return <article key={spotlight.name} className={`home-spotlight-slide home-ledger-slide${isActive ? " is-active" : ""}`} aria-hidden={!isActive}>
              <div className="home-ledger-copy"><em>{spotlight.kicker} · PERSONAL LEDGER</em><h1>{spotlight.title}</h1><p>{spotlight.detail}</p><Link href={spotlight.href} className="home-spotlight-cta" tabIndex={isActive ? 0 : -1}>{spotlight.cta} <span aria-hidden>→</span></Link></div>
              <div className="home-ledger-art" aria-hidden><i className="home-ledger-ring home-ledger-ring--one" /><i className="home-ledger-ring home-ledger-ring--two" /><span className="home-ledger-seal">{spotlight.element}</span>{spotlight.art ? <img src={spotlight.art} alt="" draggable={false} /> : <BrandIcon name={spotlight.icon} className="home-ledger-glyph" />}</div>
            </article>;
          })}
        </div>
        <div className="home-spotlight-dots" aria-label="소개 배너 선택">{spotlights.map((spotlight, index) => <button key={spotlight.name} type="button" className={index === activeSpotlight ? "is-active" : ""} aria-label={`${spotlight.name} 소개 보기`} aria-pressed={index === activeSpotlight} onClick={() => selectSpotlight(index)} />)}</div>
      </section>
      <section className="home-feature" aria-label="사주와 기질 리포트">
        <div className="home-report-grid">
          {features.map((feature) => (
            <Link key={feature.name} href={feature.href} className={`home-report-card${feature.emphasis ? ` home-report-card--${feature.emphasis}` : ""}`} aria-label={`${feature.name}: ${feature.description}`}>
              <img className="home-report-card-icon" src={feature.art} alt="" draggable={false} />
              <span className="home-report-card-copy"><strong>{feature.name}</strong><small>{feature.description}</small></span>
              <span className="home-report-card-arrow" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="home-company-footer" aria-label="회사 정보"><div className="home-company-top"><strong>SAJULIFE</strong><span>사주언니 x 기질오빠</span></div><p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p><div className="home-company-links" aria-label="정책 안내">{COMPANY_LINKS.map((item) => <span key={item}>{item}</span>)}</div><address>{COMPANY_INFO.map((item) => <span key={item}>{item}</span>)}</address><small>© 2026 SAJULIFE. All rights reserved.</small></footer>
    </div>
  );
}
