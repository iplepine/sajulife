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
import { sharedGet } from "@/lib/net/sharedGet";
import type { PackageInfo } from "@/lib/package/client";
import { nextJourneyStep } from "@/lib/package/journey";
import { formatWon } from "@/lib/package/product";

/**
 * 사주+기질 풀이(대표 상품) 구매 유도 페이지 — 2026-10-08부터 '올해 운세'를 판다.
 * 사주(원래의 나) → 기질 검사(요즘의 나) → 둘을 겹친 올해 운세. 결제하면 사주 풀이부터 열린다.
 *
 * ★이 상품의 정체★ — 사주 앱도 많고 성향검사 앱도 많은데 ★둘을 겹치는 건 우리만 한다★.
 * 그래서 이 화면은 "융합이 뭔지" 설명하는 데 힘을 쓰지 않는다. 대신 ★두 재료를 나란히 놓고★
 * "이게 서로 안 맞으면 어떻게 되는데?"라는 질문이 저절로 떠오르게 만든다 — 그 질문이 상품이다.
 *
 * ★전제조건이 둘★이라 다른 화면보다 CTA 분기가 하나 더 많다(사주 + 기질). 뭐가 없는지를
 * 먼저 정확히 말해주지 않으면 사용자는 막힌 이유를 모른 채 이탈한다.
 */

// 프롬프트 v30·검증기(lib/fusion/reportQuality.ts)의 여덟 섹션과 같은 순서.
const SECTIONS = [
  { name: "먼저 결론", desc: "올해 너는 이런 한 해야" },
  { name: "원래의 너", desc: "사주로 타고난 결" },
  { name: "요즘의 너", desc: "기질 검사로 본 지금 상태" },
  { name: "겹치는 곳과 어긋나는 곳", desc: "원래의 너와 요즘의 너가 만나는 자리" },
  { name: "올해 흐름", desc: "올해가 지금의 너한테 가져오는 것" },
  { name: "올해 남은 달", desc: "밀 때와 쉴 때" },
  { name: "내년 미리보기", desc: "이렇게 바뀔 수 있으니 이걸 준비해" },
  { name: "세 가지 실행", desc: "올해 남은 기간, 이렇게 써" },
] as const;

type Chart = { saju: SajuResult | null; name?: string; currentYear?: number };

export default function FusionIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [scores, setScores] = useState<TciScore[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [rootSeason, setRootSeason] = useState<ThemeSeason | null>(null);

  useEffect(() => {
    const attr = document.documentElement.dataset.seasonTheme;
    if (isThemeSeason(attr)) setRootSeason(attr);
  }, []);

  useEffect(() => {
    let alive = true;
    async function readJson<T>(url: string): Promise<T | null> {
      try {
        const res = await sharedGet(url);
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      }
    }
    void (async () => {
      const [chartRes, tciRes, fusionRes, pkgRes] = await Promise.all([
        readJson<Chart>("/api/saju/chart"),
        readJson<{ scores?: TciScore[]; readiness?: { hasTci?: boolean } }>("/api/tci/report"),
        readJson<{ saved?: unknown }>("/api/fusion/report"),
        readJson<PackageInfo>("/api/package"),
      ]);
      if (!alive) return;
      setPkg(pkgRes);
      setChart(chartRes ?? { saju: null });
      setScores(tciRes?.scores ?? []);
      setHasSaved(!!fusionRes?.saved);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const season = saju ? themeForSaju(saju, currentYear) : (rootSeason ?? calendarTheme());

  // 다음 걸음은 홈과 같은 lib/package/journey.ts가 정한다 — 결제 전이면 결제로, 결제 후엔 빠진 단계로.
  // 상태 조회가 실패하면 결제·생성으로 밀지 않고 결과 화면에서 다시 확인하게 한다.
  const journey = pkg ? nextJourneyStep(pkg.state) : null;
  const cta: ExploreCtaState = !loaded
    ? { href: "/fusion", label: "준비 중…", note: "", pending: true }
    : hasSaved
      ? { href: "/fusion", label: "내 올해 운세 보기", note: "이미 열어둔 풀이야. 다시 보는 건 언제든 가능해.", pending: false }
      : !journey
        ? { href: "/fusion", label: "내 풀이 화면으로", note: "지금 풀이 상태를 못 불러왔어. 결과 화면에서 다시 확인해 줘.", pending: false }
        : journey.key === "buy"
          ? {
              href: journey.href,
              label: journey.label,
              note: `사주 풀이 + 기질 검사 + 올해 운세, 세 단계 모두 ${formatWon(pkg?.product.price ?? 0)}. 사주부터 바로 풀어줄게.`,
              pending: false,
            }
          : { href: journey.href, label: journey.label, note: journey.note, pending: false };

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
        title={<>타고난 나와 요즘의 나,<br />겹쳐서 올해를</>}
        lead="사주는 평생 안 바뀌는 원래의 너고, 기질 검사는 지금의 너야. 둘을 겹쳐야 올해가 정확하게 보여."
        season={season}
        ready={loaded || rootSeason !== null}
        center={saju?.dayMaster.hanja}
        orbit={orbit}
      />

      <ExploreCta cta={cta} />

      <MyMaterials saju={saju} scores={scores} loaded={loaded} name={chart?.name} />

      <HowBlock
        titleId="fi-how-title"
        kicker="사주랑 기질 설문을 왜 굳이 같이 봐?"
        title="따로 보면 안 보이는 게 있어"
        items={[
          { t: "사주는 원래의 너, 기질은 요즘의 너", d: "타고난 결은 평생 그대로지만, 그 결을 요즘 어떻게 쓰고 있는지는 지금 재봐야 알아." },
          { t: "올해 운세는 지금 상태까지 봐야 맞아", d: "같은 해라도 요즘 브레이크를 밟는 중인지, 과열된 중인지에 따라 기회가 되기도 함정이 되기도 해." },
          { t: "내년엔 바람이 바뀌니까", d: "올해·내년 기운과 남은 달 주의는 코드로 계산하고, 요즘의 너에 맞춰 미리 바꿔둘 걸 짚어줄게." },
        ]}
        close="사주만 봐도, 기질만 봐도 올해는 여기까지 안 나와."
      />

      <ExploreOffer
        titleId="fi-offer-title"
        title="겹치면 뭐가 나오냐면"
        lead="원래의 너와 요즘의 너가 맞물리는 곳과 어긋나는 곳을 짚고, 그게 올해 남은 기간과 내년에 어떤 장면으로 오는지 여덟 갈래로 풀어줄게."
        specs={[
          { k: "재료", v: "사주 + 기질 + 올해·내년 흐름" },
          { k: "구성", v: "여덟 갈래" },
          { k: "가격", v: pkg ? `${formatWon(pkg.product.price)} · 사주 풀이 포함` : "사주 풀이 포함" },
        ]}
      >
        <LockedPreview cover={chart?.name ? `${chart.name}의 올해 운세` : "올해 운세"} sections={SECTIONS} />
      </ExploreOffer>
    </main>
  );
}

/**
 * 무료 증거 — ★두 재료를 나란히★ 놓는 게 전부다.
 * 왼쪽은 사주에서 나온 기운 배합, 오른쪽은 설문 응답으로 채점한 일곱 경향. 둘 다 이미 계산된 진짜 값이고,
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
            <p className="pi-ys-none">{loaded ? "아직 없어. 3분짜리 설문 하나면 채워져." : "불러오는 중…"}</p>
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
