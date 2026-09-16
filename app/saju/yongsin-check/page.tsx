"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildYongsinView, ELEMENT_META } from "@/lib/saju/yongsinView";
import { buildYongsinCheck, selectableYears } from "@/lib/saju/yongsinCheck";
import { sharedGet } from "@/lib/net/sharedGet";

/**
 * 용신 검증 — "네가 좋았던 해"와 "코드가 계산한 보약 기운"을 맞춰본다.
 * ★AI 호출 없음 — 전부 결정론 계산.★
 *
 * ★AI 풀이 저장본을 요구하지 않는다.★ 예전엔 "먼저 네 용신부터 보고 와"라며 /saju/yongsin으로
 * 보냈는데, 그 화면은 AI 없이 용신을 보여주고 끝난다. 검증은 AI 풀이 저장본이 있어야 열렸으므로
 * 안내대로 보고 돌아와도 계속 막혔다(막다른 순환). 검증에 필요한 건 결정론 계산(buildYongsinView)뿐이고,
 * 이 화면이 맨 위에서 "네 보약 기운은 ○ 기운이야"를 직접 알려준다. 더 궁금하면 보조 링크로 보낸다.
 */

const MAX_PICK = 3;

type ChartResponse = { saju: SajuResult | null; currentAge?: number; currentYear?: number };

export default function YongsinCheckPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  // 조회 실패를 "사주 정보 없음"으로 보내지 않기 위해 따로 둔다.
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<number[]>([]);

  async function load() {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await sharedGet("/api/saju/chart");
      if (!res.ok) throw new Error(String(res.status));
      setChart((await res.json()) as ChartResponse);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
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

  if (loadFailed) {
    return (
      <div className="page-narrow">
        <div className="load-failure mt5" role="status">
          <strong>사주 정보를 불러오지 못했어요</strong>
          <span>네트워크가 잠깐 흔들렸을 수 있어. 입력해 둔 정보는 그대로 있어.</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()}>다시 시도</button>
        </div>
      </div>
    );
  }

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
      <div className="report-person-head report-person-head--stack">
        <div>
          <p className="yc-kicker">YONGSIN CHECK</p>
          <h2 className="h-app">용신, 진짜 맞나 맞춰보기</h2>
        </div>
        <PersonSwitcher nameOnly />
      </div>

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
            <p className="yc-intro-sub">
              왜 이 기운인지 먼저 보고 싶으면{" "}
              <Link href="/saju/yongsin" className="link-tiny">용신 보기 →</Link>
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
    </div>
  );
}
