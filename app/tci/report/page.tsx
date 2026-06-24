"use client";

import { useEffect, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import ShareButton from "@/components/ShareButton";
import TciReportBody from "@/components/report/TciReportBody";
import type { TciScore } from "@/lib/tci/scoring";
import type { SuggestedAction } from "@/lib/store/types";
import { trackEvent } from "@/lib/analytics";

type ReportResponse = {
  report: string;
  scores: TciScore[];
  flexibility?: number;
  actions?: SuggestedAction[];
};

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { scores?: TciScore[]; flexibility?: number };
  actions?: SuggestedAction[];
};

export default function TciReportPage() {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      trackEvent("report_generated", { kind: "tci" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const view = data
    ? { report: data.report, scores: data.scores, flexibility: data.flexibility, actions: data.actions ?? [], generatedAt: null as string | null }
    : saved
    ? { report: saved.report, scores: saved.meta?.scores ?? [], flexibility: saved.meta?.flexibility, actions: saved.actions ?? [], generatedAt: saved.generatedAt }
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

          <TciReportBody scores={view.scores} flexibility={view.flexibility} />

          <ReportView className="mt5" text={view.report} />

          <ActionPlanRegister actions={view.actions} source="tci" sourceLabel="기질 리포트" />

          <div className="row gap2 mt4">
            <ShareButton kind="tci" />
          </div>
        </>
      )}
    </div>
  );
}
