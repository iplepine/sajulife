"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import YongsinBoard from "@/components/YongsinBoard";
import type { SajuResult } from "@/lib/saju/calculator";
import { buildYongsinView } from "@/lib/saju/yongsinView";

type ChartResponse = {
  saju: SajuResult | null;
  currentAge?: number;
  currentYear?: number;
};

export default function YongsinPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/saju/chart")
      .then((r) => r.json())
      .then((d: ChartResponse) => {
        if (cancelled) return;
        setChart(d);
        setInitializing(false);
      })
      .catch(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    if (!chart?.saju) return null;
    return buildYongsinView(
      chart.saju,
      chart.currentAge,
      chart.currentYear ?? new Date().getFullYear(),
    );
  }, [chart]);

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
    </div>
  );
}
