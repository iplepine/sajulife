"use client";

import { useEffect, useRef, useState } from "react";
import GenerateLoading from "@/components/GenerateLoading";
import ShareButton from "@/components/ShareButton";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import FusionReportBody from "@/components/report/FusionReportBody";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";
import type { SuggestedAction } from "@/lib/store/types";
import {
  ensureNotifyPermission,
  isGenerating,
  startGeneration,
  subscribeGenerations,
} from "@/lib/generation/tracker";

const FUSION_MESSAGES = [
  "기질 검사 결과를 정리하는 중이야…",
  "사주의 타고난 결과 맞춰보는 중이야…",
  "둘을 겹쳐 하나의 해석으로 엮는 중이야…",
  "너한테 맞는 말로 풀어쓰는 중이야…",
  "마지막으로, 너한테 건넬 첫 한마디를 고민하는 중이야…",
];
const FUSION_NOTE = "이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아.";

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { scores?: TciScore[]; flexibility?: number; headline?: string };
  actions?: SuggestedAction[];
};
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
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [generating, setGenerating] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevGenerating = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, reportRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()).catch(() => ({ saju: null })),
          fetch("/api/fusion/report", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        if (reportRes.saved) setSaved(reportRes.saved);
        setInitializing(false);
        if (reportRes.status === "generating") {
          startGeneration({ kind: "fusion", label: "사주 × 기질 융합", href: "/fusion" });
        } else if (reportRes.status === "error" && reportRes.error) {
          setError(reportRes.error);
        } else if (!reportRes.saved) {
          // 저장본도 진행 중 작업도 없으면 바로 생성 시작(기존 자동 생성 동작 유지).
          void generate();
        }
      } catch {
        setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 전역 생성 추적을 화면에 반영하고, 완료되는 순간 최신 저장본을 다시 읽어온다.
  useEffect(() => {
    const sync = async () => {
      const nowGen = isGenerating("fusion");
      setGenerating(nowGen);
      if (prevGenerating.current && !nowGen) {
        try {
          const r = await fetch("/api/fusion/report", { cache: "no-store" }).then((x) => x.json());
          if (r.saved) setSaved(r.saved);
          if (r.status === "error" && r.error) setError(r.error);
          else setError(null);
        } catch {
          /* 무시 — 다음 방문 시 초기 로드가 복구 */
        }
      }
      prevGenerating.current = nowGen;
    };
    void sync();
    return subscribeGenerations(() => { void sync(); });
  }, []);

  async function generate() {
    setError(null);
    try {
      const res = await fetch("/api/fusion/report", { method: "POST" });
      if (res.status === 202) {
        ensureNotifyPermission();
        startGeneration({ kind: "fusion", label: "사주 × 기질 융합", href: "/fusion" });
        return;
      }
      const d = await res.json().catch(() => ({} as { error?: string }));
      setError(d.error || `풀이 생성 실패 (HTTP ${res.status})`);
    } catch {
      setError("풀이 생성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  const view = saved
    ? {
        report: saved.report,
        scores: saved.meta?.scores ?? [],
        flexibility: saved.meta?.flexibility,
        headline: saved.meta?.headline,
        actions: saved.actions ?? [],
        generatedAt: saved.generatedAt,
      }
    : null;

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const birthYear = saju ? Number(saju.input.birthDate.split("-")[0]) || 0 : 0;

  return (
    <div className="page">
      <h2 className="h-app">사주 × 기질 융합</h2>
      <div className="ai-tag mt2"><span className="dot" />기질 7차원 + 생애 사주 종합 해석</div>

      {error && <p className="error mt4">{error}</p>}
      {initializing && <p className="muted mt4">불러오는 중...</p>}

      <FusionReportBody
        scores={view?.scores ?? []}
        flexibility={view?.flexibility}
        headline={view?.headline}
        saju={saju}
        birthYear={birthYear}
        currentYear={currentYear}
        currentAge={chart?.currentAge}
        name={chart?.name}
        gender={chart?.gender}
        occupation={chart?.occupation}
        report={generating ? undefined : view?.report}
        fallback={generating ? <GenerateLoading messages={FUSION_MESSAGES} note={FUSION_NOTE} className="mt4" /> : undefined}
        showConsultCta
        actions={
          !generating && view ? (
            <>
              <ActionPlanRegister actions={view.actions} source="fusion" sourceLabel="사주 × 기질 융합" />
              {view.generatedAt && (
                <p className="muted mt4">저장된 풀이 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
              )}
              <div className="row gap2 mt4">
                <button className="btn btn-ghost btn-sm" onClick={generate}>다시 생성</button>
                <ShareButton kind="fusion" />
              </div>
            </>
          ) : undefined
        }
      />
    </div>
  );
}
