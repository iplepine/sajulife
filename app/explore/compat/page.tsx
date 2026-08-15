"use client";

import { useEffect, useState } from "react";
import {
  ExploreCta, ExploreHero, ExploreOffer, HowBlock, LockedPreview,
  type ExploreCtaState,
} from "@/components/explore/parts";
import { calendarTheme, isThemeSeason, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";
import { stemMeta } from "@/lib/saju/seasonClock";
import type { SajuResult } from "@/lib/saju/calculator";
import type { CompatStore } from "@/lib/store/types";

/**
 * 궁합 구매 유도 페이지.
 *
 * ★이 상품이 막히는 지점★ — 가족과 같다. 나 혼자로는 성립하지 않고 ★상대 한 명이 필요하다★.
 * 그래서 이 화면의 일은 설득보다 ★"생년월일 하나만 알면 된다"는 문턱 낮추기★다.
 *
 * ★톤 주의★: 상대는 실존 인물이다. 팩폭은 '너'에게만, 상대는 존중해서 쓴다(CLAUDE.md).
 * 그리고 ★궁합 점수·판정("몇 점", "천생연분", "상극")은 쓰지 않는다★ — 리포트 규칙과 같은 약속이라
 * 여기서 점수를 기대하게 만들면 본문에서 배신당한다.
 */

const SECTIONS = [
  { name: "두 사람의 결", desc: "각자 타고난 결을 나란히 놓고 뭐가 닮고 뭐가 반대인지" },
  { name: "케미 진단", desc: "서로 채워주는 지점과 부딪치기 쉬운 지점" },
  { name: "온도차", desc: "속도·표현·연락 간격이 어긋나서 생기는 오해" },
  { name: "갈등 시나리오", desc: "실제로 터지기 쉬운 장면 두 개와 끊는 한 수" },
  { name: "관계 흐름", desc: "지금 겹치는 구간과 앞으로 1~2년" },
  { name: "현실 궁합", desc: "돈 쓰는 기준, 생활 리듬, 합의해두면 좋은 것" },
  { name: "실행전략", desc: "오늘·이번 달에 네가 실제로 할 것" },
] as const;

type Chart = { saju: SajuResult | null; name?: string; currentYear?: number };

export default function CompatIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [compat, setCompat] = useState<CompatStore | null>(null);
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
      const [chartRes, compatRes, savedRes] = await Promise.all([
        readJson<Chart>("/api/saju/chart"),
        readJson<{ compat?: CompatStore }>("/api/compat"),
        readJson<{ saved?: unknown }>("/api/compat/report"),
      ]);
      if (!alive) return;
      setChart(chartRes ?? { saju: null });
      setCompat(compatRes?.compat ?? null);
      setHasSaved(!!savedRes?.saved);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const season = saju ? themeForSaju(saju, currentYear) : (rootSeason ?? calendarTheme());
  const partners = compat?.partners ?? [];

  const cta: ExploreCtaState = !loaded
    ? { href: "/compat", label: "준비 중…", note: "", pending: true }
    : !saju
      ? {
          href: `/onboarding?next=${encodeURIComponent("/explore/compat")}`,
          label: "먼저 내 생년월일 넣기",
          note: "나부터 넣어야 상대랑 겹칠 수 있어.",
          pending: false,
        }
      : hasSaved
        ? { href: "/compat", label: "궁합 풀이 보기", note: "이미 만들어둔 궁합 풀이가 있어.", pending: false }
        : partners.length > 0
          ? { href: "/compat", label: "궁합 풀이 시작", note: `${partners.length}명 등록돼 있어. 바로 볼 수 있어.`, pending: false }
          : { href: "/compat", label: "상대 추가하기", note: "상대 생년월일만 있으면 바로 시작돼.", pending: false };

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
        titleId="cpi-title"
        eyebrow="궁합"
        title={<>왜 이 사람한테만<br />자꾸 같은 데서 걸릴까</>}
        lead="안 맞는 게 아니라 결이 다른 거야. 어디서 맞물리고 어디서 어긋나는지 겹쳐서 보자."
        season={season}
        ready={loaded || rootSeason !== null}
        center={saju?.dayMaster.hanja}
        orbit={orbit}
      />

      <ExploreCta cta={cta} />

      <MyPartners partners={partners} chart={chart} loaded={loaded} />

      <HowBlock
        titleId="cpi-how-title"
        kicker="궁합, 점수 나오는 거 아니야?"
        title="몇 점인지는 안 봐"
        items={[
          { t: "점수로 판정 안 해", d: "'78점·천생연분·상극' 같은 건 안 써. 그거 알아도 내일 뭘 할지는 안 바뀌거든." },
          { t: "누가 잘못했나도 안 따져", d: "'저 사람이 무심해서'가 아니라 '두 결의 속도가 달라서'로 풀어." },
          { t: "말의 순서까지 짚어", d: "부딪히기 전에 어떤 말을 어떤 타이밍에 꺼내면 되는지까지 내려가." },
        ]}
        close="팩폭은 너한테만 해. 상대 얘기는 조심할게."
      />

      <ExploreOffer
        titleId="cpi-offer-title"
        title="둘이 겹치면 뭐가 나오냐면"
        lead="두 사람 결을 나란히 놓고, 어디서 부딪히고 뭘 어떻게 말하면 되는지 일곱 갈래로 풀어줄게."
        specs={[
          { k: "대상", v: "나 + 상대 1명" },
          { k: "구성", v: "일곱 갈래" },
          { k: "다시보기", v: "언제든 무료" },
        ]}
      >
        <LockedPreview cover="우리 궁합 풀이" sections={SECTIONS} />
      </ExploreOffer>
    </main>
  );
}

/** 무료 증거 — 등록된 상대와 내 타고난 결. 상대가 없으면 문턱이 낮다는 걸 보여준다. */
function MyPartners({
  partners,
  chart,
  loaded,
}: {
  partners: CompatStore["partners"];
  chart: Chart | null;
  loaded: boolean;
}) {
  if (!loaded) {
    return (
      <section className="pi-mine pi-mine--empty" aria-label="궁합 상대">
        <p className="pi-empty-copy">불러오는 중…</p>
      </section>
    );
  }

  return (
    <section className="pi-mine" aria-label="궁합 상대">
      <p className="h-sec">지금 겹칠 수 있는 사람</p>
      {partners.length > 0 ? (
        <ul className="pi-family">
          {partners.map((p) => (
            <li key={p.id}>
              <strong>{p.profile.name || "이름 없음"}</strong>
              <em>{p.relation} · {p.profile.birthDate}</em>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pi-ys-none">아직 등록된 상대가 없어.</p>
      )}
      <p className="pi-note">
        {partners.length > 0
          ? "한 번에 한 명씩 봐. 여러 명 저장해두고 바꿔가며 볼 수 있어."
          : "상대 생년월일만 알면 돼. 태어난 시각은 몰라도 시작할 수 있어."}
      </p>
      {chart?.saju && (
        <p className="pi-note pi-note--foot">
          네 타고난 결은 <b>{stemMeta(chart.saju.dayMaster.hanja).metaphor}</b> — 상대도 이렇게 하나씩 나와서, 둘을 겹쳐 봐.
        </p>
      )}
    </section>
  );
}
