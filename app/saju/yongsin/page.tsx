"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import GenerateLoading from "@/components/GenerateLoading";
import ReportView from "@/components/ReportView";
import YongsinBoard from "@/components/YongsinBoard";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildYongsinView } from "@/lib/saju/yongsinView";
import {
  ensureNotifyPermission,
  isGenerating,
  startGeneration,
  subscribeGenerations,
} from "@/lib/generation/tracker";

type ChartResponse = { saju: SajuResult | null; currentAge?: number; currentYear?: number };
type Reading = { report: string; generatedAt: string };

const GEN = { kind: "yongsin", label: "용신 풀이", href: "/saju/yongsin" } as const;

export default function YongsinPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [saved, setSaved] = useState<Reading | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevGenerating = useRef(false);

  // 초기 로드 — 결정론 차트 + 저장된 풀이/진행 상태.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, readRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()),
          fetch("/api/saju/yongsin", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        if (readRes.saved) setSaved(readRes.saved);
        // 서버가 아직 생성 중이면(이전 세션/다른 기기) 전역 추적을 이어붙인다.
        if (readRes.status === "generating") startGeneration(GEN);
        else if (readRes.status === "error" && readRes.error) setError(readRes.error);
      } catch {
        /* 실패해도 결정론 화면은 그릴 수 있게 graceful */
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 전역 생성 추적 반영 + 완료 순간 최신 저장본 다시 읽기.
  useEffect(() => {
    const sync = async () => {
      const nowGen = isGenerating("yongsin");
      setGenerating(nowGen);
      if (prevGenerating.current && !nowGen) {
        try {
          const r = await fetch("/api/saju/yongsin", { cache: "no-store" }).then((x) => x.json());
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

  const view = useMemo(() => {
    if (!chart?.saju) return null;
    return buildYongsinView(chart.saju, chart.currentAge, chart.currentYear ?? new Date().getFullYear());
  }, [chart]);

  async function generate() {
    setError(null);
    try {
      const res = await fetch("/api/saju/yongsin", { method: "POST" });
      if (res.status === 202) {
        // 생성이 백그라운드에서 시작됨 → 전역 추적 + (권한 있으면) 완료 시 OS 알림.
        ensureNotifyPermission();
        startGeneration(GEN);
        return;
      }
      const d = await res.json().catch(() => ({}) as { error?: string });
      setError(d.error || `풀이 생성 실패 (HTTP ${res.status})`);
    } catch {
      setError("풀이 생성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (initializing) return <div className="page muted">불러오는 중...</div>;

  if (!chart?.saju || !view) {
    return (
      <div className="page-narrow">
        <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
        <p className="muted mt3">용신은 만세력(생년월일시)을 근거로 계산돼요.</p>
        <Link href="/onboarding?next=/saju/yongsin" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>
          사주 정보 입력으로
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row between gap3" style={{ alignItems: "center", marginBottom: 4 }}>
        <h2 className="h-app" style={{ margin: 0 }}>용신 보기</h2>
        <Link href="/saju" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          사주 풀이로
        </Link>
      </div>

      <YongsinBoard view={view} />

      {error && <p className="error mt4">{error}</p>}

      <section className="mt5">
        <p className="h-sec">사주언니가 풀어주는 용신 이야기</p>
        {generating ? (
          <GenerateLoading note="이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아." />
        ) : saved ? (
          <>
            {saved.generatedAt && (
              <p className="muted" style={{ margin: "0 0 10px" }}>
                저장된 풀이 · {new Date(saved.generatedAt).toLocaleString("ko-KR")}
              </p>
            )}
            <ReportView text={saved.report} currentAge={chart.currentAge} />
            <div className="row gap2 mt4">
              <button className="btn btn-ghost btn-sm" onClick={generate}>다시 생성</button>
            </div>
          </>
        ) : (
          <>
            <p className="yv-note" style={{ marginTop: 0 }}>
              위 계산을 너 얘기로 풀어줄게 — 격국·억부·조후를 합쳐서 <b>뭘 가까이하고 언제 밀어붙일지</b>까지.
            </p>
            <button className="btn btn-primary btn-block mt4" onClick={generate}>
              풀이 생성하기
            </button>
          </>
        )}
      </section>
    </div>
  );
}
