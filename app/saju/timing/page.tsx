"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TimingCalendarView from "@/components/TimingCalendar";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { TimingCalendar } from "@/lib/saju/timingCalendar";

type TimingResponse = { calendar: TimingCalendar | null; name?: string };

export default function TimingPage() {
  const [data, setData] = useState<TimingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/saju/timing", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: TimingResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ calendar: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <main className="page"><PageLoading label="타이밍을 계산하고 있어요" /></main>;

  if (!data?.calendar) {
    return (
      <div className="page-narrow">
        <div className="report-person-head">
          <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
          <PersonSwitcher nameOnly />
        </div>
        <p className="muted mt3">타이밍 캘린더는 만세력(생년월일시)을 근거로 계산돼요.</p>
        <Link
          href="/onboarding?next=/saju/timing"
          className="btn btn-primary mt5"
          style={{ textDecoration: "none" }}
        >
          사주 정보 입력으로
        </Link>
      </div>
    );
  }

  const who = data.name?.trim();
  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app" style={{ margin: 0 }}>
          타이밍 캘린더
        </h2>
        <PersonSwitcher nameOnly />
      </div>
      <div className="row gap2 mt2">
        <Link href="/saju" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          사주 풀이로
        </Link>
      </div>
      <p className="muted" style={{ marginTop: 2, marginBottom: 14 }}>
        {who ? `${who}, ` : ""}올해 남은 달 중 언제 밀어붙이고 언제 템포 줄일지, 지금부터 순서대로 짚어줄게.
      </p>

      <TimingCalendarView calendar={data.calendar} />

      <div className="row gap2 mt5">
        <Link href="/saju/yongsin" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          용신(내 기운) 보기
        </Link>
      </div>
    </div>
  );
}
