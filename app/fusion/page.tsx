"use client";

import { useEffect, useState } from "react";
import GenerateLoading from "@/components/GenerateLoading";
import ShareButton from "@/components/ShareButton";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import FusionReportBody from "@/components/report/FusionReportBody";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";
import type { SuggestedAction } from "@/lib/store/types";
import { trackEvent } from "@/lib/analytics";

const FUSION_MESSAGES = [
  "기질 검사 결과를 정리하는 중이야…",
  "사주의 타고난 결과 맞춰보는 중이야…",
  "둘을 겹쳐 하나의 해석으로 엮는 중이야…",
  "너한테 맞는 말로 풀어쓰는 중이야…",
];

type ReportResponse = {
  report: string;
  scores: TciScore[];
  flexibility?: number;
  previousScores?: TciScore[];
  previousFlexibility?: number;
  actions?: SuggestedAction[];
  debug: { prompt: string; model: string; provider: string };
};
type SavedShape = { report: string; generatedAt: string; provider: string; model: string; meta?: { scores?: TciScore[]; flexibility?: number }; actions?: SuggestedAction[] };
type ChartResponse = {
  saju: SajuResult | null;
  name?: string;
  gender?: string;
  occupation?: string;
  currentAge?: number;
  currentYear?: number;
};

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
    const previousScores = data?.scores ?? saved?.meta?.scores ?? [];
    const previousFlexibility = data?.flexibility ?? saved?.meta?.flexibility;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fusion/report", { method: "POST" });
      const text = await res.text();
      let d: ReportResponse | { error?: string } = {};
      try { d = text ? JSON.parse(text) : {}; }
      catch { d = { error: `서버 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 200)}` }; }
      if (!res.ok) { setError(("error" in d && d.error) || `리포트 생성 실패 (HTTP ${res.status})`); return; }
      setData({ ...(d as ReportResponse), previousScores, previousFlexibility });
      setSaved(null);
      trackEvent("report_generated", { kind: "fusion" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const view = data
    ? {
        report: data.report,
        scores: data.scores,
        flexibility: data.flexibility,
        previousScores: data.previousScores,
        previousFlexibility: data.previousFlexibility,
        actions: data.actions ?? [],
        generatedAt: null as string | null,
        debug: data.debug,
      }
    : saved
    ? {
        report: saved.report,
        scores: saved.meta?.scores ?? [],
        flexibility: saved.meta?.flexibility,
        previousScores: [],
        previousFlexibility: undefined,
        actions: saved.actions ?? [],
        generatedAt: saved.generatedAt,
        debug: null,
      }
    : null;

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const birthYear = saju ? Number(saju.input.birthDate.split("-")[0]) || 0 : 0;

  return (
    <div className="page">
      <h2 className="h-app">사주 × 기질 융합</h2>
      <div className="ai-tag mt2"><span className="dot" />TCI 7차원 + 생애 사주 종합 해석</div>

      {error && <p className="error mt4">{error}</p>}
      {initializing && <p className="muted mt4">불러오는 중...</p>}

      <FusionReportBody
        scores={view?.scores ?? []}
        flexibility={view?.flexibility}
        previousScores={view?.previousScores}
        previousFlexibility={view?.previousFlexibility}
        saju={saju}
        birthYear={birthYear}
        currentYear={currentYear}
        currentAge={chart?.currentAge}
        name={chart?.name}
        gender={chart?.gender}
        occupation={chart?.occupation}
        report={loading ? undefined : view?.report}
        fallback={loading ? <GenerateLoading messages={FUSION_MESSAGES} className="mt4" /> : undefined}
        showConsultCta
        actions={
          !loading && view ? (
            <>
              <ActionPlanRegister actions={view.actions} source="fusion" sourceLabel="사주 × 기질 융합" />
              {view.generatedAt && (
                <p className="muted mt4">저장된 리포트 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
              )}
              <div className="row gap2 mt4">
                <button className="btn btn-ghost btn-sm" onClick={generate}>다시 생성</button>
                <ShareButton kind="fusion" />
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
          ) : undefined
        }
      />
    </div>
  );
}
