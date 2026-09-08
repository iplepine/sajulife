"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReportView from "@/components/ReportView";
import GenerateLoading from "@/components/GenerateLoading";
import GenerateIntentPanel from "@/components/GenerateIntentPanel";
import { consumeGenerateIntent, wantsGenerate } from "@/lib/generation/intent";
import PageLoading from "@/components/PageLoading";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import PersonSwitcher from "@/components/PersonSwitcher";
import ShareButton from "@/components/ShareButton";
import TciReportBody from "@/components/report/TciReportBody";
import type { TciScore } from "@/lib/tci/scoring";
import type { SuggestedAction } from "@/lib/store/types";
import { parsePersonalReport } from "@/lib/report/types";
import {
  ensureNotifyPermission,
  isGenerating,
  startGeneration,
  subscribeGenerations,
} from "@/lib/generation/tracker";

// 기질 리포트 생성 대기 문구 — 기질오빠 반말 톤, 일곱 경향 흐름에 맞춤.
const TCI_LOADING_MESSAGES = [
  "네 기질 일곱 경향 점수를 펼쳐 읽는 중이야…",
  "점수 조합이 만드는 패턴을 짚는 중이야…",
  "반복되는 실패 루프랑 진짜 강점을 찾는 중이야…",
  "너한테 맞는 말로 풀어쓰는 중이야…",
  "마지막으로, 너한테 건넬 첫 한마디를 고민하는 중이야…",
];
const TCI_LOADING_NOTE = "이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아.";

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { scores?: TciScore[]; flexibility?: number };
  actions?: SuggestedAction[];
};
type TciReadiness = { hasProfile: boolean; hasTci: boolean; tciAnswered?: number; tciTotal?: number };

export default function TciReportPage() {
  const [saved, setSaved] = useState<SavedShape | null>(null);
  // 설문 답변으로 바로 계산한 점수 — 풀이 생성 전·중에도 레이더를 그리기 위한 기준값.
  const [baseScores, setBaseScores] = useState<TciScore[]>([]);
  const [generating, setGenerating] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<TciReadiness | null>(null);
  const [starting, setStarting] = useState(false);
  const prevGenerating = useRef(false);
  // 생성 시작은 한 번만 — 중복 클릭·재조회로 두 번 쏘지 않게 잠근다.
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tci/report", { cache: "no-store" });
        const d = await res.json();
        if (cancelled) return;
        if (Array.isArray(d.scores)) setBaseScores(d.scores);
        setReadiness(d.readiness ?? null);
        if (d.saved) setSaved(d.saved);
        setInitializing(false);
        if (d.status === "generating") {
          startGeneration({ kind: "tci", label: "기질 풀이", href: "/tci/report" });
        } else if (d.status === "error" && d.error) {
          setError(d.error);
        } else if (!d.saved && d.readiness?.hasProfile && d.readiness?.hasTci && wantsGenerate()) {
          // ★단순 방문은 조회만 한다.★ 앞 화면에서 "만들기"를 눌러 온 경우(주소의 generate 표시)에만
          // 같은 의사를 두 번 묻지 않고 바로 시작하고, 표시는 즉시 지워 새로고침으로 다시 안 돌게 한다.
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
      const nowGen = isGenerating("tci");
      setGenerating(nowGen);
      if (prevGenerating.current && !nowGen) {
        try {
          const r = await fetch("/api/tci/report", { cache: "no-store" }).then((x) => x.json());
          if (Array.isArray(r.scores)) setBaseScores(r.scores);
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
      const res = await fetch("/api/tci/report", { method: "POST" });
      if (res.status === 202) {
        ensureNotifyPermission();
        startGeneration({ kind: "tci", label: "기질 풀이", href: "/tci/report" });
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
    ? { report: saved.report, scores: saved.meta?.scores ?? [], flexibility: saved.meta?.flexibility, actions: saved.actions ?? [], generatedAt: saved.generatedAt }
    : null;

  // 레이더에 그릴 점수 — 풀이가 있으면 그쪽 점수, 없으면 설문 기준값. 유연성은 풀이에서만 나온다.
  const radarScores = view?.scores?.length ? view.scores : baseScores;
  const identityTitle = view ? parsePersonalReport(view.report)?.title : undefined;
  const needsSetup = !initializing && !generating && !view && readiness !== null && !(readiness.hasProfile && readiness.hasTci);
  const setup = readiness?.hasTci
    ? {
        title: "사주 정보를\n먼저 알려주세요.",
        body: "기질 결과를 내 삶의 흐름과 함께 읽으려면, 생년월일과 출생 시각이 먼저 필요해요.",
        href: "/onboarding?next=/tci/report",
        cta: "사주 정보 입력하기",
      }
    : {
        title: "기질 설문을\n먼저 해주세요.",
        body: "기질 풀이를 만들기 전에, 짧은 검사로 내 반응 패턴부터 정리해요.",
        href: "/tci",
        cta: "기질 설문 시작하기",
      };

  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app">기질 풀이</h2>
        <PersonSwitcher nameOnly />
      </div>
      <div className="ai-tag mt2"><span className="dot" />기질 일곱 경향 + 보조로 가늠한 유연성</div>

      {error && !needsSetup && <p className="error mt4">{error}</p>}
      {initializing && <PageLoading compact label="기질 리포트를 준비하고 있어요" />}

      {/* 개인 사주처럼 시각화는 로딩 중에도 그대로 두고, 본문 자리에만 로딩 카드를 끼운다. */}
      {radarScores.length > 0 && (
        <TciReportBody scores={radarScores} flexibility={view?.flexibility} title={identityTitle} />
      )}

      {generating ? (
        <GenerateLoading className="mt5" messages={TCI_LOADING_MESSAGES} note={TCI_LOADING_NOTE} />
      ) : view ? (
        <>
          {view.generatedAt && (
            <p className="muted mt3">저장된 풀이 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}

          <ReportView className="mt5" text={view.report} />

          <ActionPlanRegister actions={view.actions} source="tci" sourceLabel="기질 풀이" />

          <div className="row gap2 mt4">
            <button
              className="btn btn-ghost btn-sm"
              disabled={starting}
              onClick={() => { startedRef.current = false; void generate(); }}
            >
              {starting ? "시작하는 중…" : "다시 생성"}
            </button>
            <ShareButton kind="tci" />
          </div>

          {/* 융합(사주 × 기질)으로 가는 유일한 진입로. 예전엔 하단 '기록' 탭에만 있었는데
              그 탭을 없애면서 여기로 옮겼다 — 기질을 다 본 다음이 융합이 제일 자연스럽게 붙는 자리다. */}
          <section className="card mt5">
            <div style={{ fontWeight: 700 }}>사주랑 겹쳐볼래?</div>
            <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
              지금 본 기질은 네가 어떻게 반응하는지야. 여기에 타고난 흐름을 겹치면 왜 그렇게 반응하는지까지 나와.
            </p>
            <Link href="/fusion" className="btn btn-ghost btn-block" style={{ textDecoration: "none" }}>
              사주 + 기질 함께 보기
            </Link>
          </section>
        </>
      ) : needsSetup ? (
        <section className="action-empty action-empty--compact" aria-labelledby="tci-setup-title">
          <p className="action-empty-kicker">기질 풀이</p>
          <h1 id="tci-setup-title">{setup.title.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
          <p>{setup.body}</p>
          <Link href={setup.href} className="btn btn-primary action-empty-cta" style={{ textDecoration: "none" }}>
            {setup.cta}
          </Link>
        </section>
      ) : !initializing ? (
        <GenerateIntentPanel
          title="아직 기질 풀이를 안 만들었어"
          lead="설문 응답은 다 저장돼 있어. 이 응답으로 네 기질 풀이를 만들어줄게."
          inputs={["이름과 성별", "기질 설문 응답으로 계산한 일곱 경향 점수"]}
          cta="내 기질 풀이 만들기"
          onGenerate={() => void generate()}
          busy={starting}
        />
      ) : null}
    </div>
  );
}
