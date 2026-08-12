"use client";

import { useEffect, useState, type CSSProperties } from "react";
import PersonSwitcher from "@/components/PersonSwitcher";
import { ElementOrb } from "@/components/report/PersonalReportBody";
import {
  ExploreCta, ExploreEmpty, ExploreHero, ExploreOffer, HowBlock, LockedPreview,
  type ExploreCtaState,
} from "@/components/explore/parts";
import { buildYongsinView, ELEMENT_META } from "@/lib/saju/yongsinView";
import { calendarTheme, isThemeSeason, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";
import type { SajuResult } from "@/lib/saju/calculator";

/**
 * 용신 상담 구매 유도 페이지.
 *
 * ★다른 넷과 다른 점★ — 나머지는 정해진 목차의 리포트를 파는데, 상담은 ★내가 묻는 것에 답한다★.
 * 그래서 미리보기로 보여줄 '목차'가 사실상 없다. 대신 이 화면이 보여줘야 하는 건 두 가지다:
 *   (1) 답의 근거가 뭐냐 → 이미 계산된 내 보약 기운(감으로 답하는 게 아니라는 증거)
 *   (2) 뭘 물어봐도 되냐 → 실제로 물을 법한 질문 예시 (빈 입력창 앞에서 사람은 얼어붙는다)
 * 특히 (2)가 핵심이다. 상담의 진짜 이탈 지점은 결제가 아니라 ★"뭘 물어보지"★다.
 */

const SECTIONS = [
  { name: "짚어주는 한 줄", desc: "네 질문에 대한 답을 먼저 한 줄로" },
  { name: "같은 결을 가진 애들이 자주 겪던 흐름", desc: "네 사주 결에서 이 고민이 왜 반복되는지" },
  { name: "그래서 이렇게 풀어가면 돼", desc: "네 보약 기운에 맞춘 실제 선택지" },
  { name: "오늘부터 사흘 안에 해볼 한 가지", desc: "당장 손댈 것 하나" },
  { name: "마음에 둘 한 줄", desc: "끝맺음" },
] as const;

/** 물어볼 거리 — 사람들이 실제로 막히는 자리. 빈 입력창 앞에서 얼지 않게 하는 게 목적이다. */
const ASKS = [
  "지금 회사 계속 다녀야 할까, 옮겨야 할까?",
  "올해 안에 벌여도 되는 일이야, 아니면 더 기다려야 해?",
  "이 사람이랑 계속 가는 게 맞나 싶어.",
  "돈이 계속 새는 것 같은데 어디가 구멍이야?",
  "요즘 아무것도 하기 싫은데 이게 언제까지 갈까?",
] as const;

type Chart = { saju: SajuResult | null; name?: string; currentAge?: number; currentYear?: number };

export default function ConsultIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
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
      const [chartRes, consultRes] = await Promise.all([
        readJson<Chart>("/api/saju/chart"),
        readJson<{ history?: unknown[] }>("/api/consult"),
      ]);
      if (!alive) return;
      setChart(chartRes ?? { saju: null });
      setHistoryCount(consultRes?.history?.length ?? 0);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const season = saju ? themeForSaju(saju, currentYear) : (rootSeason ?? calendarTheme());
  const view = saju ? buildYongsinView(saju, chart?.currentAge, currentYear) : null;

  const cta: ExploreCtaState = !loaded
    ? { href: "/consult", label: "준비 중…", note: "", pending: true }
    : !saju
      ? {
          href: `/onboarding?next=${encodeURIComponent("/explore/consult")}`,
          label: "생년월일 넣기",
          note: "네 사주를 알아야 감이 아니라 근거로 답할 수 있어.",
          pending: false,
        }
      : historyCount > 0
        ? { href: "/consult", label: "또 물어보기", note: `지금까지 ${historyCount}번 물어봤어. 지난 상담도 거기 다 있어.`, pending: false }
        : { href: "/consult", label: "지금 고민 물어보기", note: "한 줄이면 돼. 길게 안 써도 알아들어.", pending: false };

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
        titleId="ci-title"
        eyebrow="용신 상담"
        title={<>지금 그거,<br />물어봐도 돼</>}
        lead="정해진 목차 말고 네가 지금 막힌 그거. 네 보약 기운을 근거로 답해줄게."
        season={season}
        ready={loaded || rootSeason !== null}
        center={saju?.dayMaster.hanja}
        orbit={orbit}
      />

      <ExploreCta cta={cta} />

      {view ? (
        <section className="pi-mine" aria-label="답의 근거">
          <div className="pi-basis-head">
            <p className="h-sec">답할 때 쓰는 근거</p>
            <PersonSwitcher nameOnly triggerLabel="변경" className="pi-basis-change" />
          </div>
          <ul className="pi-orbs">
            {[...view.primaryYong, ...view.helperYong].map((el) => (
              <li className="pi-orb" key={el} style={{ "--el": `var(${ELEMENT_META[el].cssVar})` } as CSSProperties}>
                <ElementOrb el={el} />
                <strong>{ELEMENT_META[el].label}</strong>
                <em>{ELEMENT_META[el].gist}</em>
              </li>
            ))}
          </ul>
          <p className="pi-note">
            {view.primaryYong.length + view.helperYong.length > 0
              ? `${view.ilgan.ko} 같은 사람 · 세기는 ${view.body}. 무슨 질문을 하든 이 결에 맞춰서 답이 나와 — 남한테 하는 일반론이 아니라.`
              : `${view.ilgan.ko} 같은 사람 · 세기는 ${view.body}. 균형형이라 한쪽으로 몰아붙이지 않고 답해.`}
          </p>
        </section>
      ) : (
        <ExploreEmpty loaded={loaded}>
          생년월일만 넣으면 네 결에 맞춰서 답할 수 있어. 안 넣으면 그냥 일반론밖에 못 해.
        </ExploreEmpty>
      )}

      <section className="pi-asks" aria-labelledby="ci-asks-title">
        <p className="h-sec" id="ci-asks-title">이런 거 물어봐</p>
        <ul>
          {ASKS.map((q) => <li key={q}>{q}</li>)}
        </ul>
        <p className="pi-note">한 줄이면 충분해. 정리 안 된 채로 던져도 돼.</p>
      </section>

      <HowBlock
        titleId="ci-how-title"
        kicker="아무한테나 똑같이 답하는 거 아니야?"
        title="네 사주를 깔고 답해"
        items={[
          { t: "질문마다 네 결을 다시 봐", d: "같은 질문이어도 네 보약 기운이 다르면 답이 달라져." },
          { t: "일반론으로 안 도망가", d: "'마음가짐이 중요해요' 같은 소리 말고, 사흘 안에 할 것 하나까지 내려가." },
          { t: "물어본 건 남아", d: "지난 상담은 다 저장돼. 나중에 뭐라고 했는지 다시 볼 수 있어." },
        ]}
        close="고민이 정리 안 돼도 괜찮아. 정리하는 것부터 같이 하면 돼."
      />

      <ExploreOffer
        titleId="ci-offer-title"
        title="답은 이렇게 와"
        lead="한 줄 결론부터 던지고, 왜 그런지 네 결로 설명한 다음, 사흘 안에 할 것 하나로 닫아."
        specs={[
          { k: "형식", v: "다섯 갈래" },
          { k: "근거", v: "내 보약 기운" },
          { k: "기록", v: "지난 상담 보관" },
        ]}
      >
        <LockedPreview cover={chart?.name ? `${chart.name}의 상담` : "상담"} sections={SECTIONS} />
      </ExploreOffer>
    </main>
  );
}
