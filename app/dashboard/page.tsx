"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import BrandIcon from "@/components/BrandIcon";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { SajuProfile } from "@/lib/store/types";
import type { PeopleStore } from "@/lib/people/client";
import type { SajuResult } from "@/lib/saju/calculator";
import { seasonOfBranch, type Season as SeasonKo } from "@/lib/saju/seasonClock";
import { sharedGet } from "@/lib/net/sharedGet";
import type { PackageInfo } from "@/lib/package/client";
import { nextJourneyStep, type JourneyStep } from "@/lib/package/journey";
import { formatWon, PACKAGE_STEPS } from "@/lib/package/product";

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
  profile: SajuProfile | null;
  tciAnswersDone: boolean;
  yongsinRead: boolean;
  /** 홈 테마 계절을 선택한 인물 기준으로 잡기 위한 만세력. */
  saju: SajuResult | null;
  currentYear: number;
  people: PeopleStore | null;
  /** 궁합 상대가 한 명이라도 등록돼 있는지 — 추천 배너를 띄울지 결정한다. */
  hasCompatPartner: boolean;
  /**
   * 현재 인물에게 등록된 ★가족 구성원 수★(조회 실패면 null).
   * ★계정 인물 수(/api/people)와 다른 데이터다.★ 예전엔 인물 수로 가족 배너를 판단해서,
   * 가족을 등록해도 "지금은 혼자라 관계를 볼 수 없어요"가 계속 떴다.
   */
  familyMemberCount: number | null;
  /**
   * 개인 풀이의 ★저장 여부★와 ★생성 상태★.
   * ★프로필 있음 ≠ 풀이 있음★ — 예전엔 profile만 보고 "저장한 리포트" 문구를 골라서,
   * 정보만 넣고 아직 안 만든 사람에게 "저장한 리포트를 바탕으로"라고 말했다.
   */
  personalSaved: boolean;
  personalStatus: "idle" | "generating" | "error";
  /** 개인 풀이 조회 자체가 실패 — ★"저장본 없음"으로 단정하지 않기 위해★ 따로 둔다. */
  personalLoadFailed: boolean;
  /**
   * 프로필 조회 자체가 실패 — ★"사주 정보 없음"과 다른 상태★다.
   * 이 조회는 4초 타임아웃이 걸려 있어 서버가 느리면 중단된다. 그때 '입력하세요'로 보내면
   * 이미 정보를 넣은 사람에게 다시 입력을 시키게 된다.
   */
  profileLoadFailed: boolean;
  /**
   * 사주+기질 풀이 진행 상태 — 홈의 큰 버튼은 이 값 하나로 다음 걸음을 정한다(lib/package/journey.ts).
   * 조회 실패면 null + packageLoadFailed — ★'아직 결제 안 함'으로 단정해 결제로 밀지 않는다.★
   */
  pkg: PackageInfo | null;
  packageLoadFailed: boolean;
};
const EMPTY_HOME_DATA: HomeData = {
  profile: null,
  tciAnswersDone: false,
  yongsinRead: false,
  saju: null,
  currentYear: new Date().getFullYear(),
  people: null,
  hasCompatPartner: false,
  familyMemberCount: null,
  personalSaved: false,
  personalStatus: "idle",
  personalLoadFailed: false,
  profileLoadFailed: false,
  pkg: null,
  packageLoadFailed: false,
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


export default function DashboardPage() {
  const [data, setData] = useState<HomeData>(EMPTY_HOME_DATA);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // 조회 실패와 "데이터 없음"을 ★같은 값으로 뭉치지 않는다★ — 뭉치면 서버 오류가
    // "아직 안 만들었네요"로 둔갑해 사용자를 새 생성으로 밀어버린다.
    async function readJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false }> {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      try {
        const response = await sharedGet(url, { signal: controller.signal });
        if (!response.ok) return { ok: false };
        return { ok: true, data: (await response.json()) as T };
      } catch {
        return { ok: false };
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void (async () => {
      // 홈 첫 화면에 필요한 상태를 한 번에 읽는다. 프로필 후에 다시 요청하면 진행 표시가
      // 두 번 뜨고, 기본 문구가 실제 인물 문구로 한 번 더 바뀌는 원인이 된다.
      // ★개인 풀이 저장 여부도 이 묶음에서 함께 읽는다★ — 나중에 따로 읽으면 버튼이 한 번 더 바뀐다.
      const [profileRes, tciRes, yongsinRes, chartRes, peopleRes, compatRes, personalRes, familyRes, packageRes] = await Promise.all([
        readJson<{ profile?: SajuProfile }>("/api/profile"),
        readJson<{ tci?: unknown }>("/api/tci/answers"),
        readJson<{ saved?: unknown }>("/api/saju/yongsin"),
        readJson<{ saju?: SajuResult; currentYear?: number }>("/api/saju/chart"),
        readJson<PeopleStore>("/api/people"),
        readJson<{ compat?: { partners?: unknown[] } }>("/api/compat"),
        // GET은 조회만 한다(생성 POST 아님) — 홈을 여는 것만으로 비용이 발생하지 않는다.
        readJson<{ saved?: unknown; status?: "idle" | "generating" | "error" }>("/api/saju/personal"),
        readJson<{ family?: { members?: unknown[] } }>("/api/family"),
        // 사주+기질 풀이 진행 상태(조회만) — 홈의 메인 버튼이 이걸 본다.
        readJson<PackageInfo>("/api/package"),
      ]);
      if (cancelled) return;
      const people = peopleRes.ok ? peopleRes.data : null;
      const personalSaved = personalRes.ok && !!personalRes.data.saved;
      const personalStatus = personalRes.ok ? (personalRes.data.status ?? "idle") : "idle";
      const profile = profileRes.ok ? (profileRes.data.profile ?? null) : null;
      const pkg = packageRes.ok ? packageRes.data : null;
      if (!profile) {
        setData({
          ...EMPTY_HOME_DATA,
          pkg,
          packageLoadFailed: !packageRes.ok,
          people,
          personalLoadFailed: !personalRes.ok,
          profileLoadFailed: !profileRes.ok,
          familyMemberCount: familyRes.ok ? (familyRes.data.family?.members ?? []).length : null,
        });
        setInitializing(false);
        return;
      }
      setData({
        profile,
        tciAnswersDone: tciRes.ok && !!tciRes.data.tci,
        yongsinRead: yongsinRes.ok && !!yongsinRes.data.saved,
        saju: chartRes.ok ? (chartRes.data.saju ?? null) : null,
        currentYear: (chartRes.ok ? chartRes.data.currentYear : undefined) ?? new Date().getFullYear(),
        people,
        hasCompatPartner: compatRes.ok && (compatRes.data.compat?.partners ?? []).length > 0,
        familyMemberCount: familyRes.ok ? (familyRes.data.family?.members ?? []).length : null,
        personalSaved,
        personalStatus,
        personalLoadFailed: !personalRes.ok,
        profileLoadFailed: false,
        pkg,
        packageLoadFailed: !packageRes.ok,
      });
      setInitializing(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const { personal: seasonIsPersonal } = seasonForPerson(data.saju, data.currentYear);
  /**
   * 홈의 큰 버튼 — ★사주+기질 풀이가 메인★(2026-10-08 대표 결정).
   * 결제 → 사주 정보 → 사주 풀이 → 기질 검사 → 올해 운세 순서를 lib/package/journey.ts가 정한다.
   * 조회 실패는 '아직 안 함'과 다른 상태다 — 실패를 결제·새 입력으로 밀지 않고 다시 불러오게만 한다.
   */
  const journey: JourneyStep | null = data.pkg ? nextJourneyStep(data.pkg.state) : null;
  const heroCta: { note: string; href: string; label: string } = data.profileLoadFailed
    ? {
        note: "지금 내 정보를 불러오지 못했어요. 이미 입력해둔 게 있는지 아직 알 수 없어서, 새로 입력하라고 하진 않을게요.",
        href: "/dashboard",
        label: "다시 불러오기",
      }
    : data.packageLoadFailed || !journey
      ? {
          note: "지금 풀이 상태를 불러오지 못했어요. 결제나 저장본이 있는지는 아직 알 수 없어요.",
          href: "/dashboard",
          label: "다시 불러오기",
        }
      : { note: journey.note, href: journey.href, label: journey.label };


  if (initializing) {
    return <main className="page"><PageLoading label="내 흐름을 준비하고 있어요" /></main>;
  }

  return (
    <div className="page home-page">
      <section className="life-path-hero home-fusion-hero" aria-labelledby="life-path-title">
        <header className="home-dashboard-bar" aria-label="홈 상단">
          <span className="home-dashboard-brand">sajulife</span>
          <span className="home-dashboard-actions"><PersonSwitcher className="home-dashboard-person" initialStore={data.people} /><Link href="/notifications" className="home-dashboard-history" aria-label="알림 보기"><BrandIcon name="notification" /></Link></span>
        </header>
        <h1 id="life-path-title" className="home-fusion-title">사주 + 기질 통합 풀이</h1>
        <div className="home-fusion-stage" aria-label="사주와 기질을 겹쳐 읽는 나">
          <Image className="home-fusion-lenses" src="/hero-art/fusion-lenses.svg" width={1480} height={1320} unoptimized alt="" aria-hidden />
          <figure className="home-fusion-saju">
            <Image src="/hero-art/fusion-saju.svg" width={120} height={120} unoptimized alt="년월일시의 여덟 자리를 표현한 상징용 명식. 실제 개인 결과가 아닙니다." />
            <figcaption>사주</figcaption>
          </figure>
          <span className="home-fusion-self">나</span>
          <figure className="home-fusion-temperament">
            <Image src="/hero-art/fusion-temperament.svg" width={120} height={120} unoptimized alt="추진성, 안정성, 공감성, 지속성의 네 기질 축을 표현한 상징" />
            <figcaption>기질</figcaption>
          </figure>
        </div>
        <div className="home-fusion-action">
          <Link href={heroCta.href} className="home-fusion-cta">{journey?.key === "buy" && !data.profileLoadFailed && !data.packageLoadFailed ? "사주와 기질, 한 번에 보기" : heroCta.label} <span aria-hidden>→</span></Link>
          <p>{heroCta.note}</p>
        </div>
        {seasonIsPersonal && <p className="home-fusion-season-note">지금 지나는 10년 흐름의 계절을 배경에 담았어요.</p>}
      </section>
      {/* 진행 단계는 히어로 밖 — 히어로 안에 두면 큰 버튼이 위로 밀려 가운데 구슬과 겹친다. */}
      {journey && <PackageSteps journey={journey} price={data.pkg?.product.price} free={data.pkg?.payment === "free"} />}
      <section className="home-other" aria-labelledby="home-other-title">
        <div className="home-other-heading"><h2 id="home-other-title">다른 궁금함도 있다면</h2><p>필요한 만큼 더 둘러보세요</p></div>
        <nav className="home-other-links" aria-label="다른 풀이 둘러보기">
          {[
            { title: "가족 사주", note: "우리 사이의 다른 결", href: "/explore/family" },
            { title: "궁합", note: "두 사람이 만나는 자리", href: "/explore/compat" },
            { title: "용신 풀이", note: "내게 힘을 더하는 기운", href: "/explore/yongsin" },
            { title: "고민 상담", note: "지금의 선택을 함께 정리", href: "/explore/consult" },
          ].map((item) => <Link key={item.href} href={item.href} className="home-other-link"><span><strong>{item.title}</strong><small>{item.note}</small></span><span aria-hidden>↗</span></Link>)}
        </nav>
      </section>
      <footer className="home-company-footer" aria-label="회사 정보"><div className="home-company-top"><strong>SAJULIFE</strong><span>사주언니 x 기질오빠</span></div><p>본 서비스는 자기 이해와 선택 정리를 위한 참고 자료이며, 의료·법률·금융 상담을 대체하지 않습니다.</p><div className="home-company-links" aria-label="정책 안내">{COMPANY_LINKS.map((item) => item.href.startsWith("mailto:") ? <a key={item.label} href={item.href}>{item.label}</a> : <Link key={item.label} href={item.href}>{item.label}</Link>)}</div><address>{COMPANY_INFO.map((item) => <span key={item}>{item}</span>)}</address><small>© 2026 SAJULIFE. All rights reserved.</small></footer>
    </div>
  );
}

/**
 * 사주+기질 풀이 세 단계 — 지금 어디까지 왔는지만 보여준다(누르는 곳은 위 큰 버튼 하나).
 * 결제 전에는 무엇이 들어 있는지와 가격을 함께 보여준다.
 */
function PackageSteps({ journey, price, free }: { journey: JourneyStep; price?: number; free?: boolean }) {
  const stateOf = (step: number): "done" | "now" | "todo" => {
    if (journey.key === "done") return "done";
    if (journey.stage === 0) return "todo";
    if (step < journey.stage) return "done";
    return step === journey.stage ? "now" : "todo";
  };
  const label = { done: "완료", now: "지금", todo: "" } as const;
  // ★이미 받은 풀이로 돌아가는 길★ — 큰 버튼은 늘 '다음 단계'를 가리켜서, 사주를 이미 본 사람은
  // 홈에서 자기 사주로 돌아갈 입구가 없었다. 끝난 단계 줄을 눌러 다시 보게 한다(기질 검사는 볼 화면이 따로 없어 제외).
  const revisitHref: Partial<Record<number, string>> = { 1: "/saju", 3: "/fusion" };
  return (
    <div className="home-package">
      <ol className="home-package-steps" aria-label="사주+기질 풀이 진행">
        {PACKAGE_STEPS.map((s) => {
          const st = stateOf(s.step);
          const href = st === "done" ? revisitHref[s.step] : undefined;
          const content = (
            <>
              <span className="home-package-no" aria-hidden>{st === "done" ? "✓" : s.step}</span>
              <span className="home-package-title">{s.title}</span>
              {href ? (
                <span className="home-package-state">다시 보기 <span aria-hidden>→</span></span>
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
      {journey.stage === 0 && price != null && (
        <p className="home-package-price">
          {free ? `세 단계 모두 베타 기간 무료 (정가 ${formatWon(price)})` : `세 단계 모두 ${formatWon(price)}`}
        </p>
      )}
    </div>
  );
}
