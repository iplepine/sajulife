"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildYongsinView, ELEMENT_META } from "@/lib/saju/yongsinView";
import { buildYongsinCheck, selectableYears } from "@/lib/saju/yongsinCheck";

/**
 * 용신 검증 — "네가 좋았던 해"와 "코드가 계산한 보약 기운"을 맞춰본다.
 * ★AI 호출 없음 — 전부 결정론 계산.★
 *
 * 용신 풀이를 아직 안 봤으면 먼저 그쪽으로 보낸다(검증은 '내 보약 기운이 뭔지'를
 * 알고 난 뒤에야 의미가 있으니까).
 */

const MAX_PICK = 3;

type ChartResponse = { saju: SajuResult | null; currentAge?: number; currentYear?: number };

export default function YongsinCheckPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [hasReading, setHasReading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [chartRes, readRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()),
          fetch("/api/saju/yongsin", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        setHasReading(!!readRes?.saved);
      } catch {
        /* 실패해도 아래에서 안내 화면으로 떨어진다 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const currentYear = chart?.currentYear ?? new Date().getFullYear();

  const view = useMemo(() => {
    if (!chart?.saju) return null;
    return buildYongsinView(chart.saju, chart.currentAge, currentYear);
  }, [chart, currentYear]);

  const years = useMemo(() => {
    if (!chart?.saju) return [];
    const birthYear = Number(chart.saju.input.birthDate.slice(0, 4));
    return selectableYears(birthYear, currentYear);
  }, [chart, currentYear]);

  const result = useMemo(() => {
    if (!view || picked.length === 0) return null;
    return buildYongsinCheck(view, picked, currentYear);
  }, [view, picked, currentYear]);

  function toggle(year: number) {
    setPicked((prev) => {
      if (prev.includes(year)) return prev.filter((y) => y !== year);
      if (prev.length >= MAX_PICK) return [...prev.slice(1), year];
      return [...prev, year];
    });
  }

  if (loading) return <main className="page"><PageLoading label="용신 검증을 준비하고 있어요" /></main>;

  if (!chart?.saju || !view) {
    return (
      <div className="page-narrow">
        <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
        <p className="muted mt3">용신은 만세력(생년월일시)을 근거로 계산돼요.</p>
        <Link href="/onboarding?next=/saju/yongsin-check" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>
          사주 정보 입력으로
        </Link>
      </div>
    );
  }

  const goodEls = [...view.primaryYong, ...view.helperYong];

  return (
    <div className="page yc-page">
      <div className="report-person-head">
        <div>
          <p className="yc-kicker">YONGSIN CHECK</p>
          <h2 className="h-app">용신, 진짜 맞나 맞춰보기</h2>
        </div>
        <PersonSwitcher nameOnly />
      </div>

      {!hasReading ? (
        <section className="yc-gate">
          <h3 className="yc-gate-title">먼저 네 용신부터 보고 와</h3>
          <p className="yc-gate-body">
            검증은 &lsquo;내 보약 기운이 뭔지&rsquo;를 알고 난 다음에 의미가 있어.
            용신 풀이를 한 번 보고 오면, 여기서 네가 좋았던 해랑 맞춰볼 수 있어.
          </p>
          <Link href="/saju/yongsin" className="btn btn-primary btn-block yc-gate-cta" style={{ textDecoration: "none" }}>
            내 용신 보러 가기 →
          </Link>
        </section>
      ) : (
        <>
          <section className="yc-intro">
            <p className="yc-intro-lead">
              네 보약 기운은{" "}
              {goodEls.length ? (
                goodEls.map((el, i) => (
                  <span key={el}>
                    {i > 0 && " · "}
                    <b style={{ color: `var(${ELEMENT_META[el].cssVar})` }}>{ELEMENT_META[el].label} 기운</b>
                  </span>
                ))
              ) : (
                <b>뚜렷하지 않아(균형형)</b>
              )}
              이야.
            </p>
            <p className="yc-intro-sub">
              몸이 제일 좋았던 해를 최대 {MAX_PICK}개 골라봐. 그 해에 진짜 이 기운이 들어와 있었는지 맞춰줄게.
            </p>
          </section>

          <section className="yc-picker" aria-label="좋았던 해 고르기">
            <span className="yc-picker-k">
              좋았던 해 {picked.length > 0 && <em>{picked.length}/{MAX_PICK}</em>}
            </span>
            <div className="yc-years" role="group" aria-label="연도 선택">
              {years.map((y) => {
                const on = picked.includes(y);
                const age = chart.currentAge != null ? chart.currentAge + (y - currentYear) : null;
                return (
                  <button
                    key={y}
                    type="button"
                    className={`yc-year${on ? " on" : ""}`}
                    onClick={() => toggle(y)}
                    aria-pressed={on}
                  >
                    <b>{y}</b>
                    {age != null && <small>{age}세</small>}
                  </button>
                );
              })}
            </div>
          </section>

          {result && (
            <section className={`yc-result yc-result--${result.tone}`} aria-live="polite">
              <h3 className="yc-result-title">{result.headline}</h3>
              <p className="yc-result-body">{result.body}</p>

              <div className="yc-cards">
                {result.years.map((yc) => (
                  <article key={yc.year} className={`yc-card yc-card--${yc.verdict === "보약" || yc.verdict === "혼재" ? "hit" : yc.verdict === "과부하" ? "bad" : "mid"}`}>
                    <div className="yc-card-head">
                      <b>{yc.year}년</b>
                      {yc.age != null && <small>{yc.age}세</small>}
                      <span className="yc-card-tag">{yc.verdict}</span>
                    </div>
                    <div className="yc-card-els">
                      <span className="yc-card-el" style={{ background: `var(${ELEMENT_META[yc.stemEl].cssVar}-bg)`, color: `var(${ELEMENT_META[yc.stemEl].cssVar})` }}>
                        {ELEMENT_META[yc.stemEl].label}
                      </span>
                      <span className="yc-card-el" style={{ background: `var(${ELEMENT_META[yc.branchEl].cssVar}-bg)`, color: `var(${ELEMENT_META[yc.branchEl].cssVar})` }}>
                        {ELEMENT_META[yc.branchEl].label}
                      </span>
                      {yc.daewoonEls.length > 0 && (
                        <span className="yc-card-dae">
                          10년 흐름 {[...new Set(yc.daewoonEls)].map((e) => ELEMENT_META[e].label).join("·")}
                        </span>
                      )}
                    </div>
                    <p className="yc-card-note">{yc.note}</p>
                  </article>
                ))}
              </div>

              <p className="yc-fine">
                용신은 유파에 따라 갈리는 추정이야. &lsquo;운명 등급&rsquo;이 아니라 방향을 잡는 참고로 봐.
              </p>
              <Link href="/saju/yongsin" className="btn btn-ghost btn-sm yc-more" style={{ textDecoration: "none" }}>
                내 용신 풀이 다시 보기
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}
