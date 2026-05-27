"use client";

import { useEffect, useState } from "react";

type ReportResponse = {
  report: string;
  debug: { prompt: string; model: string; provider: string };
};

export default function PersonalSajuPage() {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void generate(); }, []);

  return (
    <main className="container">
      <h1>개인 사주 리포트</h1>

      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn--primary" onClick={generate} disabled={loading}>
          {loading ? "생성 중..." : "다시 생성"}
        </button>
        <button className="btn--ghost" onClick={() => setShowDebug((v) => !v)}>
          {showDebug ? "디버그 숨기기" : "디버그 보기"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {data && (
        <>
          <section className="card">
            <div className="report">{data.report}</div>
          </section>

          {showDebug && (
            <section className="card" style={{ marginTop: 16 }}>
              <div className="muted">model: {data.debug.provider} / {data.debug.model}</div>
              <h4>렌더된 프롬프트</h4>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{data.debug.prompt}</pre>
            </section>
          )}
        </>
      )}
    </main>
  );
}
