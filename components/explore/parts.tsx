"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { SEASON_ART, SEASON_FALLBACK_STEM } from "@/lib/saju/seasonArt";
import type { ThemeSeason } from "@/lib/saju/seasonTheme";

/**
 * 구매 유도 페이지(/explore/*)가 공유하는 뼈대.
 *
 * ★왜 공용으로 뽑았나★ — 원래 개인 사주만 전용 화면을 갖고 나머지 넷은 얇은 소개 한 장을
 * 돌려 썼다. 다섯 개를 각각 손으로 만들면 히어로 문법·잠금 표현·설득 순서가 금방 갈라진다.
 * 갈라지면 "같은 서비스가 파는 다섯 가지"가 아니라 "따로 만든 다섯 페이지"로 읽힌다.
 *
 * ★공용으로 두는 것★: 히어로 / CTA / 반론 격파 / 잠긴 미리보기 / 스펙.
 * ★페이지마다 다른 것★: 그 사이에 끼우는 '무료 증거' 블록 — 이건 리포트마다 재료가 달라서
 * 공용화하면 오히려 알맹이가 빠진다(개인=만세력, 용신=3방법 교차, 기질=8축, 가족=구성원).
 */

/** 사주 정보가 없을 때 궤도에 띄우는 보조 기호 — 홈 히어로와 같은 8자. */
export const GENERIC_STEMS = ["甲", "丁", "戊", "己", "丙", "辛", "癸", "乙"];

/**
 * 히어로 — 홈과 같은 리소스·같은 문법(계절 풍경 + 구슬 + 점선 궤도).
 * 궤도에 뭘 올릴지만 페이지가 정한다. 내 데이터가 있으면 내 글자, 없으면 보조 기호.
 */
export function ExploreHero({
  eyebrow,
  title,
  lead,
  season,
  ready,
  center,
  orbit,
  titleId,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  season: ThemeSeason;
  ready: boolean;
  center?: string;
  orbit?: string[];
  titleId: string;
}) {
  const art = SEASON_ART[season];
  const glyphs = orbit?.length ? orbit : GENERIC_STEMS;
  const step = 360 / glyphs.length;

  return (
    <section className={`pi-hero life-path-hero--${season}${ready ? "" : " pi-hero--waiting"}`} aria-labelledby={titleId}>
      {ready && (
        <div className="life-path-stems pi-hero-stems" style={{ "--stem-step": `${step}deg` } as CSSProperties} aria-hidden>
          <img className="life-path-stem-lines" src={art.constellation} alt="" draggable={false} />
          <img className="life-path-orb" src={art.orb} alt="" draggable={false} />
          <span className="life-path-orb-character">{center || SEASON_FALLBACK_STEM[season]}</span>
          {glyphs.map((ch, index) => (
            <span className="life-path-stem" key={`${ch}-${index}`} style={{ "--stem-index": index } as CSSProperties}>{ch}</span>
          ))}
        </div>
      )}
      <div className="pi-hero-copy">
        <p className="intro-eyebrow">{eyebrow}</p>
        <h1 id={titleId}>{title}</h1>
        <p>{lead}</p>
      </div>
    </section>
  );
}

export type ExploreCtaState = { href: string; label: string; note: string; pending: boolean };

/** CTA — 스크롤 전에 한 번 만나게 히어로 바로 아래 둔다. */
export function ExploreCta({ cta }: { cta: ExploreCtaState }) {
  return (
    <div className="pi-cta-wrap pi-cta-wrap--early">
      <Link
        href={cta.href}
        aria-disabled={cta.pending}
        className={`btn btn-primary btn-block intro-cta${cta.pending ? " is-pending" : ""}`}
        style={{ textDecoration: "none" }}
      >
        {cta.label} <span aria-hidden>→</span>
      </Link>
      {cta.note && <p className="pi-cta-note">{cta.note}</p>}
    </div>
  );
}

/**
 * 스크롤 등장 — 목록이 화면에 들어오면 항목이 차례로 붙는다.
 *
 * ★설계 원칙(P9)은 "장식 애니메이션 금지"지만 여기는 예외★ — 이 목록은 논거를 하나씩
 * 쌓아 설득하는 자리라 등장 순서가 읽는 속도를 잡아주는 기능을 한다. 대신 두 가지는 지킨다:
 * (1) prefers-reduced-motion이면 애니메이션 없이 바로 보이고,
 * (2) 숨김은 JS가 붙은 뒤에만 건다 — 스크립트가 죽어도 내용이 사라지지 않게.
 */
export function useStaggerReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.children) as HTMLElement[];
    if (items.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    root.classList.add("reveal-on");
    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          items.forEach((item, i) => {
            timers.push(window.setTimeout(() => item.classList.add("is-in"), i * 90));
          });
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      timers.forEach(window.clearTimeout);
    };
  }, []);
  return ref;
}

/**
 * 설득 블록 — 설명이 아니라 ★반론 죽이기★.
 * 제목에서 그 상품의 1번 구매 저항을 바로 받아친다. 각 항목은 한 줄.
 * ★사용자 노출 카피에 'AI'는 쓰지 않는다★ — 말하는 사람은 사주언니지 기계가 아니다.
 */
export function HowBlock({
  kicker,
  title,
  items,
  close,
  titleId,
}: {
  kicker: string;
  title: string;
  items: Array<{ t: string; d: string }>;
  close: string;
  titleId: string;
}) {
  const listRef = useStaggerReveal<HTMLOListElement>();
  return (
    <section className="pi-how" aria-labelledby={titleId}>
      <p className="pi-how-k">{kicker}</p>
      <h2 id={titleId}>{title}</h2>
      <ol ref={listRef}>
        {items.map((item) => (
          <li key={item.t}>
            <div>
              <strong>{item.t}</strong>
              <p>{item.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="pi-how-close">{close}</p>
    </section>
  );
}

/**
 * 리포트 미리보기 — ★실제 리포트와 같은 마크업(.rv / .rv-sec / .rv-h / .rv-body)★을 쓴다.
 * 껍데기를 따로 만들면 "산 뒤에 보게 될 것"과 다른 그림이 되므로 서식을 그대로 빌려 쓴다.
 *
 * 첫 섹션만 열려 있고, 열린 자리에 들어가는 건 ★지어낸 예시가 아니라 실제 계산값★(openLead/openBody).
 * 계산값이 없으면 그냥 섹션 설명을 보여주고 본문은 잠금 막대로 둔다 — 가짜 문장은 절대 만들지 않는다.
 */
export function LockedPreview({
  cover,
  sections,
  openLead,
  openBody,
}: {
  cover: string;
  sections: ReadonlyArray<{ name: string; desc: string }>;
  openLead?: string;
  openBody?: string;
}) {
  const [first, ...rest] = sections;
  if (!first) return null;

  return (
    <div className="rv rv--json pi-preview">
      <p className="pi-preview-cover">{cover}</p>

      <details className="rv-sec pi-preview-open" open>
        <summary className="rv-h rv-h--with-lead">
          <span className="rv-h-copy">
            <span className="t">{first.name}</span>
            <span className="rv-h-lead">{openLead ?? first.desc}</span>
          </span>
        </summary>
        <div className="rv-body">
          {openBody && <p className="rv-lead">{openBody}</p>}
          {/* 잠긴 본문 — 가짜 문장을 지어내지 않고 '글이 있다'는 것만 보여준다. */}
          <div className="pi-locked" aria-label="여기서부터 잠긴 본문">
            <span /><span /><span /><span /><span />
          </div>
        </div>
      </details>

      {rest.map((s) => (
        <div className="rv-sec pi-preview-locked" key={s.name}>
          <div className="rv-h rv-h--with-lead">
            <span className="rv-h-copy">
              <span className="t">{s.name}</span>
              <span className="rv-h-lead">{s.desc}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 오퍼 블록 — 잠긴 미리보기 + 한 줄 스펙. 다섯 화면이 같은 자리에서 같은 약속을 한다. */
export function ExploreOffer({
  title,
  lead,
  specs,
  children,
  titleId,
}: {
  title: string;
  lead: string;
  specs: Array<{ k: string; v: string }>;
  children: ReactNode;
  titleId: string;
}) {
  return (
    <section className="pi-offer" aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      <p className="pi-offer-lead">{lead}</p>
      {children}
      <dl className="pi-specs">
        {specs.map((s) => (
          <div key={s.k}><dt>{s.k}</dt><dd>{s.v}</dd></div>
        ))}
      </dl>
    </section>
  );
}

/**
 * 데이터가 아직 없을 때의 자리 — 개인 사주의 ChartPlaceholder와 같은 톤.
 * 빈 화면을 보여주느니 "뭘 넣으면 뭐가 열리는지"를 말한다.
 */
export function ExploreEmpty({ loaded, children }: { loaded: boolean; children: ReactNode }) {
  return (
    <section className="pi-mine pi-mine--empty" aria-label="아직 준비되지 않은 재료">
      <p className="pi-empty-copy">{loaded ? children : "불러오는 중…"}</p>
    </section>
  );
}
