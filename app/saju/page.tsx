"use client";

import { useEffect, useState } from "react";

type ReportResponse = {
  report: string;
  debug: { prompt: string; model: string; provider: string };
};

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
};

export default function PersonalSajuPage() {
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
        const res = await fetch("/api/saju/personal");
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saju/personal", { method: "POST" });
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
    ? { report: data.report, generatedAt: null as string | null, debug: data.debug }
    : saved
    ? { report: saved.report, generatedAt: saved.generatedAt, debug: null }
    : null;

  return (
    <main className="container">
      <h1>개인 사주 리포트</h1>

      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn--primary" onClick={generate} disabled={loading}>
          {loading ? "생성 중..." : view ? "다시 받기" : "리포트 생성"}
        </button>
        {view?.debug && (
          <button className="btn--ghost" onClick={() => setShowDebug((v) => !v)}>
            {showDebug ? "디버그 숨기기" : "디버그 보기"}
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {initializing && <div className="muted">불러오는 중...</div>}

      {view && (
        <>
          {view.generatedAt && (
            <div className="muted" style={{ marginBottom: 12 }}>
              저장된 리포트 · {new Date(view.generatedAt).toLocaleString("ko-KR")}
            </div>
          )}
          <section className="card">
            <div className="report">{view.report}</div>
          </section>

          {showDebug && view.debug && (
            <section className="card" style={{ marginTop: 16 }}>
              <div className="muted">model: {view.debug.provider} / {view.debug.model}</div>
              <h4>렌더된 프롬프트</h4>
              <pre className="debug-pre">{view.debug.prompt}</pre>
            </section>
          )}
        </>
      )}
    </main>
  );
}
