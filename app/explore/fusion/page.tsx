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
import { PERSONAL_REPORT_SECTION_IDS } from "@/lib/report/personalContract";
import { FUSION_SECTION_TITLES } from "@/lib/fusion/reportContract";
import styles from "../ExploreStudio.module.css";

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
    tag: "사주 관점의 기초 풀이",
    does: "생년월일이랑 태어난 시각만 넣어. 1분이면 돼.",
    gets: "타고난 특징과 강점, 조후·격국·억부, 인생 흐름과 올해·내년의 준비 방향을 먼저 살펴봐.",
  },
  2: {
    tag: "35문항 · 약 3분",
    does: "질문 35개에 평소 모습에 맞춰 답해. 정답은 없어.",
    gets: "기질 네 차원과 성격 세 차원을 구분해 응답 경향을 살펴봐. 한 번의 응답으로 과거와의 변화를 단정하지 않아.",
  },
  3: {
    tag: "최종 통합 리포트",
    does: "검사를 마치면 바로 이어서 만들어 줄게.",
    gets: "사주와 설문을 함께 읽어 강점·반복 패턴·나에게 맞는 선택을 정리해. 올해·내년 흐름도 그 안에서 연결해.",
  },
};

/**
 * 결과 예시 — ★가상의 인물★로 쓴 글이다. 실제 누구의 풀이도, 보고 있는 사람의 풀이도 아니다.
 * 내 데이터로 계산한 미리보기(LockedPreview)는 시작 전인 사람에겐 보여줄 재료가 없어서,
 * "받게 될 풀이가 이런 결이다"를 예시로 보여주되 카드마다 '예시'를 붙여 자기 풀이로 오해하지 않게 한다.
 * 목차는 신규 개인·통합 리포트의 공통 계약에서 가져온다.
 */
const SAMPLE_PERSONAL = {
  title: "늦봄 들판에 뿌리내린 큰 나무 같은 사람",
  keywords: ["성장의 방향", "지탱하는 기반", "함께 쓰는 경험"],
  section: PERSONAL_REPORT_SECTION_IDS[0],
  lead: "크게 뻗는 방향과 그 성장을 받치는 기반을 함께 읽어볼 수 있습니다.",
  body: [
    "늦봄의 들판에 뿌리내린 큰 나무의 이미지를 떠올려봅니다. 어디로 자랄지 정하는 일과 그 방향을 오래 지탱할 조건을 함께 살피는 관점입니다.",
    "이 해석을 실제 생활에 대조한다면, 중요한 일을 꾸준히 이어가는 방식과 다른 사람에게 도움을 구하는 방식을 함께 돌아볼 수 있습니다. 출생 정보가 실제 경험이나 능력을 확정해 주는 것은 아닙니다.",
  ],
  more: PERSONAL_REPORT_SECTION_IDS.slice(1),
} as const;

const SAMPLE_FUSION = [
  { k: "사주의 관점", src: "방향과 기반", v: "큰 나무가 뻗는 방향과 그 성장을 받치는 조건을 함께 살펴보는 그림이야." },
  { k: "설문에서 보이는 반응", src: "이번 응답의 경향", v: "이 가상 인물은 위험을 살피고 일을 끝까지 붙드는 응답이 두드러져. 과거보다 조심스러워졌다는 뜻은 아니야." },
  { k: "함께 읽는 선택", src: "실제 고민에 적용", v: "결정을 늦추는 상황이라면 더 확인할 정보가 있는지, 충분히 검토한 일을 끝낼 기준이 없는지 나눠볼 수 있어." },
  { k: "가까운 시기의 방향", src: "올해·내년도 함께", v: "운세는 이 선택을 시기에 적용하는 참고 관점이야. 큰 성과를 약속하기보다 작게 실행하고 실제 결과를 확인하는 방향으로 읽어." },
] as const;

const FUSION_SECTIONS = FUSION_SECTION_TITLES.map(title => title.replace(/^▣\s*/, ""));

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
      ? { href: "/fusion", label: "내 최종 통합 풀이 보기", note: "이미 열어둔 풀이예요. 언제든 다시 볼 수 있어요." }
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
                  price: "사주 풀이 + 기질 검사 + 최종 통합 리포트",
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
    <main className={`page intro-page pi-page fi-page ${styles.page}`}>
      <ExploreHero
        titleId="fi-title"
        eyebrow="사주 + 기질 통합 풀이"
        title={<>사주와 기질을 함께 읽어,<br />나에게 맞는 선택으로</>}
        lead="사주의 해석과 설문 응답을 함께 살펴 강점과 반복 패턴, 삶의 방향을 정리해. 올해·내년 운세는 그 안에서 함께 읽어."
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
            <span className="fi-sample-tag">1단계 · 사주 관점</span>
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
          <p className="fi-sample-more-k">이어서 살펴볼 항목</p>
          <ul className="fi-sample-more">
            {SAMPLE_PERSONAL.more.map((name) => <li key={name}>{name}</li>)}
          </ul>
        </article>

        <article className="fi-sample fi-sample--main" aria-labelledby="fi-sample-fusion">
          <header className="fi-sample-head">
            <span className="fi-sample-badge">예시</span>
            <h3 id="fi-sample-fusion">사주+기질 최종 리포트</h3>
            <span className="fi-sample-tag">3단계 · 통합</span>
          </header>
          <ol className="fi-beats">
            {SAMPLE_FUSION.map((beat) => (
              <li key={beat.k}>
                <p className="fi-beat-k">{beat.k}{beat.src && <small>{beat.src}</small>}</p>
                <p className="fi-beat-v">{beat.v}</p>
              </li>
            ))}
          </ol>
          <p className="fi-sample-more-k">최종 리포트에서 함께 읽을 항목</p>
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
          { t: "사주와 설문은 서로 다른 관점이야", d: "사주는 상징적인 해석이고 설문은 자신의 응답이야. 둘을 함께 읽되 같은 종류의 측정값으로 취급하지 않아." },
          { t: "기질 네 차원과 성격 세 차원을 구분해", d: "평소 반응과 자신을 조절하는 방식을 함께 살펴봐. 한 번 답한 결과로 과거 대비 변화나 스트레스의 영향을 단정하지 않아." },
          { t: "최종 리포트는 나를 이해하고 선택하는 데 써", d: "강점·반복 패턴과 일·돈·관계의 선택을 정리하고, 올해·내년 흐름은 그 안의 한 부분으로 연결해." },
        ]}
        close="두 관점을 함께 살피고, 실제 경험에 맞는 선택을 찾아봐."
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
