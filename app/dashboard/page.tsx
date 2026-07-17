"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { SajuProfile } from "@/lib/store/types";

const COMPANY_LINKS = ["이용약관", "개인정보 처리방침", "환불 정책", "고객센터"];

const COMPANY_INFO = [
  "데브호하우스 | 대표: 박정호 | 사업자등록번호: 000-00-00000",
  "통신판매업신고번호: 2026-서울중랑-0000",
  "서울특별시 중랑구 신내로 155 | 문의: hello@sajulife.kr",
];

type HomeData = {
  profile: SajuProfile | null;
  tciAnswersDone: boolean;
};

const EMPTY_HOME_DATA: HomeData = {
  profile: null,
  tciAnswersDone: false,
};

type Feature = { icon: BrandIconName; name: string; href: string };
type Spotlight = Feature & { kicker: string; title: string; detail: string; cta: string };

export default function DashboardPage() {
  const [data, setData] = useState<HomeData>(EMPTY_HOME_DATA);
  const [activeSpotlight, setActiveSpotlight] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 홈은 여러 보조 API 중 하나가 느려도 첫 화면을 막지 않는다.
    async function readJson<T>(url: string): Promise<T | null> {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        return (await response.json()) as T;
      } catch {
        return null;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    async function load() {
      const profileRes = await readJson<{ profile?: SajuProfile }>("/api/profile");
      const profile = profileRes?.profile ?? null;
      if (!profile) {
        if (!cancelled) setData(EMPTY_HOME_DATA);
        return;
      }

      const [tciRes] = await Promise.all([
        readJson<{ tci?: unknown }>("/api/tci/answers"),
      ]);
      if (cancelled) return;

      setData({
        profile,
        tciAnswersDone: !!tciRes?.tci,
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const hasProfile = !!data.profile;
  const withProfile = (href: string) => (hasProfile ? href : `/onboarding?next=${encodeURIComponent(href)}`);

  const spotlights: Spotlight[] = [
    {
      icon: "home-saju",
      kicker: "내 사주",
      title: "내 사주, 어떤 흐름일까?",
      detail: "타고난 구조와 삶의 흐름을 먼저 읽어봐.",
      cta: "내 사주 보기",
      name: "내 사주 리포트",
      href: withProfile("/saju"),
    },
    {
      icon: "saju",
      kicker: "내 용신",
      title: "내게 필요한 기운은 뭘까?",
      detail: "내 사주를 바탕으로 용신을 집중적으로 풀어봐.",
      cta: "용신 리포트 보기",
      name: "내 용신 리포트",
      href: withProfile("/saju/yongsin"),
    },
    {
      icon: "home-family",
      kicker: "가족 사주",
      title: "우리 가족은 왜 다르게 반응할까?",
      detail: "가족 관계의 결, 대화 포인트를 함께 봐.",
      cta: "가족 사주 보기",
      name: "가족 사주",
      href: withProfile("/family"),
    },
  ];

  useEffect(() => {
    if (!autoRotate || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveSpotlight((current) => (current + 1) % spotlights.length);
    }, 6_000);
    return () => window.clearInterval(timer);
  }, [autoRotate, reducedMotion, spotlights.length]);

  function selectSpotlight(index: number) {
    setActiveSpotlight(index);
    setAutoRotate(false);
  }

  const features: Feature[] = [
    {
      icon: "home-saju",
      name: "내 사주 리포트",
      href: withProfile("/saju"),
    },
    {
      icon: "saju",
      name: "내 용신 리포트",
      href: withProfile("/saju/yongsin"),
    },
    {
      icon: "home-family",
      name: "가족 사주",
      href: withProfile("/family"),
    },
    {
      icon: "home-tci",
      name: "내 기질 리포트",
      href: withProfile(data.tciAnswersDone ? "/tci/report" : "/tci"),
    },
    {
      icon: "home-fusion",
      name: "사주 + 기질",
      href: withProfile(data.tciAnswersDone ? "/fusion" : "/tci"),
    },
  ];

  return (
    <div className="page home-page">
      <header className="home-dashboard-bar" aria-label="홈 상단">
        <span className="home-dashboard-brand">사주언니 x 기질오빠</span>
        <span className="home-dashboard-actions">
          <PersonSwitcher className="home-dashboard-person" />
          <Link href="/notifications" className="home-dashboard-history" aria-label="알림 보기">
            <BrandIcon name="notification" />
          </Link>
        </span>
      </header>
      <section
        className="home-spotlight"
        aria-label="대표 리포트 소개"
        onMouseEnter={() => setAutoRotate(false)}
        onFocusCapture={() => setAutoRotate(false)}
        onTouchStart={() => setAutoRotate(false)}
      >
        <p className="home-spotlight-brand">사주언니 x 기질오빠</p>
        <div className="home-spotlight-deck">
          {spotlights.map((spotlight, index) => {
            const isActive = index === activeSpotlight;
            return (
              <article key={spotlight.name} className={`home-spotlight-slide${isActive ? " is-active" : ""}`} aria-hidden={!isActive}>
                <BrandIcon name={spotlight.icon} className="home-spotlight-icon" />
                <div className="home-spotlight-copy">
                  <em>{spotlight.kicker}</em>
                  <h1>{spotlight.title}</h1>
                  <p>{spotlight.detail}</p>
                  <Link href={spotlight.href} className="home-spotlight-cta" tabIndex={isActive ? 0 : -1}>
                    {spotlight.cta} <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        <div className="home-spotlight-dots" aria-label="소개 배너 선택">
          {spotlights.map((spotlight, index) => (
            <button
              key={spotlight.name}
              type="button"
              className={index === activeSpotlight ? "is-active" : ""}
              aria-label={`${spotlight.name} 소개 보기`}
              aria-pressed={index === activeSpotlight}
              onClick={() => selectSpotlight(index)}
            />
          ))}
        </div>
      </section>

      <section className="home-feature" aria-label="제공 기능">
        <h2 className="home-feature-title">어디부터 알아볼까?</h2>
        <div className="home-feature-list">
          {features.map((f) => (
            <Link key={f.name} href={f.href} className="home-feature-row">
              <BrandIcon name={f.icon} className="home-feature-icon" />
              <span className="home-feature-main">
                <strong>{f.name}</strong>
              </span>
              <span className="home-feature-arrow" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-company-footer" aria-label="회사 정보">
        <div className="home-company-top">
          <strong>SAJULIFE</strong>
          <span>사주언니 x 기질오빠</span>
        </div>
        <p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p>
        <div className="home-company-links" aria-label="정책 안내">
          {COMPANY_LINKS.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <address>
          {COMPANY_INFO.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </address>
        <small>© 2026 SAJULIFE. All rights reserved.</small>
      </footer>
    </div>
  );
}
