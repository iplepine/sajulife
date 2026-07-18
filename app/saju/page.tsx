"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import GenerateLoading from "@/components/GenerateLoading";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import PersonalReportBody, { EL_ORDER } from "@/components/report/PersonalReportBody";
import ShareButton from "@/components/ShareButton";
import type { Pillar, SajuResult } from "@/lib/saju/calculator";
import type { CautionMonth } from "@/lib/saju/cautionMonths";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { parsePersonalReport } from "@/lib/report/types";
import type { SuggestedAction } from "@/lib/store/types";
import {
  ensureNotifyPermission,
  isGenerating,
  startGeneration,
  subscribeGenerations,
} from "@/lib/generation/tracker";

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
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [generating, setGenerating] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const prevGenerating = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, reportRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()),
          fetch("/api/saju/personal", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        if (reportRes.saved) setSaved(reportRes.saved);
        // 서버가 아직 생성 중이면(이전 세션/다른 기기에서 시작) 전역 추적을 이어붙인다.
        if (reportRes.status === "generating") {
          startGeneration({ kind: "personal", label: "개인 사주 풀이", href: "/saju" });
        } else if (reportRes.status === "error" && reportRes.error) {
          setError(reportRes.error);
        }
        setInitializing(false);
      } catch {
        setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 전역 생성 추적을 화면에 반영하고, 완료되는 순간 최신 저장본을 다시 읽어온다.
  useEffect(() => {
    const sync = async () => {
      const nowGen = isGenerating("personal");
      setGenerating(nowGen);
      if (prevGenerating.current && !nowGen) {
        try {
          const r = await fetch("/api/saju/personal", { cache: "no-store" }).then((x) => x.json());
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
      const res = await fetch("/api/saju/personal", { method: "POST" });
      if (res.status === 202) {
        // 생성이 백그라운드에서 시작됨 → 전역 추적 + (권한 있으면) 완료 시 OS 알림.
        ensureNotifyPermission();
        startGeneration({ kind: "personal", label: "개인 사주 풀이", href: "/saju" });
        return;
      }
      const d = await res.json().catch(() => ({} as { error?: string }));
      setError(d.error || `풀이 생성 실패 (HTTP ${res.status})`);
    } catch {
      setError("풀이 생성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  const view = saved
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

  if (initializing) return <main className="page"><PageLoading label="사주를 읽어오고 있어요" /></main>;

  const saju = chart?.saju ?? null;
  if (!saju) {
    return (
      <div className="page-narrow">
        <div className="report-person-head">
          <h1 className="h-app">사주 정보를 먼저 입력하세요</h1>
          <PersonSwitcher />
        </div>
        <Link href="/onboarding?next=/saju" className="btn btn-primary mt5" style={{ textDecoration: "none" }}>사주 정보 입력으로</Link>
      </div>
    );
  }

  const currentAge = chart?.currentAge;
  const identityTitle = view ? parsePersonalReport(view.report)?.title : undefined;

  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app">개인 사주 풀이</h2>
        <PersonSwitcher />
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

      {generating ? (
        <GenerateLoading note="이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아." />
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
