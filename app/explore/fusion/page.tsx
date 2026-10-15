"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExploreHero, HowBlock } from "@/components/explore/parts";
import { trackEvent } from "@/lib/analytics";
import { calendarTheme, isThemeSeason, themeForSaju, type ThemeSeason } from "@/lib/saju/seasonTheme";
import type { SajuResult } from "@/lib/saju/calculator";
import { sharedGet } from "@/lib/net/sharedGet";
import type { PackageInfo } from "@/lib/package/client";
import { isBeforeStart, nextJourneyStep } from "@/lib/package/journey";
import { formatWon, PACKAGE_STEPS, SAJU_TCI_PACKAGE } from "@/lib/package/product";

/**
 * 사주+기질 풀이(대표 상품) 소개 — 시작 전인 사람이 홈의 큰 버튼을 누르면 여기로 온다(lib/package/journey.ts PACKAGE_INTRO_HREF).
 *
 * 2026-10-15 대표 피드백: 홈 버튼이 바로 결제 화면으로 넘어가니 뭘 하는 건지 모른 채 넘어간다.
 * 그래서 이 화면은 두 가지만 말한다 — ①이렇게 진행된다(세 단계에서 내가 할 일과 받는 것) ②이런 풀이가 나온다(예시).
 * 시작 버튼("4,900원에 한번에 보기")은 아래에 떠 있다가 화면 끝에서 제자리에 앉는다.
 *
 * 다음 걸음은 홈과 같은 lib/package/journey.ts가 정한다 — 결제 전이면 결제로, 베타 무료면 사주 정보 입력으로,
 * 이미 시작했으면 빠진 단계로. 상태 조회가 실패하면 결제·생성으로 밀지 않는다.
 */

/** 세 단계마다 '내가 할 일'과 '받는 것'. 단계 이름은 홈·결제 화면과 같은 PACKAGE_STEPS에서 가져온다. */
const FLOW_DETAIL: Record<1 | 2 | 3, { tag: string; does: string; gets: string }> = {
  1: {
    tag: "평생 흐름",
    does: "생년월일이랑 태어난 시각만 넣어. 1분이면 돼.",
    gets: "타고난 결부터 일·돈·사람·건강, 10년 단위 흐름까지 평생 판을 먼저 받아.",
  },
  2: {
    tag: "35문항 · 약 3분",
    does: "질문 35개에 요즘의 너대로 답해. 정답은 없어.",
    gets: "요즘 네가 어떻게 반응하는지 일곱 갈래로 재. 이게 올해 운세의 재료야.",
  },
  3: {
    tag: "본편",
    does: "검사를 마치면 바로 이어서 만들어 줄게.",
    gets: "원래의 너에 요즘의 너를 겹쳐 올해 남은 달과 내년에 준비할 것까지 짚어 줘.",
  },
};

/**
 * 결과 예시 — ★가상의 인물★로 쓴 글이다. 실제 누구의 풀이도, 보고 있는 사람의 풀이도 아니다.
 * 내 데이터로 계산한 미리보기(LockedPreview)는 시작 전인 사람에겐 보여줄 재료가 없어서,
 * "받게 될 풀이가 이런 결이다"를 예시로 보여주되 카드마다 '예시'를 붙여 자기 풀이로 오해하지 않게 한다.
 * 섹션 이름은 실제 풀이와 같다 — 개인은 ReportView PERSONAL_SECTION_TITLES, 올해 운세는 프롬프트 v30 여덟 섹션.
 */
const SAMPLE_PERSONAL = {
  title: "늦봄 들판에 뿌리내린 큰 나무 같은 사람",
  keywords: ["뚝심 만렙", "혼자 다 짊어짐", "늦게 터지는 타입"],
  section: "너라는 사람",
  lead: "한번 뿌리내리면 태풍에도 안 뽑히는 사람이야. 대신 기대는 법을 몰라.",
  body: [
    "남들이 포기할 때 한 번 더 버티는 게 너야. 이건 노력이 아니라 타고난 결이라 평생 안 바뀌어.",
    "문제는 도와달라는 말이 목에 걸린다는 거. 일이 커질수록 혼자 밤새지? 그 버릇만 고치면 판이 두 배로 커져.",
  ],
  more: ["타고난 기운 배합", "일이 풀리는 자리", "돈이 붙고 새는 자리", "사람과 부딪히는 자리", "몸이 먼저 아는 것", "인생의 계절", "길게 보는 판"],
} as const;

const SAMPLE_FUSION = [
  { k: "원래는", src: "사주로 보면", v: "늦봄의 큰 나무야. 천천히 뿌리부터 내리고, 한번 정하면 잘 안 흔들려." },
  { k: "요즘은", src: "기질 검사로 보면", v: "추진성은 바짝 올라 있고 안정성은 바닥이야. 뿌리보다 가지가 먼저 뻗는 중이라, 벌여 놓은 일이 많지?" },
  { k: "그래서 올해는", src: "", v: "원래 속도보다 빨리 달린 해야. 남은 달은 새로 벌이지 말고, 벌인 걸 거두는 데 써." },
  { k: "내년엔", src: "", v: "바람이 '속도'에서 '다지기'로 바뀌어. 할 일 목록을 지금 반으로 줄여 둬. 그러면 내년엔 네 뚝심이 제대로 먹혀." },
] as const;

// 프롬프트 v30·검증기(lib/fusion/reportQuality.ts)의 여덟 섹션과 같은 순서.
const FUSION_SECTIONS = [
  "먼저 결론", "원래의 너", "요즘의 너", "겹치는 곳과 어긋나는 곳",
  "올해 흐름", "올해 남은 달", "내년 미리보기", "세 가지 실행",
] as const;

type Chart = { saju: SajuResult | null; name?: string; currentYear?: number };

/** 아래 시작 버튼의 상태. disabled면 링크 대신 눌리지 않는 버튼으로 그린다. */
type StartState = { href: string; label: string; note: string; price?: string; disabled?: boolean; intro?: boolean };

export default function FusionIntroPage() {
  const [chart, setChart] = useState<Chart | null>(null);
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
      const [chartRes, pkgRes] = await Promise.all([
        readJson<Chart>("/api/saju/chart"),
        readJson<PackageInfo>("/api/package"),
      ]);
      if (!alive) return;
      setPkg(pkgRes);
      setChart(chartRes ?? { saju: null });
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const season = saju ? themeForSaju(saju, currentYear) : (rootSeason ?? calendarTheme());

  const journey = pkg ? nextJourneyStep(pkg.state) : null;
  const price = formatWon(pkg?.product.price ?? SAJU_TCI_PACKAGE.price);
  const start: StartState = !loaded
    ? { href: "#", label: "준비 중…", note: "", disabled: true }
    : pkg?.state.fusion.saved
      ? { href: "/fusion", label: "내 올해 운세 보기", note: "이미 열어둔 풀이예요. 언제든 다시 볼 수 있어요." }
      : !pkg || !journey
        ? { href: "/fusion", label: "내 풀이 화면으로", note: "지금 풀이 상태를 불러오지 못했어요. 풀이 화면에서 다시 확인해 주세요." }
        : !isBeforeStart(journey, pkg.payment)
          ? { href: journey.href, label: journey.label, note: journey.note }
          : pkg.payment === "free"
            ? {
                href: journey.href,
                label: "무료로 한번에 보기",
                price: `세 단계 한 번에 · 정가 ${price}, 지금은 베타 무료`,
                note: "베타 기간에는 결제 없이 바로 시작해요. 유료로 바뀌기 전에 미리 알려드릴게요.",
                intro: true,
              }
            : pkg.payment === "unavailable"
              ? { href: journey.href, label: "결제 준비 중", price: `세 단계 한 번에 · ${price}`, note: "결제를 준비하고 있어요. 조금만 기다려 주세요.", disabled: true }
              : {
                  href: journey.href,
                  label: `${price}에 한번에 보기`,
                  price: "사주 풀이 + 기질 검사 + 올해 운세",
                  note: "결제는 다음 화면에서 해요. 첫 풀이가 만들어지기 전에는 전액 환불돼요.",
                  intro: true,
                };

  const orbit = saju
    ? [
        saju.pillars.year.gan.hanja, saju.pillars.year.zhi.hanja,
        saju.pillars.month.gan.hanja, saju.pillars.month.zhi.hanja,
        saju.pillars.day.zhi.hanja,
        ...(saju.pillars.time ? [saju.pillars.time.gan.hanja, saju.pillars.time.zhi.hanja] : []),
      ]
    : undefined;

  return (
    <main className="page intro-page pi-page fi-page">
      <ExploreHero
        titleId="fi-title"
        eyebrow="사주 + 기질 통합 풀이"
        title={<>타고난 나와 요즘의 나,<br />겹쳐서 올해를</>}
        lead="사주는 평생 안 바뀌는 원래의 너고, 기질 검사는 지금의 너야. 둘을 겹쳐야 올해가 정확하게 보여."
        season={season}
        ready={loaded || rootSeason !== null}
        center={saju?.dayMaster.hanja}
        orbit={orbit}
      />

      <section className="fi-block" aria-labelledby="fi-flow-title">
        <p className="fi-k">이렇게 진행돼</p>
        <h2 id="fi-flow-title">세 단계, 한 번에 이어서</h2>
        <ol className="fi-steps">
          {PACKAGE_STEPS.map((step) => {
            const detail = FLOW_DETAIL[step.step];
            return (
              <li key={step.step} className="fi-step">
                <span className="fi-step-no" aria-hidden>{step.step}</span>
                <div className="fi-step-copy">
                  <p className="fi-step-title"><strong>{step.title}</strong><span>{detail.tag}</span></p>
                  <p className="fi-step-does">{detail.does}</p>
                  <p className="fi-step-gets">{detail.gets}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="fi-foot">풀이는 만드는 데 조금 걸려. 다 되면 알림으로 알려줄게.</p>
      </section>

      <section className="fi-block" aria-labelledby="fi-samples-title">
        <p className="fi-k">이런 풀이가 나와</p>
        <h2 id="fi-samples-title">받게 될 두 가지 풀이</h2>
        <p className="fi-samples-note">아래는 가상의 인물로 쓴 예시야. 네 풀이는 네 사주와 검사 답으로 새로 써.</p>

        <article className="fi-sample" aria-labelledby="fi-sample-personal">
          <header className="fi-sample-head">
            <span className="fi-sample-badge">예시</span>
            <h3 id="fi-sample-personal">사주 풀이</h3>
            <span className="fi-sample-tag">1단계 · 평생 흐름</span>
          </header>
          <p className="fi-sample-title">{SAMPLE_PERSONAL.title}</p>
          <ul className="fi-sample-keywords" aria-label="예시 키워드">
            {SAMPLE_PERSONAL.keywords.map((k) => <li key={k}>{k}</li>)}
          </ul>
          <div className="rv rv--json fi-sample-report">
            <details className="rv-sec" open>
              <summary className="rv-h rv-h--with-lead">
                <span className="rv-h-copy">
                  <span className="t">{SAMPLE_PERSONAL.section}</span>
                  <span className="rv-h-lead">{SAMPLE_PERSONAL.lead}</span>
                </span>
              </summary>
              <div className="rv-body">
                {SAMPLE_PERSONAL.body.map((p) => <p key={p} className="rv-p">{p}</p>)}
              </div>
            </details>
          </div>
          <p className="fi-sample-more-k">이어서 일곱 갈래</p>
          <ul className="fi-sample-more">
            {SAMPLE_PERSONAL.more.map((name) => <li key={name}>{name}</li>)}
          </ul>
        </article>

        <article className="fi-sample fi-sample--main" aria-labelledby="fi-sample-fusion">
          <header className="fi-sample-head">
            <span className="fi-sample-badge">예시</span>
            <h3 id="fi-sample-fusion">사주+기질 올해 운세</h3>
            <span className="fi-sample-tag">3단계 · 본편</span>
          </header>
          <ol className="fi-beats">
            {SAMPLE_FUSION.map((beat) => (
              <li key={beat.k}>
                <p className="fi-beat-k">{beat.k}{beat.src && <small>{beat.src}</small>}</p>
                <p className="fi-beat-v">{beat.v}</p>
              </li>
            ))}
          </ol>
          <p className="fi-sample-more-k">실제 풀이는 여덟 갈래로</p>
          <ul className="fi-sample-more">
            {FUSION_SECTIONS.map((name) => <li key={name}>{name}</li>)}
          </ul>
        </article>
      </section>

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

      {/* 시작 버튼 — 스크롤하는 동안 아래에 떠 있다가, 화면 끝에 오면 제자리에 앉는다(position: sticky). */}
      <div className="fi-start" role="region" aria-label="사주+기질 풀이 시작">
        {start.price && <p className="fi-start-price">{start.price}</p>}
        {start.disabled ? (
          <button type="button" className="btn btn-primary btn-block fi-start-btn" disabled>{start.label}</button>
        ) : (
          <Link
            href={start.href}
            className="btn btn-primary btn-block fi-start-btn"
            style={{ textDecoration: "none" }}
            onClick={() => {
              if (start.intro && pkg && journey) trackEvent("package_intro_started", { mode: pkg.payment, step: journey.key });
            }}
          >
            {start.label} <span aria-hidden>→</span>
          </Link>
        )}
      </div>
      {start.note && <p className="fi-start-note">{start.note}</p>}
    </main>
  );
}
