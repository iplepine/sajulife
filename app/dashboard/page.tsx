"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import BrandIcon, { type BrandIconName } from "@/components/BrandIcon";
import PersonSwitcher from "@/components/PersonSwitcher";
import TicketBadge from "@/components/TicketBadge";
import type { SajuProfile } from "@/lib/store/types";
import type { SajuResult } from "@/lib/saju/calculator";
import { seasonOfBranch, type Season as SeasonKo } from "@/lib/saju/seasonClock";
import { SEASON_ART, SEASON_FALLBACK_STEM } from "@/lib/saju/seasonArt";

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
};
const EMPTY_HOME_DATA: HomeData = {
  profile: null,
  tciAnswersDone: false,
  yongsinRead: false,
  saju: null,
  currentYear: new Date().getFullYear(),
};

/** 퀵액션 — 하단 탭(홈·기록·용신상담·가족·마이)과 달리 '무엇을 볼지' 주제로 들어가는 입구. */
type QuickAction = { icon: BrandIconName; name: string; href: string };

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
  const [profileResolved, setProfileResolved] = useState(false);

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
      // 용신 검증 카드는 '용신 풀이를 이미 봤는지'에 따라, 홈 테마는 '선택한 인물의 지금 계절'에 따라 갈린다.
      const [tciRes, yongsinRes, chartRes] = await Promise.all([
        readJson<{ tci?: unknown }>("/api/tci/answers"),
        readJson<{ saved?: unknown }>("/api/saju/yongsin"),
        readJson<{ saju?: SajuResult; currentYear?: number }>("/api/saju/chart"),
      ]);
      if (!cancelled) {
        setData({
          profile,
          tciAnswersDone: !!tciRes?.tci,
          yongsinRead: !!yongsinRes?.saved,
          saju: chartRes?.saju ?? null,
          currentYear: chartRes?.currentYear ?? new Date().getFullYear(),
        });
        setProfileResolved(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const hasProfile = !!data.profile;
  const { season, personal: seasonIsPersonal } = seasonForPerson(data.saju, data.currentYear);
  const art = SEASON_ART[season.key];
  // 중앙 구슬은 활성 인물의 일간. 사주 정보가 아직 없을 때만 계절 기본 글자로 안전하게 보여준다.
  const centralStem = data.saju?.dayMaster.hanja ?? SEASON_FALLBACK_STEM[season.key];
  const heroNote = hasProfile && profileResolved
    ? "저장한 리포트를 바탕으로 다음 선택을 함께 정리해요."
    : "사주를 바탕으로 지금의 고민과 다음 선택을 연결해요.";

  const quickActions: QuickAction[] = [
    { icon: "reading-saju", name: "개인 사주", href: "/explore/personal" },
    { icon: "consult", name: "용신 상담", href: "/consult" },
    { icon: "reading-family", name: "가족 사주", href: "/explore/family" },
    { icon: "reading-tci", name: data.tciAnswersDone ? "나의 기질" : "기질 검사", href: "/explore/temperament" },
  ];

  // 용신 검증 — 용신을 아직 안 봤으면 리포트로 먼저 유도하고, 본 뒤에야 연도 고르기로 보낸다.
  const verify = data.yongsinRead
    ? { href: "/saju/yongsin-check", label: "좋았던 해 골라보기", note: "몸이 제일 좋았던 해를 최대 3개 고르면, 그때 네 보약 기운이 진짜 들어와 있었는지 대조해줘요." }
    : { href: "/saju/yongsin", label: "먼저 내 용신 보기", note: "내 보약 기운이 뭔지 먼저 확인하면, 좋았던 해와 맞춰보는 검증을 할 수 있어요." };

  return (
    <div className={`page home-page home-page--${season.key}`}>
      <section className={`life-path-hero life-path-hero--${season.key}`} aria-labelledby="life-path-title">
        <img className="life-path-hero-art" src={art.wide} alt="" draggable={false} />
        <header className="home-dashboard-bar" aria-label="홈 상단">
          <span className="home-dashboard-brand">sajulife</span>
          <span className="home-dashboard-actions"><TicketBadge className="home-dashboard-ticket" /><PersonSwitcher className="home-dashboard-person" /><Link href="/notifications" className="home-dashboard-history" aria-label="알림 보기"><BrandIcon name="notification" /></Link></span>
        </header>
        <div className="life-path-hero-copy">
          {/* 계절 이름(봄·여름…)은 적지 않는다 — 배경 아트와 테마 색이 이미 말해준다. */}
          <p className="life-path-kicker">
            {seasonIsPersonal ? "지금 지나는 10년 흐름의 계절" : "사주로 읽는 삶의 갈림길"}
          </p>
          <h1 id="life-path-title">사주로 나를 읽고,<br />다음 선택을 설계해요.</h1>
          <p>{heroNote}</p>
          <Link href="/explore/personal" className="life-path-cta">내 사주 분석 시작하기 <span aria-hidden>→</span></Link>
        </div>
        <div className="life-path-stems" aria-hidden>
          <img className="life-path-stem-lines" src={art.constellation} alt="" draggable={false} />
          <img className="life-path-orb" src={art.orb} alt="" draggable={false} />
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

      <section className="home-verify" aria-labelledby="home-verify-title">
        <img className="home-verify-art" src="/hero-art/life-crossroads-v1.png" alt="" draggable={false} />
        <div className="home-verify-copy">
          <p className="home-verify-kicker">용신 검증</p>
          <h2 id="home-verify-title">용신, 진짜 맞는지 맞춰볼까요?</h2>
          <p className="home-verify-note">{verify.note}</p>
          <Link href={verify.href} className="home-verify-cta">{verify.label} <span aria-hidden>→</span></Link>
        </div>
      </section>
      <footer className="home-company-footer" aria-label="회사 정보"><div className="home-company-top"><strong>SAJULIFE</strong><span>사주언니 x 기질오빠</span></div><p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p><div className="home-company-links" aria-label="정책 안내">{COMPANY_LINKS.map((item) => <span key={item}>{item}</span>)}</div><address>{COMPANY_INFO.map((item) => <span key={item}>{item}</span>)}</address><small>© 2026 SAJULIFE. All rights reserved.</small></footer>
    </div>
  );
}
