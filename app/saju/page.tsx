"use client";

import { useEffect, useState } from "react";
import LifeCircle from "@/components/LifeCircle";
import type { Pillar, SajuResult } from "@/lib/saju/calculator";

type ReportResponse = { report: string; debug: { prompt: string; model: string; provider: string } };
type SavedShape = { report: string; generatedAt: string; provider: string; model: string };
type ChartResponse = { saju: SajuResult | null; name?: string; currentYear?: number };

const EL_VAR: Record<string, string> = { 목: "--el-wood", 화: "--el-fire", 토: "--el-earth", 금: "--el-metal", 수: "--el-water" };
const EL_CLASS: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };
const EL_ORDER: Array<keyof SajuResult["wuxingCount"]> = ["목", "화", "토", "금", "수"];

export default function PersonalSajuPage() {
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
          fetch("/api/saju/chart").then((r) => r.json()),
          fetch("/api/saju/personal").then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        if (reportRes.saved) setSaved(reportRes.saved);
        setInitializing(false);
      } catch {
        setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/saju/personal", { method: "POST" });
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
    ? { report: data.report, generatedAt: null as string | null, debug: data.debug }
    : saved
    ? { report: saved.report, generatedAt: saved.generatedAt, debug: null }
    : null;

  if (initializing) return <div className="page muted">불러오는 중...</div>;

  const saju = chart?.saju ?? null;
  if (!saju) {
    return (
      <div className="page-narrow">
        <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
        <a href="/onboarding" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>사주 정보 입력으로</a>
      </div>
    );
  }

  const { pillars, dayMaster, shengXiao, wuxingCount } = saju;
  const total = EL_ORDER.reduce((s, k) => s + wuxingCount[k], 0) || 1;
  const birthYear = Number(saju.input.birthDate.split("-")[0]) || 0;

  return (
    <div className="page">
      <h2 className="h-app">개인 사주 풀이</h2>
      <div className="ai-tag mt2">
        <span className="dot" />
        {saju.input.birthDate} · {saju.input.birthTimeKnown ? saju.input.birthTime : "시각 모름"} · {saju.input.calendar === "lunar" ? "음력" : "양력"}
      </div>

      <div className="row gap3 mt5">
        <div className="card" style={{ flex: 1, textAlign: "center", padding: "14px 8px" }}>
          <div className="muted" style={{ fontSize: 12 }}>일간</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
            <span className={`el-dot ${EL_CLASS[dayMaster.wuxing] ?? "wood"}`} style={{ verticalAlign: "middle" }} /> {dayMaster.ko}
          </div>
        </div>
        <div className="card" style={{ flex: 1, textAlign: "center", padding: "14px 8px" }}>
          <div className="muted" style={{ fontSize: 12 }}>띠</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{shengXiao.ko}띠</div>
        </div>
      </div>

      <p className="h-sec mt5">사주 네 기둥</p>
      <div className="pillars">
        <div className="ph">시주</div><div className="ph">일주</div><div className="ph">월주</div><div className="ph">연주</div>
        <StemCell p={pillars.time} /><StemCell p={pillars.day} acc /><StemCell p={pillars.month} /><StemCell p={pillars.year} />
        <BranchCell p={pillars.time} /><BranchCell p={pillars.day} /><BranchCell p={pillars.month} /><BranchCell p={pillars.year} />
      </div>

      <p className="h-sec mt5">오행 분포</p>
      <div className="dist">
        {EL_ORDER.map((k) => (
          <span key={k} className={EL_CLASS[k]} style={{ width: `${(wuxingCount[k] / total) * 100}%` }} />
        ))}
      </div>
      <div className="legend">
        {EL_ORDER.map((k) => (
          <div key={k}><span className={`el-dot ${EL_CLASS[k]}`} />{k} {wuxingCount[k]}</div>
        ))}
      </div>

      <p className="h-sec mt5">생애 사주 — 인생의 원</p>
      <div className="card">
        <LifeCircle
          pillars={saju.pillars}
          daewoon={saju.daewoon}
          dayMaster={dayMaster}
          birthYear={birthYear}
          currentYear={chart?.currentYear ?? new Date().getFullYear()}
        />
      </div>

      {error && <p className="error mt4">{error}</p>}

      <p className="h-sec mt6">AI 풀이</p>
      {view ? (
        <>
          {view.generatedAt && (
            <p className="muted" style={{ marginBottom: 8 }}>저장된 리포트 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}
          <div className="report">{view.report}</div>
          <div className="row gap2 mt4">
            <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>{loading ? "생성 중…" : "다시 생성"}</button>
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
      ) : (
        <button className="btn btn-primary btn-block" onClick={generate} disabled={loading}>
          {loading ? "생성 중…" : "AI 풀이 생성하기"}
        </button>
      )}
    </div>
  );
}

function StemCell({ p, acc }: { p: Pillar | null; acc?: boolean }) {
  if (!p) return <div className="cell"><span className="gz muted">—</span><span className="hanja">시각 모름</span></div>;
  return (
    <div className={`cell${acc ? " acc" : ""}`}>
      <span className="gz" style={{ color: `var(${EL_VAR[p.gan.wuxing] ?? "--el-earth"})` }}>{p.gan.ko}</span>
      <span className="hanja">{p.gan.hanja} {p.gan.wuxing}</span>
    </div>
  );
}

function BranchCell({ p }: { p: Pillar | null }) {
  if (!p) return <div className="cell"><span className="gz muted">—</span><span className="hanja"> </span></div>;
  return (
    <div className="cell">
      <span className="gz" style={{ color: `var(${EL_VAR[p.zhi.wuxing] ?? "--el-earth"})` }}>{p.zhi.ko}</span>
      <span className="hanja">{p.zhi.hanja} {p.zhi.wuxing}</span>
    </div>
  );
}
