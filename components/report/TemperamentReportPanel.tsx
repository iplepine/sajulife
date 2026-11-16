"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageLoading from "@/components/PageLoading";
import ReportView from "@/components/ReportView";
import ShareButton from "@/components/ShareButton";
import TciReportBody from "./TciReportBody";
import { useDesignVariant } from "@/components/DesignVariantProvider";
import { CharacterMessage } from "@/components/design-b/CharacterGuide";
import { parsePersonalReport } from "@/lib/report/types";
import { TCI_FOR_FUSION_HREF } from "@/lib/package/journey";
import { isGenerating, subscribeGenerations } from "@/lib/generation/tracker";
import { tciReadingView, type TciReadingResponse } from "@/lib/tci/reading";
import styles from "./TemperamentReportPanel.module.css";

/** Read-only result panel: no generation intent, navigation effects or POST calls. */
export default function TemperamentReportPanel() {
  const design = useDesignVariant();
  const characterDesign = design === "b";
  const [data, setData] = useState<TciReadingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tci/report", { cache: "no-store", signal });
      if (!response.ok) throw new Error("조회 실패");
      const result = await response.json();
      if (!result || typeof result !== "object" || !["idle", "generating", "error"].includes(result.status) ||
          !("saved" in result) || typeof result.readiness?.hasTci !== "boolean" ||
          (result.saved != null && (typeof result.saved.report !== "string" || typeof result.saved.generatedAt !== "string"))) throw new Error("응답 확인 실패");
      if (!signal?.aborted) setData(result);
    } catch {
      if (!signal?.aborted) setError("기질 검사 결과를 불러오지 못했어. 다시 불러와 봐.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    let wasGenerating = isGenerating("tci");
    const unsubscribe = subscribeGenerations(() => {
      const generating = isGenerating("tci");
      if (wasGenerating && !generating) void load(controller.signal);
      wasGenerating = generating;
    });
    return () => { controller.abort(); unsubscribe(); };
  }, [load]);

  const view = data ? tciReadingView(data) : null;
  const saved = view?.saved;

  return <section className={`${styles.panel}${characterDesign ? ` ${styles.characterPanel}` : ""}`} aria-label="기질 검사 리포트" aria-busy={loading} data-design={design}>
    {loading && <PageLoading compact label="저장된 기질 검사 결과를 불러오고 있어" />}
    {error && <div className="card mt4" role="alert"><p>{error}</p><button type="button" className="btn btn-ghost btn-sm mt3" disabled={loading} onClick={() => { void load(); }}>기질 결과 다시 불러오기</button></div>}
    {data && view && <>
      <header className={styles.intro}>
        {characterDesign ? <div className={styles.characterGuide} data-temperament-guide="b"><CharacterMessage characters={["brother"]} role="기질·성격 검사 결과" copy="점수 하나로 널 정하지는 않을게. 네가 고른 응답에서 어떤 반응이 드러나는지 같이 보자." /></div> :
          <p className={styles.kicker}>기질오빠 · 검사 응답으로 읽는 나</p>}
        <h2>네가 답한 기질과 성격</h2>
        <p>타고난 반응을 살피는 기질 네 가지와, 선택하는 방식을 살피는 성격 세 가지야. 높고 낮음에 정답은 없어.</p>
        {view.complete && <p className={styles.meta}>완료한 검사 응답 기준 · 일곱 경향</p>}
      </header>

      {data.status === "generating" && <div className="card mt4" role="status"><p>기질 해설을 만들고 있어. 지금 있는 검사 결과는 먼저 읽어도 돼.</p><button type="button" className="btn btn-ghost btn-sm mt3" disabled={loading} onClick={() => { void load(); }}>기질 결과 다시 불러오기</button></div>}
      {data.status === "error" && <div className="card mt4" role="alert"><p>지난 기질 해설 생성이 완료되지 않았어. 저장된 검사 결과와 이전 해설은 그대로 볼 수 있어.</p></div>}

      {view.scores.length > 0 ? <div aria-label="완료한 검사 응답 결과"><TciReportBody scores={view.scores} showDescriptions showIdentity={false} /></div> :
        view.complete ? <div className="card mt4" role="alert"><p>검사는 완료됐지만 점수 자료를 확인하지 못했어.</p><button type="button" className="btn btn-ghost btn-sm mt3" disabled={loading} onClick={() => { void load(); }}>기질 결과 다시 불러오기</button></div> :
        <div className="card mt4 next-step-card">
          <h3 className="next-step-title">{(data.readiness.tciAnswered ?? 0) > 0 ? "기질 검사를 마저 해볼까?" : "아직 기질 검사 결과가 없어"}</h3>
          <p className="next-step-body">{(data.readiness.tciAnswered ?? 0) > 0 ? `${data.readiness.tciAnswered}/${data.readiness.tciTotal ?? 35}문항까지 답했어. 끝까지 답하면 여기서 결과를 볼 수 있어.` : "검사를 마치면 네 응답에서 드러난 일곱 경향을 여기서 읽을 수 있어."}</p>
          <Link href={TCI_FOR_FUSION_HREF} className="btn btn-primary mt3">{(data.readiness.tciAnswered ?? 0) > 0 ? "기질 검사 이어서 하기" : "기질 검사 시작하기"}</Link>
        </div>}

      {saved && <div className={styles.saved}>
        <h3>저장된 기질 해설</h3>
        <p className="muted">{new Date(saved.generatedAt).toLocaleString("ko-KR")}에 저장한 해설이야. 아래 해설과 당시 점수는 최근 검사 결과와 별개로 읽어봐.</p>
        {view.savedScores.length > 0 ? <details className="mt3"><summary>이 해설에 사용한 당시 점수 보기</summary><TciReportBody scores={view.savedScores} flexibility={view.flexibility} title={parsePersonalReport(saved.report)?.title} showIdentity={false} /></details> :
          <p className="muted mt3">당시 점수 자료가 남아 있지 않아. 저장된 해설 본문은 그대로 읽을 수 있어.</p>}
        <ReportView text={saved.report} persistKey={`tci:${saved.generatedAt}`} anchorPrefix="temperament" />
        <div className="row gap2 mt4"><ShareButton kind="tci" /></div>
      </div>}
      {(saved || view.scores.length > 0) && <p className={styles.note}>이 결과는 자기 이해를 돕는 참고 자료야. 약식 검사는 자체 제작 문항을 쓰며, 정식 TCI 검사나 의학적 진단을 대신하지 않아. 한 번의 응답으로 과거보다 달라졌다고 판단하지도 않아.</p>}
    </>}
  </section>;
}
