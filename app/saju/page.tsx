"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import GenerateLoading from "@/components/GenerateLoading";
import GenerateIntentPanel from "@/components/GenerateIntentPanel";
import { consumeGenerateIntent, wantsGenerate } from "@/lib/generation/intent";
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
import { sharedGet } from "@/lib/net/sharedGet";
import { fetchPackageInfo, type PackageInfo } from "@/lib/package/client";
import { nextJourneyStep } from "@/lib/package/journey";
import { formatWon } from "@/lib/package/product";

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
  const [starting, setStarting] = useState(false);
  // 사주+기질 풀이 이용권·진행 상태. 조회 실패면 null — 결제 안 한 것으로 단정하지 않는다.
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const prevGenerating = useRef(false);
  // 생성 시작은 한 번만 — 중복 클릭·의사 표시 재소비로 두 번 쏘지 않게 잠근다.
  const startedRef = useRef(false);
  const generatePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, reportRes, pkgRes] = await Promise.all([
          sharedGet("/api/saju/chart").then((r) => r.json()),
          fetch("/api/saju/personal", { cache: "no-store" }).then((r) => r.json()),
          fetchPackageInfo().catch(() => null),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        setPkg(pkgRes);
        if (reportRes.saved) setSaved(reportRes.saved);
        // 서버가 아직 생성 중이면(이전 세션/다른 기기에서 시작) 전역 추적을 이어붙인다.
        if (reportRes.status === "generating") {
          startGeneration({ kind: "personal", label: "개인 사주 풀이", href: "/saju" });
        } else if (reportRes.status === "error" && reportRes.error) {
          setError(reportRes.error);
        } else if (!reportRes.saved && chartRes?.saju && wantsGenerate()) {
          // ★결제·사주 정보 입력을 마치고 넘어온 경우★ — 같은 의사를 두 번 묻지 않고 한 번만 시작한다.
          // 표시는 즉시 지워 새로고침이 재생성으로 이어지지 않게 한다. 단순 방문은 조회만 한다.
          // 이용권이 없으면 시작하지 않는다(서버도 402로 막는다) — 아래 결제 안내가 대신 보인다.
          consumeGenerateIntent();
          if (pkgRes?.state.entitled) void generate();
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
          setPkg(await fetchPackageInfo().catch(() => null));
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
    if (startedRef.current) return;
    startedRef.current = true;
    setStarting(true);
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
      // 실패했으면 다시 누를 수 있어야 한다. 이전 저장본은 그대로 남는다.
      startedRef.current = false;
    } catch {
      setError("풀이 생성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      startedRef.current = false;
    } finally {
      setStarting(false);
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
      <section className="page-narrow action-empty" aria-labelledby="saju-empty-title">
        <p className="action-empty-kicker">개인 사주</p>
        <h1 id="saju-empty-title">사주 정보를<br />먼저 알려주세요.</h1>
        <p>생년월일과 출생 시각을 바탕으로 사주 구조와 지금의 흐름을 먼저 정리해드려요.</p>
        <Link href="/onboarding?next=/saju" className="btn btn-primary action-empty-cta" style={{ textDecoration: "none" }}>
          사주 정보 입력하기
        </Link>
      </section>
    );
  }

  const currentAge = chart?.currentAge;
  const identityTitle = view ? parsePersonalReport(view.report)?.title : undefined;

  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app">개인 사주 풀이</h2>
        <PersonSwitcher nameOnly />
      </div>

      {/* ★생성 안내와 진행 표시는 맨 위에★ — 예전엔 "풀이 생성하기"가 사주표·그래프 아래(모바일 1.8화면)에
          설명 없이 있었다. 소개에서 "무료로 풀이 시작"을 누르고 와도 버튼을 찾아 한참 내려가야 했고,
          무엇이 어디로 전송되는지도 알 수 없었다. 저장본이 있으면 이 자리는 비고 풀이는 아래에 그대로 둔다. */}
      <div ref={generatePanelRef}>
        {error && <p className="error mt4">{error}</p>}
        {generating ? (
          <GenerateLoading className="mt4" note="이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아." />
        ) : !view ? (
          pkg && !pkg.state.entitled ? (
            <PackageOffer price={pkg.product.price} />
          ) : (
            <GenerateIntentPanel
              title="아직 사주 풀이를 안 만들었어"
              lead="아래 사주표는 이미 계산돼 있어. 이걸 바탕으로 네 일·돈·관계·건강과 10년 단위 흐름까지, 평생 판을 풀어줄게."
              inputs={[
                "이름·성별·생년월일·출생 시각으로 계산한 사주표",
                "10년 단위 흐름과 기운 배합 수치",
                "직업·관계·고민 메모(입력했다면)",
              ]}
              cta="내 사주 풀이 만들기"
              onGenerate={() => void generate()}
              busy={starting}
            />
          )
        ) : null}
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

      {generating ? null : view ? (
        <>
          {view.generatedAt && (
            <p className="muted" style={{ marginBottom: 8 }}>저장된 풀이 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}
          <ReportView
            className="mt5 personal-report-ledger-sections"
            text={view.report}
            currentAge={currentAge}
            cautionMonths={chart?.cautionMonths}
            currentMonth={new Date().getMonth() + 1}
          />
          <ActionPlanRegister actions={view.actions} source="personal" sourceLabel="개인 사주" />
          {pkg && <NextToTemperament pkg={pkg} />}
          <div className="row gap2 mt4">
            {pkg?.state.entitled && (
              <button
                className="btn btn-ghost btn-sm"
                disabled={starting}
                onClick={() => { startedRef.current = false; void generate(); }}
              >
                {starting ? "시작하는 중…" : "다시 생성"}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={copyReport}>{copied ? "복사됨!" : "텍스트 복사"}</button>
            <ShareButton kind="personal" />
          </div>
        </>
      ) : (
        // 사주표를 끝까지 읽고 내려온 사람을 위한 되돌림 — 바로 생성하지 않고 위의 안내 패널로 보낸다
        // (무엇이 전송되는지, 결제가 필요한지 보고 누르게).
        <button
          type="button"
          className="btn btn-ghost btn-block mt5"
          onClick={() => generatePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          {pkg && !pkg.state.entitled ? "사주+기질 풀이 열기 ↑" : "이 사주로 풀이 만들기 ↑"}
        </button>
      )}
    </div>
  );
}

/**
 * 이용권이 없을 때 생성 패널 자리 — 사주 풀이는 사주+기질 풀이(유료) 안에 들어 있다.
 */
function PackageOffer({ price }: { price: number }) {
  return (
    <section className="card mt4 next-step-card" aria-label="사주+기질 풀이 안내">
      <p className="next-step-kicker">사주 + 기질</p>
      <p className="next-step-title">사주 풀이는 사주+기질 풀이 안에 들어 있어</p>
      <p className="next-step-body">
        먼저 타고난 결과 평생 흐름을 사주로 풀고, 기질 검사로 요즘의 너를 잰 다음, 둘을 겹쳐 올해 운세까지 이어서 볼 수 있어.
      </p>
      <Link href="/checkout" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
        사주+기질 풀이 열기 · {formatWon(price)} <span aria-hidden>→</span>
      </Link>
    </section>
  );
}

/**
 * 사주 풀이 다음 걸음 — ★사주는 '원래의 너', 올해 운세는 '요즘의 너'까지 겹쳐야 정확하다★는 걸 여기서 말한다.
 * 다음 단계는 홈과 같은 lib/package/journey.ts가 정한다.
 */
function NextToTemperament({ pkg }: { pkg: PackageInfo }) {
  if (!pkg.state.entitled) {
    return (
      <section className="card mt5 next-step-card" aria-label="올해 운세 안내">
        <p className="next-step-kicker">다음 단계 · 올해 운세</p>
        <p className="next-step-title">여기까지가 &lsquo;원래의 너&rsquo;야</p>
        <p className="next-step-body">
          올해 운세는 요즘의 너까지 봐야 정확해져. 사주+기질 풀이를 열면 기질 검사로 지금 상태를 재고, 사주랑 겹쳐서 올해 흐름이랑 내년 준비까지 풀어줄게.
        </p>
        <Link href="/checkout" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
          사주+기질 풀이 열기 · {formatWon(pkg.product.price)} <span aria-hidden>→</span>
        </Link>
      </section>
    );
  }
  const next = nextJourneyStep(pkg.state);
  if (next.stage < 2) return null;
  const done = next.key === "done" || next.key === "fusion" || next.key === "fusion-generating" || next.key === "fusion-retry";
  return (
    <section className="card mt5 next-step-card" aria-label="다음 단계">
      <p className="next-step-kicker">{done ? "사주 + 기질 · 올해 운세" : "다음 단계 · 기질 검사"}</p>
      <p className="next-step-title">여기까지가 &lsquo;원래의 너&rsquo;야</p>
      <p className="next-step-body">
        {done
          ? "사주에 요즘의 너를 겹친 올해 운세도 준비돼 있어. 올해 남은 달이랑 내년 준비는 거기서 이어서 봐."
          : "사주는 평생 안 바뀌는 타고난 결을 보여줘. 근데 올해 운세는 요즘의 너까지 봐야 정확해져. 기질 검사(35문항, 3분)로 지금 상태를 재면, 사주랑 겹쳐서 올해 흐름이랑 내년 준비까지 풀어줄게."}
      </p>
      <Link href={next.href} className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
        {next.label} <span aria-hidden>→</span>
      </Link>
    </section>
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
