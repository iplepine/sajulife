"use client";

import { useEffect, useState } from "react";
import type { TciScore, TciSubscaleScore } from "@/lib/tci/scoring";

type ReportResponse = {
  report: string;
  scores: TciScore[];
  debug: { prompt: string; model: string; provider: string };
};

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { scores?: TciScore[] };
};

const BAR_EL = ["fire", "water", "wood", "earth", "metal"];

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
    ? { report: data.report, scores: data.scores, generatedAt: null as string | null, debug: data.debug }
    : saved
    ? { report: saved.report, scores: saved.meta?.scores ?? [], generatedAt: saved.generatedAt, debug: null }
    : null;

  return (
    <div className="page">
      <div className="row between">
        <h2 className="h-app">기질 리포트</h2>
        <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
          {loading ? "생성 중…" : view ? "다시 생성" : "리포트 생성"}
        </button>
      </div>
      <div className="ai-tag mt2"><span className="dot" />AI 분석 · TCI 7차원</div>

      {error && <p className="error mt4">{error}</p>}
      {initializing && <p className="muted mt4">불러오는 중...</p>}

      {view && (
        <>
          {view.generatedAt && (
            <p className="muted mt3">저장된 리포트 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}

          {view.scores.length > 0 && (
            <>
              <p className="h-sec mt5">7가지 성격 차원</p>
              {view.scores.map((s, i) => {
                const color = `var(--el-${BAR_EL[i % BAR_EL.length]})`;
                return (
                  <div key={s.dimension}>
                    <div className="barrow">
                      <span className="lbl">{s.label}</span>
                      <div className="track">
                        <span style={{ width: `${s.percent}%`, background: color }} />
                      </div>
                      <span className="val">{s.percent}</span>
                    </div>
                    {s.subscales && s.subscales.length > 0 && (
                      <div className="subbars">
                        {s.subscales.map((sub: TciSubscaleScore) => (
                          <div className="subbar" key={sub.code} title={sub.description}>
                            <span className="lbl">{sub.label}</span>
                            <div className="track">
                              <span style={{ width: `${sub.percent}%`, background: color, opacity: 0.65 }} />
                            </div>
                            <span className="val">{sub.percent}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <div className="report mt5">{view.report}</div>

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
