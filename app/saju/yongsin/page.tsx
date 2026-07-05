"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GenerateLoading from "@/components/GenerateLoading";
import ReportView from "@/components/ReportView";
import YongsinBoard from "@/components/YongsinBoard";
import { trackEvent } from "@/lib/analytics";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildYongsinView } from "@/lib/saju/yongsinView";

type ChartResponse = {
  saju: SajuResult | null;
  currentAge?: number;
  currentYear?: number;
};

type Reading = { report: string; generatedAt: string };

export default function YongsinPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [saved, setSaved] = useState<Reading | null>(null);
  const [fresh, setFresh] = useState<Reading | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, readRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()),
          fetch("/api/saju/yongsin").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        if (readRes?.saved) setSaved(readRes.saved);
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

  const view = useMemo(() => {
    if (!chart?.saju) return null;
    return buildYongsinView(chart.saju, chart.currentAge, chart.currentYear ?? new Date().getFullYear());
  }, [chart]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saju/yongsin", { method: "POST" });
      const text = await res.text();
      let d: { report?: string; generatedAt?: string; error?: string } = {};
      try {
        d = text ? JSON.parse(text) : {};
      } catch {
        d = { error: `서버 응답 파싱 실패 (HTTP ${res.status})` };
      }
      if (!res.ok || !d.report) {
        setError(d.error || `풀이 생성 실패 (HTTP ${res.status})`);
        return;
      }
      setFresh({ report: d.report, generatedAt: d.generatedAt ?? new Date().toISOString() });
      setSaved(null);
      trackEvent("report_generated", { kind: "yongsin" });
    } catch {
      setError("풀이 생성 연결이 끊겼어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
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

  const reading = fresh ?? saved;

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

      {loading ? (
        <GenerateLoading />
      ) : reading ? (
        <section className="yv-report">
          <div className="yv-report-head">
            <span className="yv-report-k">사주언니의 정밀 풀이</span>
            {reading.generatedAt && (
              <span className="muted" style={{ fontSize: 12 }}>
                {new Date(reading.generatedAt).toLocaleString("ko-KR")}
              </span>
            )}
          </div>
          <ReportView text={reading.report} currentAge={chart.currentAge} />
          <div className="row gap2 mt4">
            <button className="btn btn-ghost btn-sm" onClick={generate}>다시 생성</button>
          </div>
        </section>
      ) : (
        <section className="yv-unlock">
          <div className="yv-unlock-foil" aria-hidden />
          <span className="yv-unlock-k">사주언니의 정밀 풀이</span>
          <h3 className="yv-unlock-title">이 처방을 ‘언제·어디에·누구와’ 쓸지, 대운·세운까지 겹쳐서 콕 짚어줄게.</h3>
          <ul className="yv-unlock-list">
            <li>격국·억부·조후를 합쳐 <b>뭘 가까이하고 언제 밀어붙일지</b></li>
            <li>대운·세운 흐름에 얹은 <b>맞춤 타이밍</b></li>
            <li>흔들릴 때 꺼내 볼 <b>한 줄 부적</b></li>
          </ul>
          <button className="btn btn-primary btn-block yv-unlock-btn" onClick={generate}>
            이 기운으로 내 인생 풀이 보기 →
          </button>
          <p className="yv-unlock-fine">사주언니가 직접 써주는 맞춤 풀이 · 30초쯤 걸려</p>
        </section>
      )}
    </div>
  );
}
