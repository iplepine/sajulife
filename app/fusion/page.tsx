"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LifeCircle from "@/components/LifeCircle";
import ReportView from "@/components/ReportView";
import GenerateLoading from "@/components/GenerateLoading";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";

const FUSION_MESSAGES = [
  "기질 검사 결과를 정리하는 중이에요…",
  "사주의 타고난 결과 맞춰보는 중이에요…",
  "둘을 겹쳐 하나의 해석으로 엮는 중이에요…",
  "당신에게 맞는 말로 풀어쓰는 중이에요…",
];

type ReportResponse = { report: string; scores: TciScore[]; debug: { prompt: string; model: string; provider: string } };
type SavedShape = { report: string; generatedAt: string; provider: string; model: string; meta?: { scores?: TciScore[] } };
type ChartResponse = { saju: SajuResult | null; currentYear?: number };

export default function FusionPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
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
        const [chartRes, reportRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()).catch(() => ({ saju: null })),
          fetch("/api/fusion/report").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        if (reportRes.saved) { setSaved(reportRes.saved); setInitializing(false); }
        else { setInitializing(false); void generate(); }
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
      const res = await fetch("/api/fusion/report", { method: "POST" });
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

  const saju = chart?.saju ?? null;
  const dm = saju?.dayMaster;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const birthYear = saju ? Number(saju.input.birthDate.split("-")[0]) || 0 : 0;

  // 사주 핵심: 일간 + 현재 대운 오행
  let curEl = "";
  if (saju && saju.daewoon.length) {
    const age = currentYear - birthYear;
    let i = 0;
    for (let k = 0; k < saju.daewoon.length; k++) if (saju.daewoon[k].startAge <= age) i = k;
    curEl = saju.daewoon[i].gan.wuxing;
  }
  const sajuCore = dm ? `${dm.ko}${curEl ? ` · ${curEl} 대운` : ""}` : "사주 정보 필요";

  // 기질 핵심: 상위 3개 차원 라벨
  const tciCore = view && view.scores.length
    ? [...view.scores].sort((a, b) => b.percent - a.percent).slice(0, 3).map((s) => s.label).join(" · ")
    : "기질 검사 필요";

  return (
    <div className="page">
      <h2 className="h-app">사주 × 기질 융합</h2>
      <div className="ai-tag mt2"><span className="dot" />TCI 7차원 + 생애 사주 종합 해석</div>

      {error && <p className="error mt4">{error}</p>}
      {initializing && <p className="muted mt4">불러오는 중...</p>}

      <div className="report-grid mt5">
        <div>
          <div className="row gap3" style={{ flexWrap: "nowrap" }}>
            <div className="card" style={{ flex: 1, padding: 12 }}>
              <div className="muted" style={{ fontSize: 11 }}>기질 핵심</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{tciCore}</div>
            </div>
            <div className="card" style={{ flex: 1, padding: 12 }}>
              <div className="muted" style={{ fontSize: 11 }}>사주 핵심</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{sajuCore}</div>
            </div>
          </div>

          {loading ? (
            <GenerateLoading messages={FUSION_MESSAGES} className="mt4" />
          ) : view ? (
            <>
              {view.generatedAt && (
                <p className="muted mt4">저장된 리포트 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
              )}
              <ReportView className="mt4" text={view.report} />
              <div className="row gap2 mt4">
                <button className="btn btn-ghost btn-sm" onClick={generate}>다시 생성</button>
                {view.debug && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowDebug((v) => !v)}>{showDebug ? "디버그 숨기기" : "디버그 보기"}</button>
                )}
              </div>
              {showDebug && view.debug && (
                <div className="card mt3">
                  <div className="muted">model: {view.debug.provider} / {view.debug.model}</div>
                  <h4>렌더된 프롬프트</h4>
                  <pre className="debug-pre">{view.debug.prompt}</pre>
                </div>
              )}
            </>
          ) : null}
        </div>

        <aside className="rail">
          {saju && (
            <div className="card coord" style={{ padding: 18 }}>
              <div className="ai-tag" style={{ justifyContent: "center" }}>생애 사주</div>
              <LifeCircle saju={saju} birthYear={birthYear} currentYear={currentYear} />
            </div>
          )}
          <div className="card card-flat">
            <b style={{ fontSize: 14 }}>이 해석을 두고 더 이야기할까요?</b>
            <Link href="/consult" className="btn btn-primary btn-block mt3" style={{ textDecoration: "none" }}>AI 상담으로 이어가기</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
