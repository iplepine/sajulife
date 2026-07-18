"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PersonSwitcher from "@/components/PersonSwitcher";

export type ReportIntroKind = "personal" | "yongsin" | "temperament" | "family";

type IntroConfig = {
  eyebrow: string;
  title: string;
  description: string;
  art: string;
  cta: string;
  href: string;
  needsProfile?: boolean;
  points: Array<{ title: string; description: string }>;
};

const INTRO: Record<ReportIntroKind, IntroConfig> = {
  personal: {
    eyebrow: "개인 사주",
    title: "내 삶의 기본 흐름을 읽어볼까?",
    description: "태어난 순간의 구조를 바탕으로, 내가 가진 중심과 지금 선택에 쓸 기준을 살펴봐.",
    art: "/brand-icons/saju-compass-ink.png",
    cta: "개인 사주 보기",
    href: "/saju",
    needsProfile: true,
    points: [
      { title: "타고난 구조", description: "내 사주의 중심축과 균형" },
      { title: "삶의 흐름", description: "일과 관계에서 반복되는 방향" },
      { title: "지금의 기준", description: "당장 선택할 때 붙잡을 한 가지" },
    ],
  },
  yongsin: {
    eyebrow: "용신",
    title: "지금 내게 필요한 기운은 뭘까?",
    description: "내 사주에서 힘을 보태는 방향과 덜어내야 할 과부하를 살펴봐.",
    art: "/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png",
    cta: "용신 보기",
    href: "/saju/yongsin",
    needsProfile: true,
    points: [
      { title: "필요한 기운", description: "지금 내게 힘을 보태는 방향" },
      { title: "과부하 신호", description: "애써도 더 지치는 패턴" },
      { title: "흐름의 때", description: "힘을 주고 빼면 좋은 시기" },
    ],
  },
  temperament: {
    eyebrow: "나의 기질",
    title: "나는 왜 이렇게 반응할까?",
    description: "일곱 기질 차원으로 나의 반응 습관과 강점을 차분히 확인해봐.",
    art: "/brand-icons/temperament-profile-ink.png",
    cta: "기질 검사 시작",
    href: "/tci",
    points: [
      { title: "반응의 결", description: "낯선 일과 관계에서의 기본 반응" },
      { title: "나의 강점", description: "자연스럽게 발휘되는 에너지" },
      { title: "조절의 힌트", description: "나답게 오래 가는 방법" },
    ],
  },
  family: {
    eyebrow: "가족 사주",
    title: "우리 관계는 어디에서 엇갈릴까?",
    description: "가족 각자의 흐름을 함께 놓고, 서로의 차이와 대화 포인트를 찾아봐.",
    art: "/brand-icons/family-ink.png",
    cta: "가족 사주 보기",
    href: "/family",
    needsProfile: true,
    points: [
      { title: "관계의 결", description: "서로 다르게 반응하는 이유" },
      { title: "대화 포인트", description: "부딪히기 전 알아둘 말의 방향" },
      { title: "조율 방식", description: "가족 안에서 지킬 거리와 역할" },
    ],
  },
};

export default function ReportIntroPage({ kind }: { kind: ReportIntroKind }) {
  const config = INTRO[kind];
  const [profileReady, setProfileReady] = useState(!config.needsProfile);
  const [profileLoaded, setProfileLoaded] = useState(!config.needsProfile);

  useEffect(() => {
    if (!config.needsProfile) return;
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) => setProfileReady(!!data.profile))
      .catch(() => setProfileReady(false))
      .finally(() => setProfileLoaded(true));
  }, [config.needsProfile]);

  const ctaHref = profileReady
    ? config.href
    : `/onboarding?next=${encodeURIComponent(config.href)}`;
  const ctaLabel = !profileLoaded
    ? "준비 중…"
    : profileReady ? config.cta : "사주 정보 입력하기";

  return (
    <main className="page intro-page">
      <header className="intro-page-head">
        <p className="h-sec">풀이 시작</p>
        {config.needsProfile && <PersonSwitcher nameOnly />}
      </header>

      <section className="intro-hero" aria-labelledby={`intro-${kind}-title`}>
        <div className="intro-hero-copy">
          <p className="intro-eyebrow">{config.eyebrow}</p>
          <h1 id={`intro-${kind}-title`}>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <img className={`intro-hero-art intro-hero-art--${kind}`} src={config.art} alt="" draggable={false} />
      </section>

      <section className="intro-points" aria-label={`${config.eyebrow}에서 확인하는 내용`}>
        {config.points.map((point, index) => (
          <article key={point.title} className="intro-point">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{point.title}</strong>
              <p>{point.description}</p>
            </div>
          </article>
        ))}
      </section>

      <Link
        href={ctaHref}
        aria-disabled={!profileLoaded}
        className={`btn btn-primary btn-block intro-cta${profileLoaded ? "" : " is-pending"}`}
        style={{ textDecoration: "none" }}
      >
        {ctaLabel} <span aria-hidden>→</span>
      </Link>
    </main>
  );
}
