"use client";

import { useEffect, useState, type CSSProperties } from "react";
import PersonSwitcher from "@/components/PersonSwitcher";
import { DataSummary, ElementOrb } from "@/components/report/PersonalReportBody";
import {
  ExploreCta, ExploreEmpty, ExploreHero, ExploreOffer, HowBlock, LockedPreview,
  type ExploreCtaState,
} from "@/components/explore/parts";
import { buildYongsinView, ELEMENT_META, type Element, type YongsinView } from "@/lib/saju/yongsinView";
import { calendarTheme, isThemeSeason, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";
import type { SajuResult } from "@/lib/saju/calculator";

/**
 * 용신 풀이 구매 유도 페이지.
 *
 * ★이 화면의 무기★ — 용신은 AI가 아니라 코드가 계산한다(격국·억부·조후 3방법 교차).
 * 그래서 "네 보약 기운이 뭔지"는 여기서 ★공짜로 답까지 다 보여준다★. 감추는 건 답이 아니라
 * ★언제·어디에·누구와 쓰는지★ — 대운·세운을 겹친 실행 설계다.
 * 답을 숨기고 파는 게 아니라 답을 주고 실행을 파는 구조라, 다섯 화면 중 신뢰 마찰이 가장 낮다.
 */

const SECTIONS = [
  { name: "한 줄로 말하면", desc: "네 보약 기운이 뭐고, 지금이 그걸 타는 때인지 준비하는 때인지" },
  { name: "네 세 가지 용신", desc: "격국·억부·조후가 각각 뭘 약으로 보는지, 몇 개가 겹치는지" },
  { name: "그 기운이 들어올 때", desc: "보약 기운마다 몇 살·몇 년에 들어오는지, 그때 뭐가 풀리는지" },
  { name: "지금 대운에 맞춘 실행 설계", desc: "기다릴 게 아니라 지금 끌어다 쓰는 법 — 사람·공간·습관까지" },
  { name: "힘 빼고 정리할 시기", desc: "과부하 기운이 들어오는 역풍 구간, 벌이지 말고 수비할 때" },
  { name: "마음에 둘 한 줄", desc: "순풍일 땐 남기고 준비기엔 쌓는 감각" },
] as const;

type Chart = { saju: SajuResult | null; name?: string; gender?: string; occupation?: string; currentAge?: number; currentYear?: number };

export default function YongsinIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
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
        const res = await fetch(url);
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      }
    }
    void (async () => {
      const [chartRes, savedRes] = await Promise.all([
        readJson<Chart>("/api/saju/chart"),
        readJson<{ saved?: unknown }>("/api/saju/yongsin"),
      ]);
      if (!alive) return;
      setChart(chartRes ?? { saju: null });
      setHasSaved(!!savedRes?.saved);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const season = saju ? themeForSaju(saju, currentYear) : (rootSeason ?? calendarTheme());
  const view = saju ? buildYongsinView(saju, chart?.currentAge, currentYear) : null;

  const cta: ExploreCtaState = !loaded
    ? { href: "/saju/yongsin", label: "준비 중…", note: "", pending: true }
    : !saju
      ? {
          href: `/onboarding?next=${encodeURIComponent("/explore/yongsin")}`,
          label: "생년월일 넣기",
          note: "생년월일이랑 태어난 시각만 있으면 네 보약 기운은 바로 나와. 공짜야.",
          pending: false,
        }
      : hasSaved
        ? { href: "/saju/yongsin", label: "내 용신 풀이 보기", note: "이미 열어둔 풀이야. 다시 보는 건 언제든 가능해.", pending: false }
        : { href: "/saju/yongsin", label: "무료로 용신 풀이 시작", note: "베타 기간에는 용신 풀이도 무료로 열어둘게.", pending: false };

  const orbit = saju
    ? [
        saju.pillars.year.gan.hanja, saju.pillars.year.zhi.hanja,
        saju.pillars.month.gan.hanja, saju.pillars.month.zhi.hanja,
        saju.pillars.day.zhi.hanja,
        ...(saju.pillars.time ? [saju.pillars.time.gan.hanja, saju.pillars.time.zhi.hanja] : []),
      ]
    : undefined;

  const lead = view ? oneLine(view) : null;

  return (
    <main className="page intro-page pi-page">
      <ExploreHero
        titleId="yi-title"
        eyebrow="용신 풀이"
        title={<>애써도 안 되는 쪽이<br />따로 있어</>}
        lead="너한테 약이 되는 기운은 이미 계산돼 있어. 문제는 그걸 언제 어디에 쓰냐는 거야."
        season={season}
        ready={saju !== null || rootSeason !== null}
        center={saju?.dayMaster.hanja}
        orbit={orbit}
      />

      <ExploreCta cta={cta} />

      {view && saju ? <MyYongsin view={view} saju={saju} chart={chart} /> : <ExploreEmpty loaded={loaded}>
        생년월일이랑 태어난 시각만 넣으면 격국·억부·조후 세 가지로 네 보약 기운을 바로 뽑아줄게.
      </ExploreEmpty>}

      <HowBlock
        titleId="yi-how-title"
        kicker="용신은 사람마다 다르게 말하던데?"
        title="그래서 하나로 안 봐"
        items={[
          { t: "세 방법을 각각 돌려", d: "격국·억부·조후. 유파마다 답이 갈리는 게 이 바닥의 진짜 문제야." },
          { t: "겹치는 것만 '확실'로 써", d: "둘 이상이 같은 기운을 가리킬 때만 보약으로 못 박아. 하나만 꼽으면 보조로 낮춰." },
          { t: "여기까진 계산이라 공짜", d: "위에 네 결과 이미 다 나와 있잖아. 파는 건 답이 아니라 쓰는 법이야." },
        ]}
        close="답은 위에 있어. 그걸 몇 살에 어디에 쓸지가 아래에 있고."
      />

      <ExploreOffer
        titleId="yi-offer-title"
        title="그래서 언제 쓰냐면"
        lead="대운·세운을 겹쳐서 그 기운이 몇 살에 들어오는지, 안 들어오는 동안은 뭘로 끌어다 쓸지 짚어줄게."
        specs={[
          { k: "구성", v: "여섯 갈래" },
          { k: "시기", v: "10년 흐름 + 앞 10년" },
          { k: "다시보기", v: "언제든 무료" },
        ]}
      >
        <LockedPreview
          cover={chart?.name ? `${chart.name}의 용신 풀이` : "용신 풀이"}
          sections={SECTIONS}
          openLead={lead?.lead}
          openBody={lead?.body}
        />
      </ExploreOffer>
    </main>
  );
}

/**
 * 미리보기 첫 섹션에 넣을 문장 — ★계산값 그대로★다. 가짜 풀이를 지어내지 않는다.
 * 리포트의 「한 줄로 말하면」이 실제로 답하는 것(뭐가 약이냐 / 지금이 그 때냐)만 사실로 적는다.
 */
function oneLine(view: YongsinView): { lead: string; body: string } {
  const names = (els: Element[]) => els.map((el) => `${ELEMENT_META[el].label} 기운`).join("·");
  const yong = view.primaryYong.length ? view.primaryYong : view.helperYong;
  const now = view.flow.find((c) => c.isNow && c.kind === "대운");
  const riding = now ? yong.includes(now.element) || yong.includes(now.branchElement) : false;

  return {
    lead: yong.length
      ? `${names(yong)}이 너한테 약이야.`
      : "한쪽으로 안 쏠린 균형형이라 특정 기운 하나로 단정하지 않아.",
    body: yong.length
      ? riding
        ? "지금 지나는 10년 흐름에 그 기운이 이미 들어와 있어 — 기다릴 때가 아니라 쓸 때야."
        : "지금 흐름엔 그 기운이 안 들어와 있어. 그래서 기다리는 대신 끌어다 쓰는 쪽을 짚어줄게."
      : "균형형은 약을 찾는 게 아니라 지금 균형을 안 깨는 쪽으로 푸는 게 맞아.",
  };
}

/**
 * 무료 증거 — ★실제 용신 화면(/saju/yongsin) 1층과 같은 결과★를 그대로 보여준다.
 * 여기서 답을 감추면 "돈 내야 알려준다"가 되고, 그건 이 상품이 가진 제일 큰 강점
 * (계산이라 지어낼 구멍이 없다)을 스스로 버리는 짓이다.
 */
function MyYongsin({ view, saju, chart }: { view: YongsinView; saju: SajuResult; chart: Chart | null }) {
  const yong = [...view.primaryYong, ...view.helperYong];

  return (
    <section className="pi-mine" aria-label="내 용신 계산 결과">
      <DataSummary
        saju={saju}
        name={chart?.name}
        gender={chart?.gender}
        occupation={chart?.occupation}
        className="pi-basis"
        action={<PersonSwitcher nameOnly triggerLabel="변경" className="pi-basis-change" />}
      />

      <article className="pi-block">
        <p className="h-sec">너한테 약이 되는 기운</p>
        {yong.length > 0 ? (
          <ul className="pi-orbs">
            {yong.map((el) => (
              <li className="pi-orb" key={el} style={{ "--el": `var(${ELEMENT_META[el].cssVar})` } as CSSProperties}>
                <ElementOrb el={el} />
                <strong>{ELEMENT_META[el].label}</strong>
                <em>{ELEMENT_META[el].gist}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pi-ys-none">균형형이라 뚜렷한 보약 기운이 없어 — 그것도 결과야.</p>
        )}
        <p className="pi-note">
          {view.primaryYong.length > 0
            ? `세 방법 중 둘 이상이 겹쳐서 꼽은 기운이야. 겹칠수록 확실해.`
            : `한 방법만 꼽은 보조 기운이야. 확실하다고 말하진 않을게.`}
        </p>
      </article>

      <article className="pi-block">
        <p className="h-sec">세 방법이 각각 뭐라고 했냐면</p>
        <p className="pi-note pi-note--top">{view.ilgan.ko} 같은 사람 · 세기는 {view.body} · 타고난 자리는 {view.johu.seasonPhrase}</p>
        <dl className="pi-methods">
          <div>
            <dt>타고난 그릇</dt>
            <dd>{view.gyeokguk.title} — {view.gyeokguk.sangsin.length ? `${view.gyeokguk.sangsin.map((e) => ELEMENT_META[e].label).join("·")} 기운이 이 그릇을 완성시켜` : "완성 재료가 뚜렷하지 않아"}</dd>
          </div>
          <div>
            <dt>세기 균형</dt>
            <dd>{view.body} — {view.eokbu.yongsin.length ? `${view.eokbu.yongsin.map((e) => ELEMENT_META[e].label).join("·")} 기운으로 맞춰` : "이미 균형이라 크게 안 건드려"}</dd>
          </div>
          <div>
            <dt>온도 균형</dt>
            <dd>{view.johu.hanYeolLabel} — {view.johu.johu.length ? `${view.johu.johu.map((e) => ELEMENT_META[e].label).join("·")} 기운으로 식히거나 데워` : "온도는 무난해서 안 말려"}</dd>
          </div>
        </dl>
      </article>

      {view.gisin.length > 0 && (
        <article className="pi-block">
          <p className="h-sec">들어오면 버거워지는 기운</p>
          <ul className="pi-orbs pi-orbs--muted">
            {view.gisin.map((el) => (
              <li className="pi-orb" key={el} style={{ "--el": `var(${ELEMENT_META[el].cssVar})` } as CSSProperties}>
                <ElementOrb el={el} />
                <strong>{ELEMENT_META[el].label}</strong>
                <em>{ELEMENT_META[el].gist}</em>
              </li>
            ))}
          </ul>
          <p className="pi-note">나쁜 팔자라는 뜻이 아니야. 이 기운이 들어오는 구간엔 벌이지 말고 정리하란 뜻.</p>
        </article>
      )}

      <p className="pi-note pi-note--foot">
        여기까지가 {chart?.name ? `${chart.name} ` : ""}계산 결과야 — 지어낸 게 아니라 만세력에서 그대로 나온 값.
      </p>
    </section>
  );
}
