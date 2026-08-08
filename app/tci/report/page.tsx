"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReportView from "@/components/ReportView";
import GenerateLoading from "@/components/GenerateLoading";
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

// 기질 리포트 생성 대기 문구 — 기질오빠 반말 톤, 7차원 흐름에 맞춤.
const TCI_LOADING_MESSAGES = [
  "네 기질 7차원 점수를 펼쳐 읽는 중이야…",
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
type TciReadiness = { hasProfile: boolean; hasTci: boolean };

export default function TciReportPage() {
  const [saved, setSaved] = useState<SavedShape | null>(null);
  // 설문 답변으로 바로 계산한 점수 — 풀이 생성 전·중에도 레이더를 그리기 위한 기준값.
  const [baseScores, setBaseScores] = useState<TciScore[]>([]);
  const [generating, setGenerating] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<TciReadiness | null>(null);
  const prevGenerating = useRef(false);

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
        } else if (!d.saved && d.readiness?.hasProfile && d.readiness?.hasTci) {
          // 설문과 사주 정보가 있을 때만 자동 생성한다. 없으면 아래 안내에서 선행 단계를 고른다.
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
    } catch {
      setError("풀이 생성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
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
        title: "기질 검사를\n먼저 해주세요.",
        body: "기질 풀이를 만들기 전에, 짧은 검사로 내 반응 패턴부터 정리해요.",
        href: "/tci",
        cta: "기질 검사 시작하기",
      };

  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app">기질 풀이</h2>
        <PersonSwitcher nameOnly />
      </div>
      <div className="ai-tag mt2"><span className="dot" />분석 · 기질 7차원 + 유연성</div>

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
            <button className="btn btn-ghost btn-sm" onClick={generate}>다시 생성</button>
            <ShareButton kind="tci" />
          </div>
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
        <button className="btn btn-primary btn-block mt5" onClick={generate}>풀이 생성</button>
      ) : null}
    </div>
  );
}
