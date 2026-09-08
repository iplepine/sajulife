"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import GenerateLoading from "@/components/GenerateLoading";
import GenerateIntentPanel from "@/components/GenerateIntentPanel";
import { consumeGenerateIntent, wantsGenerate } from "@/lib/generation/intent";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import ShareButton from "@/components/ShareButton";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import FusionReportBody from "@/components/report/FusionReportBody";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";
import type { SuggestedAction } from "@/lib/store/types";
import {
  ensureNotifyPermission,
  isGenerating,
  startGeneration,
  subscribeGenerations,
} from "@/lib/generation/tracker";

const FUSION_MESSAGES = [
  "기질 설문 결과를 정리하는 중이야…",
  "사주의 타고난 결과 맞춰보는 중이야…",
  "둘을 겹쳐 하나의 해석으로 엮는 중이야…",
  "너한테 맞는 말로 풀어쓰는 중이야…",
  "마지막으로, 너한테 건넬 첫 한마디를 고민하는 중이야…",
];
const FUSION_NOTE = "이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아.";

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { scores?: TciScore[]; flexibility?: number; headline?: string };
  actions?: SuggestedAction[];
};
type ChartResponse = {
  saju: SajuResult | null;
  name?: string;
  gender?: string;
  occupation?: string;
  currentAge?: number;
  currentYear?: number;
};
type FusionReadiness = { hasProfile: boolean; hasTci: boolean; tciAnswered?: number; tciTotal?: number };

export default function FusionPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [generating, setGenerating] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<FusionReadiness | null>(null);
  const [starting, setStarting] = useState(false);
  const prevGenerating = useRef(false);
  // 생성 시작은 한 번만 — 중복 클릭·재조회로 두 번 쏘지 않게 잠근다.
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, reportRes] = await Promise.all([
          fetch("/api/saju/chart").then((r) => r.json()).catch(() => ({ saju: null })),
          fetch("/api/fusion/report", { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        setReadiness(reportRes.readiness ?? null);
        if (reportRes.saved) setSaved(reportRes.saved);
        setInitializing(false);
        if (reportRes.status === "generating") {
          startGeneration({ kind: "fusion", label: "사주 × 기질 융합", href: "/fusion" });
        } else if (reportRes.status === "error" && reportRes.error) {
          setError(reportRes.error);
        } else if (
          !reportRes.saved &&
          reportRes.readiness?.hasProfile &&
          reportRes.readiness?.hasTci &&
          wantsGenerate()
        ) {
          // ★단순 방문은 조회만 한다.★ 앞 화면에서 "만들기"를 눌러 온 경우에만 바로 시작하고,
          // 주소의 표시는 즉시 지워 새로고침이 재생성으로 이어지지 않게 한다.
          consumeGenerateIntent();
          void generate();
        }
      } catch {
        setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 전역 생성 추적을 화면에 반영하고, 완료되는 순간 최신 저장본을 다시 읽어온다.
  useEffect(() => {
    const sync = async () => {
      const nowGen = isGenerating("fusion");
      setGenerating(nowGen);
      if (prevGenerating.current && !nowGen) {
        try {
          const r = await fetch("/api/fusion/report", { cache: "no-store" }).then((x) => x.json());
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
    if (startedRef.current) return;
    startedRef.current = true;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/fusion/report", { method: "POST" });
      if (res.status === 202) {
        ensureNotifyPermission();
        startGeneration({ kind: "fusion", label: "사주 × 기질 융합", href: "/fusion" });
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
    ? {
        report: saved.report,
        scores: saved.meta?.scores ?? [],
        flexibility: saved.meta?.flexibility,
        headline: saved.meta?.headline,
        actions: saved.actions ?? [],
        generatedAt: saved.generatedAt,
      }
    : null;

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const birthYear = saju ? Number(saju.input.birthDate.split("-")[0]) || 0 : 0;
  const needsSetup = !initializing && !generating && !view && readiness !== null && !(readiness.hasProfile && readiness.hasTci);
  const setup = readiness?.hasProfile
    ? {
        title: "기질 설문을\n먼저 해주세요.",
        body: "사주와 기질을 함께 읽으려면, 먼저 기질 설문으로 내 반응 패턴을 정리해야 해요.",
        href: "/tci",
        cta: "기질 설문 시작하기",
      }
    : {
        title: "사주 정보를\n먼저 알려주세요.",
        body: "사주와 기질을 겹쳐 읽으려면, 생년월일과 출생 시각이 먼저 필요해요.",
        href: "/onboarding?next=/fusion",
        cta: "사주 정보 입력하기",
      };

  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app">사주 × 기질 융합</h2>
        <PersonSwitcher nameOnly />
      </div>
      <div className="ai-tag mt2"><span className="dot" />기질 7가지 경향 + 생애 사주 종합 해석</div>

      {error && !needsSetup && <p className="error mt4">{error}</p>}
      {initializing && <PageLoading compact label="통합 리포트를 준비하고 있어요" />}

      {needsSetup ? (
        <section className="action-empty action-empty--compact" aria-labelledby="fusion-setup-title">
          <p className="action-empty-kicker">사주 × 기질 융합</p>
          <h1 id="fusion-setup-title">{setup.title.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
          <p>{setup.body}</p>
          <Link href={setup.href} className="btn btn-primary action-empty-cta" style={{ textDecoration: "none" }}>
            {setup.cta}
          </Link>
        </section>
      ) : (
      <>
      {/* 저장본도 없고 생성 중도 아니면 ★방문만으로 만들지 않는다★ — 여기서 눌러야 시작된다. */}
      {!initializing && !generating && !view && (
        <GenerateIntentPanel
          title="아직 융합 풀이를 안 만들었어"
          lead="사주랑 기질, 재료 두 개가 다 모였어. 겹쳐서 어디가 어긋나는지 풀어줄게."
          inputs={[
            "생년월일·출생 시각으로 계산한 사주표와 10년 흐름",
            "기질 설문 응답으로 계산한 일곱 경향 점수",
          ]}
          cta="두 개 겹쳐서 풀이 만들기"
          onGenerate={() => void generate()}
          busy={starting}
        />
      )}
      <FusionReportBody
        scores={view?.scores ?? []}
        flexibility={view?.flexibility}
        headline={view?.headline}
        saju={saju}
        birthYear={birthYear}
        currentYear={currentYear}
        currentAge={chart?.currentAge}
        name={chart?.name}
        gender={chart?.gender}
        occupation={chart?.occupation}
        report={generating ? undefined : view?.report}
        fallback={generating ? <GenerateLoading messages={FUSION_MESSAGES} note={FUSION_NOTE} className="mt4" /> : undefined}
        actions={
          !generating && view ? (
            <>
              <ActionPlanRegister actions={view.actions} source="fusion" sourceLabel="사주 × 기질 융합" />
              {view.generatedAt && (
                <p className="muted mt4">저장된 풀이 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
              )}
              <div className="row gap2 mt4">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={starting}
                  onClick={() => { startedRef.current = false; void generate(); }}
                >
                  {starting ? "시작하는 중…" : "다시 생성"}
                </button>
                <ShareButton kind="fusion" />
              </div>
            </>
          ) : undefined
        }
      />
      </>
      )}
    </div>
  );
}
