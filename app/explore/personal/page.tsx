"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import PersonSwitcher from "@/components/PersonSwitcher";
import { DataSummary, ElementOrb, PillarsGrid, WuxingDist } from "@/components/report/PersonalReportBody";
import { TEN_SPIRIT_LABELS, tenSpiritFromStem, tenSpiritFromZhi, type TenSpirit } from "@/lib/saju/tenSpirits";
import { computeNatalBalance } from "@/lib/saju/balance";
import { seasonOfBranch, stemMeta } from "@/lib/saju/seasonClock";
import { SEASON_ART, SEASON_FALLBACK_STEM } from "@/lib/saju/seasonArt";
import { buildYongsinView, ELEMENT_META, type Element } from "@/lib/saju/yongsinView";
import { calendarTheme, isThemeSeason, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";
import type { SajuResult } from "@/lib/saju/calculator";

/**
 * 개인 사주 구매 유도 페이지.
 *
 * ★설계 전제★ — 만세력은 AI 없이 로컬에서 계산된다(lunar-javascript). 그래서 이 화면은
 * "일반적인 소개"가 아니라 ★이미 계산된 이 사람의 진짜 데이터★를 먼저 펼쳐 보인다.
 * 그 데이터는 답이 아니라 질문을 만든다("불이 0개네? 그래서 뭐?") — 그 갈증이 전환의 동력이다.
 * 해석(8섹션·1.2만 자)은 베타 기간 동안 무료로 연다.
 */

const WUXING = [
  { key: "목", label: "나무", tone: "wood" },
  { key: "화", label: "불", tone: "fire" },
  { key: "토", label: "흙", tone: "earth" },
  { key: "금", label: "쇠", tone: "metal" },
  { key: "수", label: "물", tone: "water" },
] as const;

/** 사주 정보가 없을 때 궤도에 띄우는 보조 기호 — 홈 히어로와 같은 8자. */
const GENERIC_STEMS = ["甲", "丁", "戊", "己", "丙", "辛", "癸", "乙"];

/** 유료 리포트가 실제로 내보내는 8섹션 — lib/prompts/defaults.ts의 `▣ 1~8`과 같은 출처. */
const SECTIONS = [
  { name: "타고난 기운 배합", desc: "다섯 기운이 만드는 균형과 쏠림, 뭘 채우고 뭘 덜어낼지" },
  { name: "너라는 사람", desc: "너를 한 줄로 요약하는 별명, 자원과 약점" },
  { name: "일이 풀리는 자리", desc: "일에서 성과가 나는 방식과 매번 걸리는 병목" },
  { name: "돈이 붙고 새는 자리", desc: "돈을 버는 방식과 빠져나가는 구멍" },
  { name: "사람과 부딪히는 자리", desc: "사람에게서 얻는 힘과 반복해서 부딪치는 지점" },
  { name: "몸이 먼저 아는 것", desc: "에너지가 쏠려서 먼저 신호가 오는 몸·멘탈 지점" },
  { name: "인생의 계절", desc: "10년 단위 흐름의 큰 전환점" },
  { name: "올해 남은 판", desc: "올해 남은 기간, 내년 준비, 조심할 달" },
] as const;

/**
 * 미리보기 첫 섹션에 넣을 문장 — ★AI가 쓴 글이 아니라 이 사람의 실제 계산값★이다.
 * 가짜 풀이를 지어내 '예시'라고 보여주는 대신, 진짜 데이터를 리포트 서식에 얹고 본문부터 잠근다.
 * 그래야 "여기까진 사실, 이 다음이 풀이"라는 이 화면의 약속이 미리보기에서도 지켜진다.
 */
function wuxingLines(saju: SajuResult): { lead: string; body: string } {
  const counts = WUXING.map((w) => ({ ...w, n: saju.wuxingCount[w.key] ?? 0 }));
  const list = counts.map((c) => `${c.label} ${c.n}`).join(" · ");
  const sorted = [...counts].sort((a, b) => b.n - a.n);
  const missing = counts.filter((c) => c.n === 0).map((c) => c.label);
  return {
    lead: missing.length > 0 ? `${list} — 한쪽으로 쏠린 배합이야.` : `${list} — 고루 퍼진 배합이야.`,
    body: missing.length > 0
      ? `가장 두꺼운 기운은 ${sorted[0].label}, 비어 있는 기운은 ${missing.join("·")}.`
      : `가장 두꺼운 기운은 ${sorted[0].label}, 가장 얇은 기운은 ${sorted[sorted.length - 1].label}.`,
  };
}

type Chart = {
  saju: SajuResult | null;
  name?: string;
  gender?: string;
  occupation?: string;
  currentAge?: number;
  currentYear?: number;
};

export default function PersonalIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // 차트가 오기 전 계절 — 서버 쿠키로 이미 루트에 심긴 테마를 그대로 쓴다.
  // 달력 계절로 시작하면 응답이 온 뒤 히어로만 다른 계절로 튄다(P9: 계절 전환은 인물 전환 때만).
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
        readJson<{ saved?: unknown }>("/api/saju/personal"),
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

  // ── CTA 분기 — 프로필 없음 → 저장된 풀이 있음 → 베타 무료 풀이
  // 결제/권한 모델을 검증하기 전에는 티켓을 소모하는 것처럼 보이게 하지 않는다.
  const cta = !loaded
    ? { href: "/saju", label: "준비 중…", note: "", pending: true }
    : !saju
      ? {
          href: `/onboarding?next=${encodeURIComponent("/explore/personal")}`,
          label: "생년월일 넣기",
          note: "생년월일이랑 태어난 시각만 알려주면 네 사주 바로 뽑아줄게. 공짜야.",
          pending: false,
        }
      : hasSaved
        ? { href: "/saju", label: "내 풀이 보기", note: "이미 열어둔 풀이야. 다시 보는 건 언제든 가능해.", pending: false }
        : { href: "/saju", label: "무료로 풀이 시작", note: "베타 기간에는 개인 사주 풀이를 무료로 볼 수 있어.", pending: false };

  return (
    <main className="page intro-page pi-page">
      {/* 계절을 확정하기 전엔 풍경을 깔지 않는다 — 틀린 계절을 먼저 보여주는 것보다 늦게 뜨는 게 낫다. */}
      <PersonalHero saju={saju} season={season} ready={saju !== null || rootSeason !== null} />

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

      {saju ? <MyChart saju={saju} chart={chart} currentYear={currentYear} /> : <ChartPlaceholder loaded={loaded} />}

      <HowSection />

      <section className="pi-offer" aria-labelledby="pi-offer-title">
        <h2 id="pi-offer-title">이게 무슨 뜻이냐면</h2>
        <p className="pi-offer-lead">
          네 일·돈·관계·몸에서 이게 실제로 어떻게 굴러가는지 여덟 갈래로 풀어줄게.
        </p>
        <ReportPreview saju={saju} name={chart?.name} />
        <dl className="pi-specs">
          <div><dt>분량</dt><dd>12,000자 넘게</dd></div>
          <div><dt>구성</dt><dd>여덟 갈래</dd></div>
          <div><dt>다시보기</dt><dd>언제든 무료</dd></div>
        </dl>
      </section>

    </main>
  );
}

/**
 * 히어로 — 홈과 같은 리소스·같은 문법(계절 풍경 + 구슬 + 점선 궤도)을 쓴다.
 * 다른 점은 딱 하나: ★홈의 궤도는 보조 기호 8개지만, 여기는 이 사람의 실제 여덟 글자★.
 * 같은 그림을 쓰되 내용이 내 것으로 바뀌는 게 이 화면이 홈 다음에 오는 이유다.
 */
function PersonalHero({ saju, season, ready }: { saju: SajuResult | null; season: ThemeSeason; ready: boolean }) {
  const art = SEASON_ART[season];
  const center = saju?.dayMaster.hanja ?? SEASON_FALLBACK_STEM[season];

  // 일간(=중앙 구슬)을 뺀 나머지 글자를 궤도에 올린다. 시각을 모르면 시주 두 글자가 빠져 6자가 된다.
  const orbit = saju
    ? [
        saju.pillars.year.gan.hanja, saju.pillars.year.zhi.hanja,
        saju.pillars.month.gan.hanja, saju.pillars.month.zhi.hanja,
        saju.pillars.day.zhi.hanja,
        ...(saju.pillars.time ? [saju.pillars.time.gan.hanja, saju.pillars.time.zhi.hanja] : []),
      ]
    : GENERIC_STEMS;
  const step = 360 / orbit.length;

  return (
    <section className={`pi-hero life-path-hero--${season}${ready ? "" : " pi-hero--waiting"}`} aria-labelledby="pi-title">
      {ready && (
        <div className="life-path-stems pi-hero-stems" style={{ "--stem-step": `${step}deg` } as CSSProperties} aria-hidden>
          <img className="life-path-stem-lines" src={art.constellation} alt="" draggable={false} />
          <img className="life-path-orb" src={art.orb} alt="" draggable={false} />
          <span className="life-path-orb-character">{center}</span>
          {orbit.map((ch, index) => (
            <span className="life-path-stem" key={`${ch}-${index}`} style={{ "--stem-index": index } as CSSProperties}>{ch}</span>
          ))}
        </div>
      )}
      <div className="pi-hero-copy">
        <p className="intro-eyebrow">개인 사주</p>
        <h1 id="pi-title">네가 왜 매번<br />같은 데서 걸리는지</h1>
        <p>감으로 찍는 게 아니라 네 만세력을 계산해서 읽어. 벌써 다 뽑아놨어.</p>
      </div>
    </section>
  );
}

/** 오행 칩 — 색은 의미층(--el-*). 지우면 어느 기운인지가 사라지므로 여기선 색이 데이터다(P2). */
function ElementChips({ els }: { els: Element[] }) {
  return (
    <>
      {els.map((el) => {
        const meta = ELEMENT_META[el];
        return (
          <span className="pi-el-chip" key={el} style={{ "--el": `var(${meta.cssVar})` } as CSSProperties}>
            <ElementOrb el={el} className="el-orb--sm" />
            <em>{meta.gist}</em>
          </span>
        );
      })}
    </>
  );
}

/**
 * 스크롤 등장 — 목록이 화면에 들어오면 항목이 차례로 촥촥 붙는다.
 *
 * ★설계 원칙(P9)은 "장식 애니메이션 금지"지만 여기는 예외로 둔다★ — 이 목록은 논거를
 * 한 개씩 쌓아 설득하는 자리라, 등장 순서 자체가 읽는 속도를 잡아주는 기능을 한다.
 * 대신 두 가지는 지킨다: (1) prefers-reduced-motion이면 애니메이션 없이 바로 보이고,
 * (2) 숨김은 JS가 붙은 뒤에만 건다 — 스크립트가 죽어도 내용이 사라지지 않게.
 */
function useStaggerReveal<T extends HTMLElement>() {
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
 * 리포트 미리보기 — ★실제 리포트와 같은 마크업(.rv / .rv-sec / .rv-h / .rv-body)★을 쓴다.
 * 껍데기를 따로 만들면 "산 뒤에 보게 될 것"과 다른 그림이 되므로, 서식을 그대로 빌려 쓴다.
 * 첫 섹션만 열려 있고 그 안의 두 줄은 진짜 계산값. 나머지는 잠금 표시로 닫아 둔다.
 */
function ReportPreview({ saju, name }: { saju: SajuResult | null; name?: string }) {
  const first = saju ? wuxingLines(saju) : null;

  return (
    <div className="rv rv--json pi-preview">
      <p className="pi-preview-cover">{name ? `${name}의 개인 사주 풀이` : "개인 사주 풀이"}</p>

      <details className="rv-sec rv-sec--personal pi-preview-open" open>
        <summary className="rv-h rv-h--with-lead">
          <span className="rv-h-copy">
            <span className="t">{SECTIONS[0].name}</span>
            <span className="rv-h-lead">{first ? first.lead : SECTIONS[0].desc}</span>
          </span>
        </summary>
        <div className="rv-body">
          {first && <p className="rv-lead">{first.body}</p>}
          {/* 잠긴 본문 — 가짜 문장을 지어내지 않고 '글이 있다'는 것만 보여준다. */}
          <div className="pi-locked" aria-label="여기서부터 잠긴 본문">
            <span /><span /><span /><span /><span />
          </div>
        </div>
      </details>

      {SECTIONS.slice(1).map((s) => (
        <div className="rv-sec rv-sec--personal pi-preview-locked" key={s.name}>
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

/**
 * 설득 블록 — 설명이 아니라 ★반론 죽이기★. "그냥 지어내는 거 아니냐"가 1번 구매 저항이라
 * 제목에서 바로 받아친다. 각 항목은 한 줄, 논거는 스크롤에 맞춰 하나씩 쌓인다.
 * ★사용자 노출 카피에 'AI'는 쓰지 않는다★ — 말하는 사람은 사주언니지 기계가 아니다.
 */
function HowSection() {
  const listRef = useStaggerReveal<HTMLOListElement>();
  return (
    <section className="pi-how" aria-labelledby="pi-how-title">
      <p className="pi-how-k">이거 그냥 지어내는 거 아니냐고?</p>
      <h2 id="pi-how-title">찍는 게 아니라 계산이야</h2>
      <ol ref={listRef}>
        <li>
        <div>
          <strong>생일만 던져 넣은 거 아니야</strong>
          <p>절기·경도까지 따져서 코드가 만세력을 뽑아. 여기엔 지어낼 구멍이 없어.</p>
        </div>
        </li>
        <li>
        <div>
          <strong>한 유파로 안 봐. 셋을 겹쳐</strong>
          <p>억부·격국·조후. 하나만 보면 사람마다 말이 달라지니까, 셋이 겹친 답만 써.</p>
        </div>
        </li>
        <li>
        <div>
          <strong>서른여섯한테 스물 얘기 안 해</strong>
          <p>네 나이대가 지금 제일 급한 것부터 순서를 다시 짜.</p>
        </div>
        </li>
      </ol>
      <p className="pi-how-close">베타 기간에는 계산부터 여덟 갈래 풀이까지 무료로 열어둘게.</p>
    </section>
  );
}

/**
 * 나를 표현하는 글자들 — ★한 장씩 넘어가는 단서 카드★.
 *
 * 여덟 줄을 표로 한 번에 깔면 눈이 훑고 지나간다. 한 번에 하나만 크게 띄우면
 * 한 글자씩 "이게 나다"가 쌓이고, 남은 장수(01/08)가 계속 볼 이유를 만든다.
 * 해석은 넣지 않는다 — 전부 계산으로 나오는 값이고, 뜻풀이는 유료 여덟 갈래의 몫이다.
 */
type Trait = { k: string; v: string; sub: string };

function MyTraits({ saju }: { saju: SajuResult }) {
  const stem = stemMeta(saju.dayMaster.hanja);
  const balance = computeNatalBalance(saju);
  const season = seasonOfBranch(saju.pillars.month.zhi.hanja);
  const counts = WUXING.map((w) => ({ ...w, n: saju.wuxingCount[w.key] ?? 0 }));
  const top = [...counts].sort((a, b) => b.n - a.n)[0];
  const missing = counts.filter((c) => c.n === 0).map((c) => c.label);

  const dm = saju.dayMaster.hanja;
  const spirits: TenSpirit[] = [];
  for (const p of [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.time]) {
    if (!p) continue;
    const g = tenSpiritFromStem(dm, p.gan.hanja);
    const z = tenSpiritFromZhi(dm, p.zhi.hanja);
    if (g) spirits.push(g);
    if (z) spirits.push(z);
  }
  const tally = new Map<TenSpirit, number>();
  for (const sp of spirits) tally.set(sp, (tally.get(sp) ?? 0) + 1);
  const topSpirit = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];

  const traits: Trait[] = [
    { k: "타고난 결", v: stem.short, sub: stem.metaphor },
    { k: "뿌리내린 자리", v: season.phrase, sub: `태어난 달의 계절 — ${season.season}` },
    { k: "기운의 온도", v: balance.natalLabels.hanYeol, sub: "여덟 글자의 한열 균형" },
    { k: "음양 쏠림", v: balance.natalLabels.yinYang, sub: "여덟 글자의 음양 균형" },
    { k: "제일 두꺼운 기운", v: top.label, sub: `여덟 글자 중 ${top.n}개` },
  ];
  if (missing.length > 0) traits.push({ k: "비어 있는 기운", v: missing.join(" · "), sub: "하나도 없음" });
  if (topSpirit && topSpirit[1] > 1) {
    traits.push({ k: "여러 번 겹친 자리", v: topSpirit[0], sub: `${TEN_SPIRIT_LABELS[topSpirit[0]].short} ${topSpirit[1]}개` });
  }
  traits.push({ k: "띠", v: `${saju.shengXiao.ko}띠`, sub: "태어난 해의 지지" });

  return <TraitReel traits={traits} />;
}

/**
 * 단서 드럼 — 글자들이 원통에 붙어 돌아간다.
 *
 * 평면으로 밀어 올리면 "목록을 스크롤한다"로 읽히지만, 원통을 굴리면 앞뒤 글자가
 * 비스듬히 누워 있다가 정면으로 돌아 나온다 — 한 덩어리에서 하나씩 꺼내 보는 느낌이 된다.
 * 항목이 원통을 한 바퀴 감싸므로 복제본이나 되감기 없이 그대로 무한히 돈다.
 */
function TraitReel({ traits }: { traits: Trait[] }) {
  const [idx, setIdx] = useState(0);
  const [live, setLive] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const n = traits.length;

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // 화면 밖에서 혼자 돌면 사용자가 놓친다 — 보일 때만 굴린다.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setLive(es[0]?.isIntersecting ?? false), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live || reduced) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % n), 2400);
    return () => window.clearInterval(t);
  }, [live, reduced, n]);

  if (reduced) {
    return (
      <dl className="tr-plain">
        {traits.map((t) => (
          <div key={t.k}><dt>{t.k}</dt><dd>{t.v}<em>{t.sub}</em></dd></div>
        ))}
      </dl>
    );
  }

  const cur = traits[idx];

  return (
    <div className="tr" ref={ref}>
      <p className="tr-k" key={`k${idx}`}>{cur.k}</p>

      <div className="tr-reel" style={{ "--step": `${360 / n}deg` } as CSSProperties}>
        <ul className="tr-drum">
          {traits.map((t, i) => {
            // 원통이라 앞뒤로 감긴다 — 가까운 쪽으로 돌도록 거리(o)를 ±n/2 안으로 접는다.
            let o = i - idx;
            if (o > n / 2) o -= n;
            if (o < -n / 2) o += n;
            const far = Math.abs(o) > 1;
            return (
              <li
                key={t.k}
                className={o === 0 ? "is-cur" : undefined}
                aria-hidden={o !== 0}
                style={{
                  "--o": o,
                  opacity: o === 0 ? 1 : 0.16,
                  visibility: far ? "hidden" : undefined,
                } as CSSProperties}
              >
                {t.v}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="tr-sub" key={`s${idx}`}>{cur.sub}</p>
    </div>
  );
}

/** 프로필이 아직 없을 때 — 뭘 보게 될지 자리만 잡아 보여준다. */
function ChartPlaceholder({ loaded }: { loaded: boolean }) {
  return (
    <section className="pi-mine pi-mine--empty" aria-label="내 사주 데이터">
      <p className="pi-empty-copy">
        {loaded
          ? "생년월일이랑 태어난 시각만 알려주면 네 타고난 기운, 다섯 기운 배합, 네 기둥, 10년 흐름까지 바로 뽑아줄게. 공짜야."
          : "불러오는 중…"}
      </p>
    </section>
  );
}

/** 이미 계산돼 있는 무료 데이터 — 이 페이지의 본체. */
function MyChart({ saju, chart, currentYear }: { saju: SajuResult; chart: Chart | null; currentYear: number }) {
  const currentAge = chart?.currentAge;
  const missing = WUXING.filter((w) => (saju.wuxingCount[w.key] ?? 0) === 0).map((w) => w.label);

  // 용신도 결정론 계산(억부·격국·조후 종합)이라 티켓 없이 뽑힌다 — /saju/yongsin 판정판과 같은 출처.
  // 구매 유도 화면이 계산 하나로 죽으면 안 되니 실패해도 이 블록만 빠지게 감싼다.
  const yongsin = (() => {
    try {
      const view = buildYongsinView(saju, currentAge, currentYear);
      const good = view.primaryYong.length > 0 ? view.primaryYong : view.helperYong;
      return { good, bad: view.gisin };
    } catch {
      return null;
    }
  })();

  const dayun = saju.daewoon ?? [];
  const nowIdx = dayun.reduce((acc, d, i) => (d.startYear <= currentYear ? i : acc), -1);

  return (
    <section className="pi-mine" aria-label="내 사주 데이터">
      {/* 무엇을 근거로 뽑았는지 먼저 — 리포트 첫 블록과 같은 컴포넌트. 표 자체가 이름표라 제목은 두지 않는다. */}
      {/* 대상자 변경은 여기에 둔다 — 인물을 바꾼다는 건 곧 이 표의 값이 통째로 바뀐다는 뜻이라,
          히어로에 칩으로 띄우는 것보다 바뀔 값 바로 옆이 이해가 빠르다. */}
      <DataSummary
        saju={saju}
        name={chart?.name}
        gender={chart?.gender}
        occupation={chart?.occupation}
        className="pi-basis"
        action={<PersonSwitcher nameOnly triggerLabel="변경" className="pi-basis-change" />}
      />

      <article className="pi-block">
        <h3>나를 표현하는 글자들</h3>
        <MyTraits saju={saju} />
      </article>

      <article className="pi-block">
        <h3>오행구성</h3>
        <WuxingDist saju={saju} />
        <p className="pi-note">
          {missing.length > 0
            ? `${missing.join("·")} 기운이 하나도 없네. 이게 네 일이랑 관계에서 어떻게 튀어나오는지가 풀이 맨 앞 이야기고.`
            : "다섯 기운이 고루 있는 편이야. 그중 뭐가 진짜 힘을 쓰는지는 배합을 봐야 알고."}
        </p>
      </article>

      <article className="pi-block">
        <h3>사주팔자 기둥</h3>
        <PillarsGrid saju={saju} />
      </article>

      {yongsin && (yongsin.good.length > 0 || yongsin.bad.length > 0) && (
        <article className="pi-block">
          <h3>보약 기운 · 과부하 기운</h3>
          {/* 보약은 구슬로 크게 — 히어로의 일간 구슬과 같은 언어라 "내 것"이라는 감각이 이어진다.
              과부하는 같은 무게로 세우면 경고가 주인공이 되므로 작은 칩으로 물러나 있게 둔다. */}
          {yongsin.good.length > 0 ? (
            <ul className="pi-orbs">
              {yongsin.good.map((el) => {
                const meta = ELEMENT_META[el];
                return (
                  <li className="pi-orb" key={el}>
                    <ElementOrb el={el} className="el-orb--sm" />
                    <em>{meta.gist}</em>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="pi-ys-none">뚜렷한 보약 기운 없음</p>
          )}
          <dl className="pi-yongsin">
            <div className="pi-ys">
              <dt>과부하</dt>
              <dd>{yongsin.bad.length > 0 ? <ElementChips els={yongsin.bad} /> : <span className="pi-ys-none">뚜렷한 과부하 기운 없음</span>}</dd>
            </div>
          </dl>
          <p className="pi-note">
            보는 방식 세 가지를 겹쳐서 뽑았어. 한 가지만 쓰면 답이 갈리거든. 이 두 기운이 네 일·돈·관계·몸에서
            각각 어떻게 작동하는지가 풀이 여덟 갈래 전부가 딛고 선 바닥이고.
          </p>
        </article>
      )}

      {dayun.length > 0 && (
        <article className="pi-block">
          <h3>10년 단위 흐름</h3>
          <ol className="pi-dayun">
            {dayun.map((d, i) => (
              <li key={d.startYear} className={i === nowIdx ? "is-now" : ""}>
                <span className="pi-dy-age">{d.startAge}세</span>
                <span className="pi-dy-gz">{d.gan.ko}{d.zhi.ko}</span>
                <span className="pi-dy-year">{d.startYear}</span>
              </li>
            ))}
          </ol>
          {nowIdx >= 0 && (
            <p className="pi-note">
              지금은 {dayun[nowIdx].startAge}세부터 시작된 흐름을 지나는 중이야. 이게 언제 끝나고 다음에 뭐가 오는지도 풀이에서 따로 다뤄.
            </p>
          )}
        </article>
      )}
    </section>
  );
}
