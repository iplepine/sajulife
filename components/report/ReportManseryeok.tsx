"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Manseryeok from "@/components/Manseryeok";
import type { Manseryeok as Chart } from "@/lib/saju/manseryeok";
import type { SajuResult } from "@/lib/saju/calculator";

/** Read the same chart endpoint as the standalone view; never generate an interpretation. */
export default function ReportManseryeok({ saju, children }: { saju: SajuResult; children: ReactNode }) {
  const [data, setData] = useState<Chart | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  const requestedYear = useRef<number | undefined>(undefined);
  const load = useCallback(async (year?: number, signal?: AbortSignal) => {
    const id = ++request.current;
    requestedYear.current = year;
    setLoading(true); setError(false);
    try {
      const response = await fetch(`/api/saju/manseryeok${year === undefined ? "" : `?wy=${year}`}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error("조회 실패");
      const chart = (await response.json()).manseryeok as Chart | null;
      if (!chart || !Array.isArray(chart.natal) || chart.natal.length !== 4 ||
          !Array.isArray(chart.daewoon) || !Array.isArray(chart.saewoon) || !Array.isArray(chart.wolwoon?.columns) ||
          chart.meta?.birthDate !== saju.input.birthDate || chart.meta.calendar !== saju.input.calendar ||
          chart.meta.birthTimeKnown !== saju.input.birthTimeKnown ||
          Boolean(chart.meta.isLeapMonth) !== Boolean(saju.input.isLeapMonth) ||
          (saju.input.birthTimeKnown && chart.meta.birthTime !== saju.input.birthTime)) throw new Error("자료 확인 실패");
      if (id === request.current && !signal?.aborted) setData(chart);
    } catch {
      if (id === request.current && !signal?.aborted) setError(true);
    } finally {
      if (id === request.current && !signal?.aborted) setLoading(false);
    }
  }, [saju]);
  const invalidate = useCallback(() => { request.current++; }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(undefined, controller.signal);
    return () => { controller.abort(); invalidate(); };
  }, [load, invalidate]);
  return <div className="report-manseryeok" aria-busy={loading}>
    {data ? <Manseryeok data={data} report onChangeWolwoonYear={year => { void load(year); }} wolwoonLoading={loading} /> : children}
    {loading && !data && <p className="muted mt2" role="status">상세 만세력을 불러오고 있어.</p>}
    {error && <div className="mt3" role="alert"><p className="muted">상세 만세력을 불러오지 못했어. 기존 자료는 그대로 볼 수 있어.</p><button className="btn btn-ghost btn-sm" disabled={loading} onClick={() => { void load(requestedYear.current); }}>만세력 다시 불러오기</button></div>}
    <Link href="/saju/manseryeok" className="link-tiny">만세력 전체 화면으로 보기 →</Link>
  </div>;
}
