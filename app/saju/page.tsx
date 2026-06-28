"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import GenerateLoading from "@/components/GenerateLoading";
import PersonalReportBody, { EL_ORDER } from "@/components/report/PersonalReportBody";
import ShareButton from "@/components/ShareButton";
import type { Pillar, SajuResult } from "@/lib/saju/calculator";
import type { CautionMonth } from "@/lib/saju/cautionMonths";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { parsePersonalReport } from "@/lib/report/types";
import type { SuggestedAction } from "@/lib/store/types";
import { trackEvent } from "@/lib/analytics";

type ReportResponse = { report: string; actions?: SuggestedAction[] };
type SavedShape = { report: string; generatedAt: string; provider: string; model: string; actions?: SuggestedAction[] };
type ChartResponse = {
  saju: SajuResult | null;
  name?: string;
  gender?: string;
  occupation?: string;
  currentAge?: number;
  currentYear?: number;
  cautionMonths?: CautionMonth[];
};

export default function PersonalSajuPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      if (!res.ok) { setError(("error" in d && d.error) || `풀이 생성 실패 (HTTP ${res.status})`); return; }
      setData(d as ReportResponse);
      setSaved(null);
      trackEvent("report_generated", { kind: "personal" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const view = data
    ? { report: data.report, actions: data.actions ?? [], generatedAt: null as string | null }
    : saved
    ? { report: saved.report, actions: saved.actions ?? [], generatedAt: saved.generatedAt }
    : null;

  async function copyReport() {
    if (!chart?.saju) return;
    const text = buildReportText(chart.saju, view?.report ?? null, view?.generatedAt ?? null);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("클립보드 복사에 실패했어요");
    }
  }

  if (initializing) return <div className="page muted">불러오는 중...</div>;

  const saju = chart?.saju ?? null;
  if (!saju) {
    return (
      <div className="page-narrow">
        <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
        <Link href="/onboarding?next=/saju" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>사주 정보 입력으로</Link>
      </div>
    );
  }

  const currentAge = chart?.currentAge;
  const identityTitle = view ? parsePersonalReport(view.report)?.title : undefined;

  return (
    <div className="page">
      <div className="row between gap3" style={{ alignItems: "center" }}>
        <h2 className="h-app" style={{ margin: 0 }}>개인 사주 풀이</h2>
        <Link href="/onboarding?next=/saju" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
          프로필 수정
        </Link>
      </div>

      <PersonalReportBody
        saju={saju}
        name={chart?.name}
        gender={chart?.gender}
        currentAge={currentAge}
        currentYear={chart?.currentYear}
        occupation={chart?.occupation}
        identityTitle={identityTitle}
      />

      {error && <p className="error mt4">{error}</p>}

      {loading ? (
        <GenerateLoading />
      ) : view ? (
        <>
          {view.generatedAt && (
            <p className="muted" style={{ marginBottom: 8 }}>저장된 풀이 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}
          <ReportView
            text={view.report}
            currentAge={currentAge}
            cautionMonths={chart?.cautionMonths}
            currentMonth={new Date().getMonth() + 1}
          />
          <ActionPlanRegister actions={view.actions} source="personal" sourceLabel="개인 사주" />
          <div className="row gap2 mt4">
            <button className="btn btn-ghost btn-sm" onClick={generate}>다시 생성</button>
            <button className="btn btn-ghost btn-sm" onClick={copyReport}>{copied ? "복사됨!" : "텍스트 복사"}</button>
            <ShareButton kind="personal" />
          </div>
        </>
      ) : (
        <button className="btn btn-primary btn-block" onClick={generate}>
          풀이 생성하기
        </button>
      )}
    </div>
  );
}

function buildReportText(saju: SajuResult, report: string | null, generatedAt: string | null): string {
  const { input, pillars, dayMaster, shengXiao, wuxingCount } = saju;
  const pillarLine = (label: string, p: Pillar | null) =>
    p
      ? `  ${label}: ${p.gan.ko}${p.zhi.ko} (${p.gan.hanja}${p.zhi.hanja}) — ${p.gan.wuxing}/${p.zhi.wuxing}`
      : `  ${label}: (시각 모름)`;

  const lines: string[] = [];
  lines.push("【사주 풀이】");
  lines.push(
    `${input.birthDate} · ${input.birthTimeKnown ? input.birthTime : "시각 모름"} · ${input.calendar === "lunar" ? "음력" : "양력"}`,
  );
  const correctionNote = formatKoreanTimeCorrection(input.koreanTimeCorrection);
  if (correctionNote) {
    lines.push(`한국 시간 보정: ${correctionNote}`);
  }
  lines.push("");
  lines.push(`일간: ${dayMaster.ko}(${dayMaster.hanja})`);
  lines.push(`띠: ${shengXiao.ko}띠`);
  lines.push("");
  lines.push("[사주 네 기둥]");
  lines.push(pillarLine("연주", pillars.year));
  lines.push(pillarLine("월주", pillars.month));
  lines.push(pillarLine("일주", pillars.day));
  lines.push(pillarLine("시주", pillars.time));
  lines.push("");
  lines.push("[오행 분포]");
  EL_ORDER.forEach((k) => lines.push(`  ${k}: ${wuxingCount[k]}`));
  if (report) {
    lines.push("");
    lines.push("[풀이]");
    lines.push(report);
    if (generatedAt) {
      lines.push("");
      lines.push(`(생성: ${new Date(generatedAt).toLocaleString("ko-KR")})`);
    }
  }
  return lines.join("\n");
}
