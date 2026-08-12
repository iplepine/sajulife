"use client";

import { useEffect, useState } from "react";
import PersonSwitcher from "@/components/PersonSwitcher";
import TciRadar, { type RadarAxis } from "@/components/TciRadar";
import {
  ExploreCta, ExploreHero, ExploreOffer, HowBlock, LockedPreview,
  type ExploreCtaState,
} from "@/components/explore/parts";
import { TCI_ITEMS_SHORT, LIKERT_SCALE } from "@/lib/tci/questions";
import { calendarTheme, isThemeSeason, type ThemeSeason } from "@/lib/saju/seasonTheme";
import type { TciScore } from "@/lib/tci/scoring";

/**
 * 기질 검사 소개 페이지.
 *
 * ★다른 넷과 성격이 다르다★ — 나머지는 이미 계산된 내 데이터를 펼쳐 보이며 해석을 파는데,
 * 기질은 ★검사를 안 하면 데이터 자체가 없다★. 그래서 이 화면이 넘어야 할 벽은 신뢰가 아니라
 * ★마찰★(귀찮음)이다. 따라서 파는 톤이 아니라 "이거 얼마 안 걸려"로 문턱을 낮추는 데 집중한다.
 *
 * 이미 검사한 사람에게는 8축 레이더 실값을 그대로 보여주고 풀이로 보낸다 —
 * 예전엔 "기질 검사 시작"만 떠서 재방문자가 설문 1번 문항으로 되돌아갔다.
 */

const SECTIONS = [
  { name: "기본 성향", desc: "가장 두드러진 두세 축이 만드는 네 작동 방식" },
  { name: "여덟 결 기질분석", desc: "여덟 축 하나하나가 네 일상에서 어떻게 나오는지" },
  { name: "인간은 같은 실수를 반복하지", desc: "왜 비슷한 문제에 또 걸리는지" },
  { name: "스트레스 시나리오", desc: "어떤 상황이 이 조합에 유독 부하를 거는지" },
  { name: "대인관계", desc: "관계에서의 강점과 반복되는 마찰" },
  { name: "직무·진로", desc: "살아나는 환경과 흐려지는 환경" },
  { name: "성장 과제", desc: "다음 단계로 가려면 뭘 건드려야 하는지" },
  { name: "코칭 액션플랜", desc: "지금 당장 시작할 것" },
] as const;

/** 문항 미리보기 — ★실제 검사에 나오는 문항 그대로★. 분위기용 예시 문장을 지어내지 않는다. */
const SAMPLE_IDS = ["ns1", "ha2", "ps1"] as const;

type ReportRes = { scores?: TciScore[]; saved?: unknown; readiness?: { hasProfile?: boolean; hasTci?: boolean } };

export default function TemperamentIntroPage() {
  const [res, setRes] = useState<ReportRes | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [rootSeason, setRootSeason] = useState<ThemeSeason | null>(null);

  useEffect(() => {
    const attr = document.documentElement.dataset.seasonTheme;
    if (isThemeSeason(attr)) setRootSeason(attr);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetch("/api/tci/report", { cache: "no-store" });
        const d = r.ok ? ((await r.json()) as ReportRes) : {};
        if (alive) setRes(d);
      } catch {
        if (alive) setRes({});
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const scores = res?.scores ?? [];
  const hasTci = scores.length > 0 || !!res?.readiness?.hasTci;
  const hasSaved = !!res?.saved;
  const season = rootSeason ?? calendarTheme();

  const cta: ExploreCtaState = !loaded
    ? { href: "/tci", label: "준비 중…", note: "", pending: true }
    : hasSaved
      ? { href: "/tci/report", label: "내 기질 풀이 보기", note: "이미 검사 끝냈어. 설문 다시 안 풀어도 돼.", pending: false }
      : hasTci
        ? { href: "/tci/report", label: "검사 결과로 풀이 열기", note: "답변은 이미 저장돼 있어. 풀이만 열면 돼.", pending: false }
        : { href: "/tci", label: "3분 검사 시작", note: "35문항이야. 고민하지 말고 처음 든 생각으로 찍으면 돼.", pending: false };

  return (
    <main className="page intro-page pi-page">
      <ExploreHero
        titleId="ti-title"
        eyebrow="나의 기질"
        title={<>왜 매번<br />같은 데서 욱하는지</>}
        lead="성격이 나쁜 게 아니라 반응하는 결이 정해져 있는 거야. 그 결부터 재보자."
        season={season}
        ready={loaded || rootSeason !== null}
      />

      <ExploreCta cta={cta} />

      {scores.length > 0 ? <MyAxes scores={scores} /> : <SamplePreview />}

      <HowBlock
        titleId="ti-how-title"
        kicker="성격 테스트 그거 다 거기서 거기 아니야?"
        title="유형 하나로 안 묶어"
        items={[
          { t: "너를 한 글자로 안 줄여", d: "16유형처럼 상자에 넣는 게 아니라, 여덟 축이 각각 어디쯤인지 재." },
          { t: "높낮이가 아니라 조합을 봐", d: "추진성 하나만 높은 사람이랑, 추진성 높고 안정성도 높은 사람은 완전히 다르게 살아." },
          { t: "사주랑 겹칠 수 있어", d: "타고난 결(사주)이랑 지금 반응하는 결(기질)이 어긋나는 지점 — 거기가 제일 아픈 자리야." },
        ]}
        close="검사는 3분, 결과는 평생 쓰는 자기 설명서."
      />

      <ExploreOffer
        titleId="ti-offer-title"
        title="검사 끝나면 뭐가 나오냐면"
        lead="점수표 하나 던져주고 끝내는 게 아니라, 그 조합이 네 일·관계·스트레스에서 어떻게 굴러가는지 여덟 갈래로 풀어줄게."
        specs={[
          { k: "문항", v: "35개 · 3분" },
          { k: "구성", v: "여덟 갈래" },
          { k: "다시보기", v: "언제든 무료" },
        ]}
      >
        <LockedPreview cover="기질 풀이" sections={SECTIONS} />
      </ExploreOffer>
    </main>
  );
}

/** 이미 검사한 사람 — ★실제 점수로 그린 8축★. 리포트와 같은 TciRadar를 그대로 쓴다. */
function MyAxes({ scores }: { scores: TciScore[] }) {
  const axes: RadarAxis[] = scores.map((s) => ({ key: s.dimension, label: s.label, percent: s.percent }));
  const top = [...scores].sort((a, b) => b.percent - a.percent)[0];
  const low = [...scores].sort((a, b) => a.percent - b.percent)[0];

  return (
    <section className="pi-mine" aria-label="내 기질 검사 결과">
      <div className="pi-basis-head">
        <p className="h-sec">네 검사 결과야</p>
        <PersonSwitcher nameOnly triggerLabel="변경" className="pi-basis-change" />
      </div>
      <div className="card" style={{ padding: "10px 8px 6px" }}>
        <TciRadar axes={axes} />
      </div>
      <p className="pi-note">
        중앙에 가까울수록 낮고 바깥으로 돌출될수록 그 결이 세. 점선은 균형선(50%)이야.
        {top && low && ` 지금 제일 튀는 건 ${top.label}, 제일 얕은 건 ${low.label}.`}
      </p>
      <p className="pi-note pi-note--foot">
        여기까지가 네가 찍은 답을 그대로 채점한 값이야. 이게 무슨 뜻인지가 아래에 있고.
      </p>
    </section>
  );
}

/** 아직 검사 전 — 겁주지 말고 ★실제 문항★을 보여준다. "이 정도면 할 만하네"가 목표. */
function SamplePreview() {
  const samples = SAMPLE_IDS
    .map((id) => TCI_ITEMS_SHORT.find((it) => it.id === id))
    .filter((it): it is NonNullable<typeof it> => !!it);

  return (
    <section className="pi-mine" aria-label="검사 문항 미리보기">
      <p className="h-sec">이런 걸 물어봐</p>
      <ul className="pi-quiz">
        {samples.map((item) => (
          <li key={item.id}>
            <p>{item.text}</p>
            <div className="pi-quiz-scale" aria-hidden>
              {LIKERT_SCALE.map((s) => <span key={s.value}>{s.label}</span>)}
            </div>
          </li>
        ))}
      </ul>
      <p className="pi-note pi-note--foot">이런 문항 35개. 정답 없으니까 오래 붙들지 말고 첫 느낌으로 찍어.</p>
    </section>
  );
}
