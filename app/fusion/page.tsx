"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import GenerateLoading from "@/components/GenerateLoading";
import GenerateIntentPanel from "@/components/GenerateIntentPanel";
import { consumeGenerateIntent, wantsGenerate } from "@/lib/generation/intent";
import PageLoading from "@/components/PageLoading";
import ShareButton from "@/components/ShareButton";
import FusionReportBody from "@/components/report/FusionReportBody";
import ReportTabs, { type ReportTab } from "@/components/report/ReportTabs";
import SavedPersonalReading, { type PersonalReading } from "@/components/report/SavedPersonalReading";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";
import type { SuggestedAction } from "@/lib/store/types";
import {
  ensureNotifyPermission,
  isGenerating,
  startGeneration,
  subscribeGenerations,
} from "@/lib/generation/tracker";
import { sharedGet } from "@/lib/net/sharedGet";
import type { CautionMonth } from "@/lib/saju/cautionMonths";
import { fetchPackageInfo, type PackageInfo } from "@/lib/package/client";
import { TCI_FOR_FUSION_HREF } from "@/lib/package/journey";
import { offerPriceLabel } from "@/lib/package/product";
import { isOldJudgment } from "@/lib/saju/judgmentVersion";
import styles from "@/components/report/ReportFolio.module.css";

const FUSION_MESSAGES = [
  "기질과 성격 응답에서 드러난 경향을 정리하는 중이야…",
  "사주의 타고난 결이랑 맞춰보는 중이야…",
  "강점과 반복되는 패턴을 함께 읽는 중이야…",
  "올해와 내년 흐름에 선택의 방향을 연결하는 중이야…",
  "마지막으로, 너에게 건넬 첫 한마디를 고민하는 중이야…",
];
const FUSION_NOTE = "이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아.";

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { scores?: TciScore[]; flexibility?: number; headline?: string };
  actions?: SuggestedAction[];
  judgment?: number;
};
type ChartResponse = {
  saju: SajuResult | null;
  cautionMonths?: CautionMonth[];
  name?: string;
  gender?: string;
  occupation?: string;
  currentAge?: number;
  currentYear?: number;
};
type FusionReadiness = { hasProfile: boolean; hasTci: boolean; tciAnswered?: number; tciTotal?: number };

type PersonalResponse = { saved: PersonalReading | null; status: "idle" | "generating" | "error"; error?: string };
async function fetchPersonalReading(): Promise<PersonalResponse> {
  const response = await fetch("/api/saju/personal", { cache: "no-store" });
  if (!response.ok) throw new Error("사주 풀이를 불러오지 못했어요.");
  const data = await response.json();
  if (!data || typeof data !== "object" || !["idle", "generating", "error"].includes(data.status) || !("saved" in data) ||
      (data.saved != null && (typeof data.saved.report !== "string" || typeof data.saved.generatedAt !== "string"))) {
    throw new Error("사주 풀이 응답을 확인하지 못했어요.");
  }
  return data;
}

export default function FusionPage() {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [generating, setGenerating] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<FusionReadiness | null>(null);
  const [starting, setStarting] = useState(false);
  const [personal, setPersonal] = useState<PersonalReading | null>(null);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalStatus, setPersonalStatus] = useState<PersonalResponse["status"]>("idle");
  const [initialTab, setInitialTab] = useState<ReportTab>("fusion");
  // 사주+기질 이용권. 조회 실패면 null — 결제 안 한 것으로 단정하지 않는다.
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const prevGenerating = useRef(false);
  // 생성 시작은 한 번만 — 중복 클릭·재조회로 두 번 쏘지 않게 잠근다.
  const startedRef = useRef(false);
  const prevPersonalGenerating = useRef(false);

  const refreshPersonal = useCallback(async () => {
    setPersonalLoading(true);
    setPersonalError(null);
    try {
      const result = await fetchPersonalReading();
      setPersonal(result.saved);
      setPersonalStatus(result.status);
      if (result.status === "error") setPersonalError(result.error || "사주 풀이 생성이 완료되지 않았어요.");
    } catch {
      setPersonalError("사주 풀이를 불러오지 못했어요. 새로 생성하지 않고 조회만 다시 시도할 수 있어요.");
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [chartRes, reportRes, pkgRes, personalRes] = await Promise.all([
          sharedGet("/api/saju/chart").then((r) => r.json()).catch(() => ({ saju: null })),
          fetch("/api/fusion/report", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error("조회 실패"); return r.json(); })
            .catch(() => ({ saved: null, readiness: null, status: "error", error: "종합 풀이를 불러오지 못했어요. 잠시 후 다시 방문해 주세요." })),
          fetchPackageInfo().catch(() => null),
          fetchPersonalReading().then(result => ({ ...result, loadError: null }))
            .catch(() => ({ saved: null, status: "idle" as const, error: undefined, loadError: "사주 풀이를 불러오지 못했어요. 조회를 다시 시도해 주세요." })),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        setPkg(pkgRes);
        setReadiness(reportRes.readiness ?? null);
        setPersonal(personalRes.saved);
        setPersonalStatus(personalRes.status);
        setPersonalError(personalRes.loadError ?? (personalRes.status === "error" ? personalRes.error || "사주 풀이 생성이 완료되지 않았어요." : null));
        if (personalRes.saved && !reportRes.saved && reportRes.status !== "generating" && !wantsGenerate()) setInitialTab("personal");
        if (personalRes.status === "generating") startGeneration({ kind: "personal", label: "개인 사주 풀이", href: "/saju" });
        if (reportRes.saved) setSaved(reportRes.saved);
        setInitializing(false);
        if (reportRes.status === "generating") {
          startGeneration({ kind: "fusion", label: "사주+기질 최종 통합 풀이", href: "/fusion" });
        } else if (reportRes.status === "error" && reportRes.error) {
          setError(reportRes.error);
        } else if (
          !reportRes.saved &&
          reportRes.readiness?.hasProfile &&
          reportRes.readiness?.hasTci &&
          wantsGenerate()
        ) {
          // ★단순 방문은 조회만 한다.★ 앞 화면(기질 검사 완료 등)에서 넘어온 경우에만 바로 시작하고,
          // 주소의 표시는 즉시 지워 새로고침이 재생성으로 이어지지 않게 한다. 이용권이 없으면 시작하지 않는다.
          consumeGenerateIntent();
          if (pkgRes?.state.entitled) void generate();
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
      const personalGenerating = isGenerating("personal");
      if (prevPersonalGenerating.current && !personalGenerating) void refreshPersonal();
      prevPersonalGenerating.current = personalGenerating;
    };
    void sync();
    return subscribeGenerations(() => { void sync(); });
  }, [refreshPersonal]);

  async function generate() {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/fusion/report", { method: "POST" });
      if (res.status === 202) {
        ensureNotifyPermission();
        startGeneration({ kind: "fusion", label: "사주+기질 최종 통합 풀이", href: "/fusion" });
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
        generatedAt: saved.generatedAt,
      }
    : null;

  const saju = chart?.saju ?? null;
  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const birthYear = saju ? Number(saju.input.birthDate.split("-")[0]) || 0 : 0;
  const needsSetup = !initializing && !generating && !view && readiness !== null && !(readiness.hasProfile && readiness.hasTci);
  const setup = readiness?.hasProfile
    ? {
        title: "기질 검사를\n먼저 해주세요.",
        body: "기질 검사(35문항, 약 3분)를 마치면 사주와 기질·성격 응답을 함께 읽어 강점과 반복 패턴, 선택의 방향을 정리해드려요.",
        href: TCI_FOR_FUSION_HREF,
        cta: "기질 검사 시작하기",
      }
    : {
        title: "사주 정보를\n먼저 알려주세요.",
        body: "사주와 기질을 겹쳐 읽으려면, 생년월일과 출생 시각이 먼저 필요해요.",
        href: "/onboarding?next=/fusion",
        cta: "사주 정보 입력하기",
      };

  return (
    <div className={`page ${styles.page}`} style={{ maxWidth: 1240 }}>
      <header className={styles.mast}>
        <p className={styles.overline}>PERSONAL ANALYSIS / 나를 읽는 리포트</p>
        <div className={styles.titleRow}>
          <div><h1>{chart?.name ? `${chart.name}님을 읽는 두 관점` : "사주+기질 최종 풀이"}</h1><p>타고난 특징과 평소의 반응을 함께 살펴봅니다</p></div>
          <span className={styles.edition} aria-hidden="true">사주 + 기질</span>
        </div>
      </header>

      {initializing ? <PageLoading compact label="두 풀이를 준비하고 있어요" /> : <ReportTabs initialTab={initialTab}
        personal={<>
          {personalLoading && <PageLoading compact label="저장된 사주 풀이를 불러오고 있어요" />}
          {personalError && <section className="card mt4" role="alert"><p>{personalError}</p><button type="button" className="btn btn-ghost btn-sm mt3" onClick={() => { void refreshPersonal(); }} disabled={personalLoading}>사주 풀이 다시 불러오기</button></section>}
          {personal ? <SavedPersonalReading saved={personal} saju={saju} currentAge={chart?.currentAge} currentYear={currentYear} name={chart?.name} gender={chart?.gender} occupation={chart?.occupation} /> :
            !personalLoading && !personalError && <section className="card mt4 next-step-card">
              <p className="next-step-kicker">사주 풀이</p>
              <h2 className="next-step-title">{personalStatus === "generating" ? "사주 풀이를 만들고 있어요" : "아직 저장된 사주 풀이가 없어요"}</h2>
              <p className="next-step-body">{personalStatus === "generating" ? "완료되면 이 탭에서 읽을 수 있어요. 다른 풀이를 보셔도 괜찮아요." : "사주 정보로 읽은 타고난 특징과 삶의 흐름을 먼저 확인해 보세요."}</p>
              <Link href="/saju" className="btn btn-primary mt3">{personalStatus === "generating" ? "사주 풀이 진행 확인" : "사주 풀이 받으러 가기"}</Link>
            </section>}
        </>}
        fusion={<>
      {error && !needsSetup && <p className="error mt4">{error}</p>}

      {needsSetup ? (
        <section className="action-empty action-empty--compact" aria-labelledby="fusion-setup-title">
          <p className="action-empty-kicker">사주+기질 · 최종 통합 풀이</p>
          <h1 id="fusion-setup-title">{setup.title.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
          <p>{setup.body}</p>
          <Link href={setup.href} className="btn btn-primary action-empty-cta" style={{ textDecoration: "none" }}>
            {setup.cta}
          </Link>
        </section>
      ) : (
      <>
      {/* ★만드는 중 표시는 맨 위에★ — 기질 검사를 마치고 넘어오면 곧바로 생성이 시작되는데, 예전엔 이 표시가
          사주 그림들 아래(폰에서 두 화면 밑)에 있어 시작됐는지 알 수 없었다. 개인 사주 화면과 같은 자리다. */}
      {generating && <GenerateLoading messages={FUSION_MESSAGES} note={FUSION_NOTE} className="mt4" />}
      {/* 저장본도 없고 생성 중도 아니면 ★방문만으로 만들지 않는다★ — 여기서 눌러야 시작된다. */}
      {!initializing && !generating && !view && (
        pkg && !pkg.state.entitled ? (
          <section className="card mt4 next-step-card" aria-label="사주+기질 풀이 안내">
            <p className="next-step-kicker">사주 + 기질</p>
            <p className="next-step-title">최종 통합 풀이는 사주+기질 풀이에서 열려</p>
            <p className="next-step-body">사주에서 읽은 특징과 기질·성격 응답을 함께 보고 강점과 반복 패턴, 나에게 맞는 선택의 방향까지 정리해줄게.</p>
            <Link href="/checkout" className="btn btn-primary btn-block" style={{ textDecoration: "none" }}>
              사주+기질 풀이 열기 · {offerPriceLabel(pkg.payment, pkg.product.price)} <span aria-hidden>→</span>
            </Link>
          </section>
        ) : (
          <GenerateIntentPanel
            title="아직 최종 통합 풀이를 안 만들었어"
            lead="사주와 기질 응답이 다 모였어. 두 관점으로 강점과 반복 패턴을 읽고, 삶의 흐름과 선택의 방향을 함께 정리해줄게."
            inputs={[
              "생년월일·출생 시각으로 계산한 사주표와 10년 흐름",
              "기질 검사 응답으로 계산한 일곱 경향 점수",
              "올해·내년 기운과 남은 달 주의(코드로 계산)",
            ]}
            cta="최종 통합 풀이 만들기"
            onGenerate={() => void generate()}
            busy={starting}
          />
        )
      )}
      <FusionReportBody
        folio
        generatedAt={view?.generatedAt}
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
        cautionMonths={chart?.cautionMonths}
        currentMonth={new Date().getMonth() + 1}
        oldJudgment={isOldJudgment(saved)}
        report={generating ? undefined : view?.report}
        persistKey={view?.generatedAt ? `fusion:${view.generatedAt}` : undefined}
        actions={
          !generating && view ? (
            <>
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
                <ShareButton kind="fusion" />
              </div>
            </>
          ) : undefined
        }
      />
      </>
      )}
      </>} />}
    </div>
  );
}
