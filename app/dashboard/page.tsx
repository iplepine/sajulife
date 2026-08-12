"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { SajuProfile } from "@/lib/store/types";
import type { PeopleStore } from "@/lib/people/client";
import type { SajuResult } from "@/lib/saju/calculator";
import { seasonOfBranch, type Season as SeasonKo } from "@/lib/saju/seasonClock";
import { SEASON_FALLBACK_STEM } from "@/lib/saju/seasonArt";

const COMPANY_LINKS = ["이용약관", "개인정보 처리방침", "환불 정책", "고객센터"];
const COMPANY_INFO = [
  "데브호하우스 | 대표: 박정호 | 사업자등록번호: 000-00-00000",
  "통신판매업신고번호: 2026-서울중랑-0000",
  "서울특별시 중랑구 신내로 155 | 문의: hello@sajulife.kr",
];

type HomeData = {
  profile: SajuProfile | null;
  tciAnswersDone: boolean;
  yongsinRead: boolean;
  /** 홈 테마 계절을 선택한 인물 기준으로 잡기 위한 만세력. */
  saju: SajuResult | null;
  currentYear: number;
  people: PeopleStore | null;
};
const EMPTY_HOME_DATA: HomeData = {
  profile: null,
  tciAnswersDone: false,
  yongsinRead: false,
  saju: null,
  currentYear: new Date().getFullYear(),
  people: null,
};

/** 퀵액션 — 하단 탭(홈·기록·용신상담·가족·마이)과 달리 '무엇을 볼지' 주제로 들어가는 입구. */
type QuickAction = { icon: BrandIconName; name: string; href: string };

/** 추천 배너 한 장. 좌우로 넘겨보는 레일에 담긴다. */
type Nudge = {
  id: string;
  kicker: string;
  title: string;
  note: string;
  href: string;
  label: string;
  art: string;
};

/** 아트 경로는 [seasonArt.ts](lib/saju/seasonArt.ts)가 단일 출처 — 풀이 인트로와 같은 그림을 쓴다. */
type Season = {
  key: "spring" | "summer" | "autumn" | "winter";
  /** seasonClock의 한글 계절과 잇는 키 */
  ko: SeasonKo;
  months: readonly number[];
};

const SEASONS: readonly Season[] = [
  { key: "spring", ko: "봄", months: [3, 4, 5] },
  { key: "summer", ko: "여름", months: [6, 7, 8] },
  { key: "autumn", ko: "가을", months: [9, 10, 11] },
  { key: "winter", ko: "겨울", months: [12, 1, 2] },
];

/**
 * 홈 테마 계절 — ★선택한 인물이 '지금 지나고 있는' 계절★로 잡는다.
 * 기준은 지금 지나는 대운(10년 흐름)의 지지. 대운을 못 잡으면 태어난 달(월지)의 계절로,
 * 사주 자체가 없으면(미입력) 달력 계절로 떨어진다.
 *
 * ★대운의 startAge는 세는나이라 만 나이와 1~2년 어긋난다 — 연도(startYear)로 고른다.★
 */
function seasonForPerson(saju: SajuResult | null, currentYear: number): { season: Season; personal: boolean } {
  const byMonth = SEASONS.find((s) => s.months.includes(new Date().getMonth() + 1)) ?? SEASONS[0];
  if (!saju) return { season: byMonth, personal: false };

  const segs = saju.daewoon ?? [];
  const current = segs.filter((d) => d.startYear <= currentYear).sort((a, b) => b.startYear - a.startYear)[0];
  const zhi = current?.zhi.hanja ?? saju.pillars.month?.zhi.hanja;
  if (!zhi) return { season: byMonth, personal: false };

  const ko = seasonOfBranch(zhi).season;
  return { season: SEASONS.find((s) => s.ko === ko) ?? byMonth, personal: true };
}

// 모든 천간을 나열하지 않고, 중앙 일간을 돋보이게 하는 8개 보조 기호만 둔다.
const STEMS = ["甲", "丁", "戊", "己", "丙", "辛", "癸", "乙"];

export default function DashboardPage() {
  const [data, setData] = useState<HomeData>(EMPTY_HOME_DATA);
  const [initializing, setInitializing] = useState(true);

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
      // 홈 첫 화면에 필요한 상태를 한 번에 읽는다. 프로필 후에 다시 요청하면 진행 표시가
      // 두 번 뜨고, 기본 문구가 실제 인물 문구로 한 번 더 바뀌는 원인이 된다.
      const [profileRes, tciRes, yongsinRes, chartRes, peopleRes] = await Promise.all([
        readJson<{ profile?: SajuProfile }>("/api/profile"),
        readJson<{ tci?: unknown }>("/api/tci/answers"),
        readJson<{ saved?: unknown }>("/api/saju/yongsin"),
        readJson<{ saju?: SajuResult; currentYear?: number }>("/api/saju/chart"),
        readJson<PeopleStore>("/api/people"),
      ]);
      if (cancelled) return;
      const profile = profileRes?.profile ?? null;
      if (!profile) {
        setData({ ...EMPTY_HOME_DATA, people: peopleRes });
        setInitializing(false);
        return;
      }
      setData({
        profile,
        tciAnswersDone: !!tciRes?.tci,
        yongsinRead: !!yongsinRes?.saved,
        saju: chartRes?.saju ?? null,
        currentYear: chartRes?.currentYear ?? new Date().getFullYear(),
        people: peopleRes,
      });
      setInitializing(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const hasProfile = !!data.profile;
  const { season, personal: seasonIsPersonal } = seasonForPerson(data.saju, data.currentYear);
  // 중앙 구슬은 활성 인물의 일간. 사주 정보가 아직 없을 때만 계절 기본 글자로 안전하게 보여준다.
  const centralStem = data.saju?.dayMaster.hanja ?? SEASON_FALLBACK_STEM[season.key];
  const heroNote = hasProfile
    ? "저장한 리포트를 바탕으로 다음 선택을 함께 정리해요."
    : "사주를 바탕으로 지금의 고민과 다음 선택을 연결해요.";

  // 우리가 파는 풀이 6개를 홈에서 전부 보이게 둔다 — 하단 '기록' 탭을 없앤 자리를 여기가 대신한다.
  // 윗줄은 사주로 읽는 것(나 → 필요한 기운 → 가족), 아랫줄은 기질 계열과 물어보기.
  const quickActions: QuickAction[] = [
    { icon: "reading-saju", name: "개인 사주", href: "/explore/personal" },
    { icon: "reading-yongsin", name: "용신 풀이", href: "/explore/yongsin" },
    { icon: "reading-family", name: "가족 사주", href: "/explore/family" },
    { icon: "reading-tci", name: data.tciAnswersDone ? "나의 기질" : "기질 검사", href: "/explore/temperament" },
    { icon: "reading-fusion", name: "사주+기질", href: "/explore/fusion" },
    { icon: "consult", name: "용신 상담", href: "/explore/consult" },
  ];

  // ── 추천 배너 — 한 자리에서 ★좌우로 넘겨보는★ 묶음.
  // 배너를 세로로 쌓으면 홈이 광고판이 되고, 하나만 띄우면 나머지를 영영 못 본다.
  // 가로 레일 하나에 담아 자리는 하나로 두되 내용은 여러 개를 보여준다.
  // 이미 한 것은 아예 목록에서 빠진다 — 다 한 사람에게 시킬 게 없으면 레일 자체가 안 뜬다.
  const familyCount = (data.people?.people ?? []).filter((p) => p.birthDate).length;
  const nudges: Nudge[] = [
    !data.yongsinRead && {
      id: "yongsin",
      kicker: "용신",
      title: "내 보약 기운부터 확인할까요?",
      note: "지금 내게 힘을 보태는 기운이 뭔지 알아야, 나머지도 그 기준으로 읽을 수 있어요.",
      href: "/explore/yongsin",
      label: "먼저 내 용신 보기",
      art: "/hero-art/life-crossroads-v1.png",
    },
    !data.tciAnswersDone && {
      id: "tci",
      kicker: "나의 기질",
      title: "3분이면 내 반응 습관이 나와요",
      note: "35문항이에요. 오래 고민하지 말고 처음 든 생각으로 찍으면 돼요.",
      href: "/explore/temperament",
      label: "기질 검사 시작",
      art: "/brand-icons/temperament-ribbons-ink.png",
    },
    familyCount < 2 && {
      id: "family",
      kicker: "가족 사주",
      title: "한 명만 더 넣으면 관계가 보여요",
      note: "지금은 혼자라 관계를 볼 수 없어요. 가족 한 명만 추가하면 서로 어디서 엇갈리는지 바로 나와요.",
      href: "/explore/family",
      label: "가족 추가하기",
      art: "/brand-icons/family-ink.png",
    },
    data.tciAnswersDone && {
      id: "fusion",
      kicker: "사주 + 기질",
      title: "타고난 결이랑 지금 사는 결, 겹쳐볼까요?",
      note: "재료가 둘 다 모였어요. 어디서 어긋나는지는 겹쳐야만 보여요.",
      href: "/explore/fusion",
      label: "두 개 겹쳐보기",
      art: "/brand-icons/temperament-map-ink.png",
    },
    data.yongsinRead && {
      id: "verify",
      kicker: "용신 검증",
      title: "용신, 진짜 맞는지 맞춰볼까요?",
      note: "몸이 제일 좋았던 해를 최대 3개 고르면, 그때 네 보약 기운이 진짜 들어와 있었는지 대조해줘요.",
      href: "/saju/yongsin-check",
      label: "좋았던 해 골라보기",
      art: "/hero-art/life-crossroads-v1.png",
    },
  ].filter((n): n is Nudge => !!n);

  if (initializing) {
    return <main className="page"><PageLoading label="내 흐름을 준비하고 있어요" /></main>;
  }

  return (
    <div className="page home-page">
      <section className="life-path-hero" aria-labelledby="life-path-title">
        <header className="home-dashboard-bar" aria-label="홈 상단">
          <span className="home-dashboard-brand">sajulife</span>
          <span className="home-dashboard-actions"><PersonSwitcher className="home-dashboard-person" initialStore={data.people} /><Link href="/notifications" className="home-dashboard-history" aria-label="알림 보기"><BrandIcon name="notification" /></Link></span>
        </header>
        <div className="life-path-hero-copy">
          {/* 계절 이름(봄·여름…)은 적지 않는다 — 배경 아트와 테마 색이 이미 말해준다. */}
          <p className="life-path-kicker">
            {seasonIsPersonal ? "지금 지나는 10년 흐름의 계절" : "사주로 읽는 삶의 갈림길"}
          </p>
          <h1 id="life-path-title">
            <span>사주로 나를 읽고,</span>
            <span>다음 선택을 설계해요.</span>
          </h1>
          <p>{heroNote}</p>
          <Link href="/explore/personal" className="life-path-cta">내 사주 분석 시작하기 <span aria-hidden>→</span></Link>
        </div>
        <div className="life-path-stems" aria-hidden>
          <span className="life-path-stem-lines" />
          <span className="life-path-orb" />
          <span className="life-path-orb-character">{centralStem}</span>
          {STEMS.map((stem, index) => <span className="life-path-stem" key={stem} style={{ "--stem-index": index } as CSSProperties}>{stem}</span>)}
        </div>
        <p className="life-path-note">천간은 사주를 이루는 열 개의 기호예요. 개인 결과는 분석 후에만 안내합니다.</p>
      </section>
      <nav className="home-quick" aria-label="바로가기">
        {quickActions.map((item) => (
          <Link key={item.name} href={item.href} className="home-quick-item">
            <BrandIcon name={item.icon} className="home-quick-icon" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <NudgeRail nudges={nudges} />
      <footer className="home-company-footer" aria-label="회사 정보"><div className="home-company-top"><strong>SAJULIFE</strong><span>사주언니 x 기질오빠</span></div><p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p><div className="home-company-links" aria-label="정책 안내">{COMPANY_LINKS.map((item) => <span key={item}>{item}</span>)}</div><address>{COMPANY_INFO.map((item) => <span key={item}>{item}</span>)}</address><small>© 2026 SAJULIFE. All rights reserved.</small></footer>
    </div>
  );
}

/**
 * 추천 배너 레일 — 좌우 스와이프.
 *
 * 제스처를 직접 처리하지 않고 ★네이티브 가로 스크롤 + scroll-snap★에 얹는다.
 * 손으로 만든 스와이프는 관성·바운스·트랙패드·키보드를 전부 다시 만들어야 하고,
 * 그렇게 만든 것치고 OS 기본 스크롤보다 나은 경우가 드물다.
 *
 * ★현재 장은 scroll 이벤트가 아니라 IntersectionObserver로 읽는다★ — scroll 이벤트는
 * 버블링하지 않는 데다 환경에 따라 프로그램적 스크롤에서 누락돼, 점이 스크롤을 못 따라간다.
 * 어느 카드가 실제로 보이는지를 관찰하는 쪽이 원인에 더 가깝고 결과도 정확하다.
 * 점 클릭도 clientWidth 곱셈이 아니라 ★그 카드의 실제 위치★로 스크롤한다(카드 사이 gap 때문).
 */
function NudgeRail({ nudges }: { nudges: Nudge[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // 현재 장을 ★두 경로로★ 읽는다 — 관찰(IntersectionObserver)과 스크롤 위치.
  // 하나로만 두면 그게 안 울리는 환경에서 점이 첫 칸에 붙어버린다. 둘 다 같은 setIndex로
  // 수렴하므로 겹쳐 울려도 결과는 같고, 한쪽이 죽어도 표시가 살아남는다.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.children) as HTMLElement[];
    if (cards.length < 2) return;

    const nearest = () => {
      const x = rail.scrollLeft;
      let best = 0;
      let bestGap = Infinity;
      cards.forEach((card, i) => {
        const gap = Math.abs(card.offsetLeft - rail.offsetLeft - x);
        if (gap < bestGap) { bestGap = gap; best = i; }
      });
      return best;
    };

    const onScroll = () => setIndex(nearest());
    rail.addEventListener("scroll", onScroll, { passive: true });

    const io = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const i = cards.indexOf(entry.target as HTMLElement);
              if (i >= 0) setIndex(i);
            }
          },
          { root: rail, threshold: 0.6 },
        )
      : null;
    cards.forEach((card) => io?.observe(card));

    return () => {
      rail.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, [nudges.length]);

  if (nudges.length === 0) return null;

  // 부드러움은 ★CSS(scroll-behavior)★에 맡기고 여기선 위치만 대입한다.
  // scrollTo({behavior:"smooth"})는 환경에 따라 조용히 무시돼서, 눌러도 안 움직이는 점이 된다.
  // 위치 대입은 어디서든 반드시 도착하고, 애니메이션은 되는 곳에서만 얹힌다.
  const goTo = (i: number) => {
    const rail = railRef.current;
    const card = rail?.children[i] as HTMLElement | undefined;
    if (!rail || !card) return;
    rail.scrollLeft = card.offsetLeft - rail.offsetLeft;
    // 점 상태를 스크롤 이벤트에만 맡기지 않는다 — 프로그램적 이동에서 그 이벤트가 안 오는
    // 환경이 있어서, 눌린 점이 활성화가 안 되면 조작이 먹은 건지 알 수 없다.
    setIndex(i);
  };

  return (
    <section className="home-nudges" aria-label="추천">
      <div className="home-nudge-rail" ref={railRef}>
        {nudges.map((n) => (
          <article className="home-verify home-nudge" key={n.id} aria-labelledby={`nudge-${n.id}`}>
            <img className="home-verify-art" src={n.art} alt="" draggable={false} />
            <div className="home-verify-copy">
              <p className="home-verify-kicker">{n.kicker}</p>
              <h2 id={`nudge-${n.id}`}>{n.title}</h2>
              <p className="home-verify-note">{n.note}</p>
              <Link href={n.href} className="home-verify-cta">{n.label} <span aria-hidden>→</span></Link>
            </div>
          </article>
        ))}
      </div>

      {nudges.length > 1 && (
        <div className="home-nudge-dots" role="tablist" aria-label="배너 넘기기">
          {nudges.map((n, i) => (
            <button
              key={n.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}번째 배너: ${n.kicker}`}
              className={i === index ? "is-active" : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
