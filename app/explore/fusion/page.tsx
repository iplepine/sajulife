"use client";

import { useEffect, useState } from "react";
import PersonSwitcher from "@/components/PersonSwitcher";
import TciRadar, { type RadarAxis } from "@/components/TciRadar";
import { WuxingDist } from "@/components/report/PersonalReportBody";
import {
  ExploreCta, ExploreHero, ExploreOffer, HowBlock, LockedPreview,
  type ExploreCtaState,
} from "@/components/explore/parts";
import { calendarTheme, isThemeSeason, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";

/**
 * 사주 × 기질 융합 구매 유도 페이지.
 *
 * ★이 상품의 정체★ — 사주 앱도 많고 성향검사 앱도 많은데 ★둘을 겹치는 건 우리만 한다★.
 * 그래서 이 화면은 "융합이 뭔지" 설명하는 데 힘을 쓰지 않는다. 대신 ★두 재료를 나란히 놓고★
 * "이게 서로 안 맞으면 어떻게 되는데?"라는 질문이 저절로 떠오르게 만든다 — 그 질문이 상품이다.
 *
 * ★전제조건이 둘★이라 다른 화면보다 CTA 분기가 하나 더 많다(사주 + 기질). 뭐가 없는지를
 * 먼저 정확히 말해주지 않으면 사용자는 막힌 이유를 모른 채 이탈한다.
 */

const SECTIONS = [
  { name: "먼저 결론", desc: "네 반복 패턴 한눈에" },
  { name: "타고난 결과 길러진 결", desc: "사주와 기질이 겹치는 곳, 그리고 어긋나는 곳" },
  { name: "잘 풀릴 때", desc: "네 리듬이 탄력받는 순간" },
  { name: "꼬일 때", desc: "평소 반응이 엇나가는 순간" },
  { name: "자꾸 반복되는 장면", desc: "일·돈·관계에서 같은 패턴이 도는 이유" },
  { name: "숨은 강점과 사각지대", desc: "둘을 겹쳐야만 보이는 것" },
  { name: "갈림길 사용법", desc: "밀어붙일 때와 멈춰야 할 때" },
  { name: "앞으로 6~12개월", desc: "기회와 삐끗할 지점 미리보기" },
  { name: "오늘부터 바꿀 세 가지", desc: "당장 손댈 것" },
] as const;

type Chart = { saju: SajuResult | null; name?: string; currentYear?: number };

export default function FusionIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [scores, setScores] = useState<TciScore[]>([]);
  const [hasTci, setHasTci] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rootSeason, setRootSeason] = useState<ThemeSeason | null>(null);

  useEffect(() => {
    const attr = document.documentElement.dataset.seasonTheme;
    if (isThemeSeason(attr)) setRootSeason(attr);
  }, []);

  useEffect(() => {
    let alive = true;
    async function readJson<T>(url: string): Promise<T | null> {
      try {
        const res = await fetch(url, { cache: "no-store" });
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      }
    }
    void (async () => {
      const [chartRes, tciRes, fusionRes] = await Promise.all([
        readJson<Chart>("/api/saju/chart"),
        readJson<{ scores?: TciScore[]; readiness?: { hasTci?: boolean } }>("/api/tci/report"),
        readJson<{ saved?: unknown }>("/api/fusion/report"),
      ]);
      if (!alive) return;
      setChart(chartRes ?? { saju: null });
      setScores(tciRes?.scores ?? []);
      setHasTci((tciRes?.scores?.length ?? 0) > 0 || !!tciRes?.readiness?.hasTci);
      setHasSaved(!!fusionRes?.saved);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const season = saju ? themeForSaju(saju, currentYear) : (rootSeason ?? calendarTheme());

  // 전제조건이 둘 — 뭐가 빠졌는지 CTA가 직접 말한다. "먼저 검사" 같은 모호한 안내로 넘기지 않는다.
  const cta: ExploreCtaState = !loaded
    ? { href: "/fusion", label: "준비 중…", note: "", pending: true }
    : !saju
      ? {
          href: `/onboarding?next=${encodeURIComponent("/explore/fusion")}`,
          label: "먼저 생년월일 넣기",
          note: "겹치려면 두 개가 필요해. 사주부터 — 생년월일이랑 태어난 시각만 있으면 돼.",
          pending: false,
        }
      : !hasTci
        ? { href: "/tci", label: "기질 검사 3분", note: "사주는 이미 있어. 기질만 재면 바로 겹칠 수 있어.", pending: false }
        : hasSaved
          ? { href: "/fusion", label: "내 융합 풀이 보기", note: "이미 열어둔 풀이야. 다시 보는 건 언제든 가능해.", pending: false }
          : { href: "/fusion", label: "두 개 겹쳐보기", note: "재료 두 개 다 모였어. 바로 겹칠 수 있어.", pending: false };

  const orbit = saju
    ? [
        saju.pillars.year.gan.hanja, saju.pillars.year.zhi.hanja,
        saju.pillars.month.gan.hanja, saju.pillars.month.zhi.hanja,
        saju.pillars.day.zhi.hanja,
        ...(saju.pillars.time ? [saju.pillars.time.gan.hanja, saju.pillars.time.zhi.hanja] : []),
      ]
    : undefined;

  return (
    <main className="page intro-page pi-page">
      <ExploreHero
        titleId="fi-title"
        eyebrow="사주 + 기질"
        title={<>타고난 결이랑<br />지금 사는 결이 다를 때</>}
        lead="사주는 타고난 판이고 기질은 지금 반응하는 습관이야. 이 둘이 어긋나면 아무리 애써도 헛돌아."
        season={season}
        ready={loaded || rootSeason !== null}
        center={saju?.dayMaster.hanja}
        orbit={orbit}
      />

      <ExploreCta cta={cta} />

      <MyMaterials saju={saju} scores={scores} loaded={loaded} name={chart?.name} />

      <HowBlock
        titleId="fi-how-title"
        kicker="사주랑 성격검사를 왜 굳이 같이 봐?"
        title="따로 보면 안 보이는 게 있어"
        items={[
          { t: "사주는 판, 기질은 습관", d: "타고난 판이 넓은데 습관이 좁으면 계속 답답하고, 반대면 계속 무리해." },
          { t: "어긋나는 지점이 제일 아파", d: "네가 매번 걸리는 자리는 보통 이 둘이 서로 다른 소리를 내는 곳이야." },
          { t: "부족한 기운이 어느 결을 눌렀는지", d: "사주에 빈 기운이 기질 여덟 축 중 어디를 움푹 눌렀는지까지 겹쳐서 봐." },
        ]}
        close="사주만 봐도, 기질만 재도 여기까진 안 나와."
      />

      <ExploreOffer
        titleId="fi-offer-title"
        title="겹치면 뭐가 나오냐면"
        lead="둘이 맞물리는 지점과 어긋나는 지점을 짚고, 그게 네 일·돈·관계에서 어떤 장면으로 반복되는지 아홉 갈래로 풀어줄게."
        specs={[
          { k: "재료", v: "사주 + 기질 8축" },
          { k: "구성", v: "아홉 갈래" },
          { k: "다시보기", v: "언제든 무료" },
        ]}
      >
        <LockedPreview cover={chart?.name ? `${chart.name}의 융합 풀이` : "융합 풀이"} sections={SECTIONS} />
      </ExploreOffer>
    </main>
  );
}

/**
 * 무료 증거 — ★두 재료를 나란히★ 놓는 게 전부다.
 * 왼쪽은 사주에서 나온 기운 배합, 오른쪽은 검사에서 나온 여덟 축. 둘 다 이미 계산된 진짜 값이고,
 * 나란히 놓는 순간 "이 둘이 서로 안 맞으면?"이라는 질문이 저절로 생긴다 — 그게 이 상품이다.
 * 한쪽이 비어 있으면 비었다고 정직하게 말한다. 빈자리가 곧 다음 행동 안내가 된다.
 */
function MyMaterials({ saju, scores, loaded, name }: { saju: SajuResult | null; scores: TciScore[]; loaded: boolean; name?: string }) {
  const axes: RadarAxis[] = scores.map((s) => ({ key: s.dimension, label: s.label, percent: s.percent }));

  return (
    <section className="pi-mine" aria-label="겹칠 재료 두 가지">
      <div className="pi-basis-head">
        <p className="h-sec">겹칠 재료 두 개</p>
        <PersonSwitcher nameOnly triggerLabel="변경" className="pi-basis-change" />
      </div>

      <div className="pi-pair">
        <article className="pi-pair-half">
          <p className="pi-pair-k">타고난 판 · 사주</p>
          {saju ? (
            <WuxingDist saju={saju} />
          ) : (
            <p className="pi-ys-none">{loaded ? "아직 없어. 생년월일만 넣으면 바로 나와." : "불러오는 중…"}</p>
          )}
        </article>

        <article className="pi-pair-half">
          <p className="pi-pair-k">지금 반응하는 결 · 기질</p>
          {axes.length > 0 ? (
            <TciRadar axes={axes} />
          ) : (
            <p className="pi-ys-none">{loaded ? "아직 없어. 3분짜리 검사 하나면 채워져." : "불러오는 중…"}</p>
          )}
        </article>
      </div>

      <p className="pi-note pi-note--foot">
        {saju && axes.length > 0
          ? `${name ? `${name} ` : ""}재료는 둘 다 모였어. 이제 겹쳐서 어디가 어긋나는지 보면 돼.`
          : "둘이 다 있어야 겹칠 수 있어. 비어 있는 쪽부터 채우자."}
      </p>
    </section>
  );
}
