"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Manseryeok from "@/components/Manseryeok";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { Manseryeok as ManseryeokData } from "@/lib/saju/manseryeok";

type Resp = { manseryeok: ManseryeokData | null };

export default function ManseryeokPage() {
  const [data, setData] = useState<ManseryeokData | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [wolLoading, setWolLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/saju/manseryeok");
        const d: Resp = await res.json();
        if (cancelled) return;
        setData(d.manseryeok);
      } catch {
        if (!cancelled) setError("만세력을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const changeWolwoonYear = useCallback((year: number) => {
    const id = ++reqId.current;
    setWolLoading(true);
    fetch(`/api/saju/manseryeok?wy=${year}`)
      .then((r) => r.json() as Promise<Resp>)
      .then((d) => {
        // 최신 요청만 반영 (연속 클릭 레이스 방지)
        if (id !== reqId.current || !d.manseryeok) return;
        setData(d.manseryeok);
      })
      .catch(() => {})
      .finally(() => {
        if (id === reqId.current) setWolLoading(false);
      });
  }, []);

  if (initializing) return <main className="page"><PageLoading label="만세력을 펼치고 있어요" /></main>;

  if (!data) {
    return (
      <div className="page-narrow">
        <div className="report-person-head">
          <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
          <PersonSwitcher nameOnly />
        </div>
        <p className="muted mt2">만세력을 뽑으려면 생년월일시가 필요해요.</p>
        <Link href="/onboarding?next=/saju/manseryeok" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>
          사주 정보 입력으로
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app" style={{ margin: 0 }}>내 만세력 원본</h2>
        <PersonSwitcher nameOnly />
      </div>

      {error && <p className="error mt4">{error}</p>}

      <Manseryeok data={data} onChangeWolwoonYear={changeWolwoonYear} wolwoonLoading={wolLoading} />
    </div>
  );
}
