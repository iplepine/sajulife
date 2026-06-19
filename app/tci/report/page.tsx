"use client";

import { useEffect, useState } from "react";
import ReportView from "@/components/ReportView";
import TciRadar, { type RadarAxis } from "@/components/TciRadar";
import type { TciScore, TciSubscaleScore } from "@/lib/tci/scoring";

type ReportResponse = {
  report: string;
  scores: TciScore[];
  flexibility?: number;
  debug: { prompt: string; model: string; provider: string };
};

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { scores?: TciScore[]; flexibility?: number };
};

/** 7차원 점수 + 유연성(AI)을 레이더 8축으로. 유연성 없으면 7축. */
function buildRadarAxes(scores: TciScore[], flexibility?: number): RadarAxis[] {
  const axes: RadarAxis[] = scores.map((s) => ({ key: s.dimension, label: s.label, percent: s.percent }));
  if (typeof flexibility === "number") {
    axes.push({ key: "FLEX", label: "유연성", percent: flexibility });
  }
  return axes;
}

const TEMPERAMENT = new Set(["NS", "HA", "RD", "PS"]);

function levelLabel(p: number): string {
  if (p < 20) return "매우 낮음";
  if (p < 40) return "낮음";
  if (p < 65) return "보통";
  if (p < 85) return "높음";
  return "매우 높음";
}

export default function TciReportPage() {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tci/report");
        const d = await res.json();
        if (cancelled) return;
        if (d.saved) {
          setSaved(d.saved);
          setInitializing(false);
        } else {
          setInitializing(false);
          void generate();
        }
      } catch {
        setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tci/report", { method: "POST" });
      const text = await res.text();
      let d: ReportResponse | { error?: string } = {};
      try { d = text ? JSON.parse(text) : {}; }
      catch { d = { error: `서버 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 200)}` }; }
      if (!res.ok) { setError(("error" in d && d.error) || `리포트 생성 실패 (HTTP ${res.status})`); return; }
      setData(d as ReportResponse);
      setSaved(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const view = data
    ? { report: data.report, scores: data.scores, flexibility: data.flexibility, generatedAt: null as string | null, debug: data.debug }
    : saved
    ? { report: saved.report, scores: saved.meta?.scores ?? [], flexibility: saved.meta?.flexibility, generatedAt: saved.generatedAt, debug: null }
    : null;

  return (
    <div className="page">
      <div className="row between">
        <h2 className="h-app">기질 리포트</h2>
        <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
          {loading ? "생성 중…" : view ? "다시 생성" : "리포트 생성"}
        </button>
      </div>
      <div className="ai-tag mt2"><span className="dot" />AI 분석 · TCI 7차원 + 유연성</div>

      {error && <p className="error mt4">{error}</p>}
      {initializing && <p className="muted mt4">불러오는 중...</p>}

      {view && (
        <>
          {view.generatedAt && (
            <p className="muted mt3">저장된 리포트 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}

          {view.scores.length > 0 && (
            <>
              <p className="h-sec mt5">기질 한눈에</p>
              <p className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
                중앙에 가까울수록 낮고, 바깥으로 돌출될수록 그 기질이 강해요. 점선은 균형선(50%).
              </p>
              <div className="card" style={{ padding: "10px 8px 6px" }}>
                <TciRadar axes={buildRadarAxes(view.scores, view.flexibility)} />
              </div>

              <p className="h-sec mt5">차원별 점수</p>
              <p className="tci-legend">
                <span className="tci-legend-band" aria-hidden /> 보통 범위(35–65%)
                <span className="sep">·</span>
                <span className="tci-legend-tick" aria-hidden /> 평균선(50%)
              </p>

              {(["기질", "성격"] as const).map((groupKey) => {
                const rows = view.scores.filter((s) =>
                  groupKey === "기질" ? TEMPERAMENT.has(s.dimension) : !TEMPERAMENT.has(s.dimension),
                );
                if (rows.length === 0) return null;
                const sub = groupKey === "기질" ? "타고난 반응 성향 · 4축" : "스스로 가꿔온 영역 · 3축";
                return (
                  <div className="tci-group mt3" key={groupKey}>
                    <div className="tci-group-head">
                      <span className="tci-group-title">{groupKey}</span>
                      <span className="tci-group-sub">{sub}</span>
                    </div>
                    {rows.map((s) => (
                      <div key={s.dimension}>
                        <div className="barrow tci-row">
                          <span className="lbl" title={s.description}>{s.label}</span>
                          <div className="track tci-track">
                            <span style={{ width: `${s.percent}%` }} />
                          </div>
                          <span className="val tci-val">
                            {s.percent}
                            <span className="lvl">{levelLabel(s.percent)}</span>
                          </span>
                        </div>
                        {s.subscales && s.subscales.length > 0 && (
                          <div className="subbars">
                            {s.subscales.map((sub: TciSubscaleScore) => (
                              <div className="subbar tci-subrow" key={sub.code} title={sub.description}>
                                <span className="lbl">{sub.label}</span>
                                <div className="track tci-track">
                                  <span style={{ width: `${sub.percent}%` }} />
                                </div>
                                <span className="val">{sub.percent}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              {typeof view.flexibility === "number" && (
                <div className="tci-group mt3">
                  <div className="tci-group-head">
                    <span className="tci-group-title">유연성</span>
                    <span className="tci-group-sub">상황 적응력 · AI 추정 1축</span>
                  </div>
                  <div className="barrow tci-row">
                    <span
                      className="lbl"
                      title="상황·관점·계획을 얼마나 잘 바꾸고 적응하는가 — 7차원 패턴으로 AI가 추정"
                    >
                      유연성
                    </span>
                    <div className="track tci-track">
                      <span style={{ width: `${view.flexibility}%` }} />
                    </div>
                    <span className="val tci-val">
                      {view.flexibility}
                      <span className="lvl">{levelLabel(view.flexibility)}</span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <ReportView className="mt5" text={view.report} />

          {view.debug && (
            <button className="btn btn-ghost btn-sm mt5" onClick={() => setShowDebug((v) => !v)}>
              {showDebug ? "디버그 숨기기" : "디버그 보기"}
            </button>
          )}
          {showDebug && view.debug && (
            <div className="card mt3">
              <div className="muted">model: {view.debug.provider} / {view.debug.model}</div>
              <h4>렌더된 프롬프트</h4>
              <pre className="debug-pre">{view.debug.prompt}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
