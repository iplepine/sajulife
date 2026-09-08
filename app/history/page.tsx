"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { ActionItem, ConsultSummary } from "@/lib/store/types";
import PageLoading from "@/components/PageLoading";
import { failureMessage, fetchJson, loginHrefFor, type FetchFailure } from "@/lib/net/fetchState";

/**
 * ★조회 실패와 "기록 없음"을 절대 같은 화면으로 보여주지 않는다.★
 * 상담과 액션은 ★따로★ 상태를 갖는다 — 하나가 실패했다고 정상적으로 불러온 나머지를 지우면
 * 사용자는 멀쩡한 데이터까지 사라진 걸로 본다.
 */
type Section<T> =
  | { phase: "loading" }
  | { phase: "ready"; items: T[] }
  /** 실패해도 직전에 보여주던 목록은 가능하면 유지한다. */
  | { phase: "failed"; failure: FetchFailure; items: T[] };

function sectionItems<T>(section: Section<T>): T[] {
  return section.phase === "loading" ? [] : section.items;
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function HistoryPage() {
  const [consultSection, setConsultSection] = useState<Section<ConsultSummary>>({ phase: "loading" });
  const [actionSection, setActionSection] = useState<Section<ActionItem>>({ phase: "loading" });
  const [error, setError] = useState<string | null>(null);

  // 재시도는 ★해당 조회만★ 다시 부른다. 새 풀이 생성(POST)은 어느 경로로도 부르지 않는다.
  const loadConsults = useCallback(async () => {
    setConsultSection((prev) => (prev.phase === "loading" ? prev : prev));
    const res = await fetchJson<{ history?: ConsultSummary[] }>("/api/consult");
    setConsultSection((prev) =>
      res.ok
        ? { phase: "ready", items: res.data.history ?? [] }
        : { phase: "failed", failure: res, items: sectionItems(prev) },
    );
  }, []);

  const loadActions = useCallback(async () => {
    const res = await fetchJson<{ items?: ActionItem[] }>("/api/coaching");
    setActionSection((prev) =>
      res.ok
        ? { phase: "ready", items: res.data.items ?? [] }
        : { phase: "failed", failure: res, items: sectionItems(prev) },
    );
  }, []);

  useEffect(() => {
    void loadConsults();
    void loadActions();
  }, [loadConsults, loadActions]);

  const actions = sectionItems(actionSection);
  const activeActions = useMemo(() => actions.filter((item) => !item.done), [actions]);
  const doneActions = useMemo(() => actions.filter((item) => item.done), [actions]);

  async function toggleAction(item: ActionItem) {
    const next = !item.done;
    setActionSection((prev) =>
      prev.phase === "loading"
        ? prev
        : { ...prev, items: prev.items.map((x) => (x.id === item.id ? { ...x, done: next } : x)) },
    );
    setError(null);
    try {
      const res = await fetch(`/api/coaching/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      const d = (await res.json().catch(() => ({}))) as { item?: ActionItem };
      if (!res.ok || d.item?.done !== next) throw new Error();
      if (next) trackEvent("action_completed", { source: item.source });
    } catch {
      // 저장 실패는 화면을 되돌린다 — 다른 인물·다른 액션은 건드리지 않는다.
      setActionSection((prev) =>
        prev.phase === "loading"
          ? prev
          : { ...prev, items: prev.items.map((x) => (x.id === item.id ? item : x)) },
      );
      setError("액션 상태를 저장하지 못했어요.");
    }
  }

  if (consultSection.phase === "loading" && actionSection.phase === "loading") {
    return <main className="page"><PageLoading label="지난 기록을 정리하고 있어요" /></main>;
  }

  return (
    <div className="page history-page">
      <div className="row between center">
        <div>
          <p className="h-sec">기록</p>
          <h1 className="h-app">용신상담과 액션</h1>
        </div>
        <Link href="/consult" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
          새 용신상담
        </Link>
      </div>

      {error && <p className="error mt3">{error}</p>}

      <section className="history-section mt5">
        <div className="home-section-head">
          <h2>지난 용신상담</h2>
          <span>{consultSection.phase === "ready" ? `${consultSection.items.length}개` : ""}</span>
        </div>
        {consultSection.phase === "failed" && (
          <LoadFailure failure={consultSection.failure} onRetry={() => void loadConsults()} what="용신상담 기록" />
        )}
        {sectionItems(consultSection).length > 0 ? (
          <ul className="history-card-list">
            {sectionItems(consultSection).map((item) => (
              <li key={item.id}>
                <Link href={`/consult?id=${item.id}`} className="history-record-card">
                  <strong>{item.question}</strong>
                  <span>{item.basisLabel} · {relativeTime(item.generatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : consultSection.phase === "loading" ? (
          <PageLoading compact label="지난 용신상담을 불러오고 있어요" />
        ) : consultSection.phase === "ready" ? (
          // ★"없음"은 성공 응답을 받았고 목록이 실제로 빈 경우에만★ 보여준다.
          <div className="home-empty-card">
            <strong>아직 용신상담 기록이 없어요</strong>
            <span>홈에서 첫 질문을 남기면 여기에 쌓입니다.</span>
          </div>
        ) : null}
      </section>

      <section className="history-section mt6">
        <div className="home-section-head">
          <h2>저장한 액션</h2>
          <span>{actionSection.phase === "ready" ? `${activeActions.length}개 진행 중` : ""}</span>
        </div>
        {actionSection.phase === "failed" && (
          <LoadFailure failure={actionSection.failure} onRetry={() => void loadActions()} what="저장한 액션" />
        )}
        {activeActions.length > 0 ? (
          <ul className="history-action-list">
            {activeActions.map((item) => (
              <ActionRow key={item.id} item={item} onToggle={toggleAction} />
            ))}
          </ul>
        ) : actionSection.phase === "loading" ? (
          <PageLoading compact label="저장한 액션을 불러오고 있어요" />
        ) : actionSection.phase === "ready" ? (
          <div className="home-empty-card">
            <strong>진행 중인 액션이 없어요</strong>
            <span>풀이 또는 용신상담에서 마음에 드는 행동을 저장해두세요.</span>
          </div>
        ) : null}

        {doneActions.length > 0 && (
          <details className="history-done mt4">
            <summary>완료한 액션 {doneActions.length}개</summary>
            <ul className="history-action-list mt3">
              {doneActions.map((item) => (
                <ActionRow key={item.id} item={item} onToggle={toggleAction} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}

/**
 * 조회 실패 안내 — ★"없음"이 아니라 "못 불러왔다"★고 말하고 재시도를 준다.
 * 세션 만료는 재시도해도 소용없으므로 로그인으로 보낸다(돌아올 주소를 실어서).
 */
function LoadFailure({
  failure,
  onRetry,
  what,
}: {
  failure: FetchFailure;
  onRetry: () => void;
  what: string;
}) {
  return (
    <div className="load-failure" role="status">
      <strong>{what}을 불러오지 못했어요</strong>
      <span>{failureMessage(failure)}</span>
      {failure.kind === "auth" ? (
        <Link href={loginHrefFor("/history")} className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
          다시 로그인하기
        </Link>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>다시 시도</button>
      )}
    </div>
  );
}

function ActionRow({
  item,
  onToggle,
}: {
  item: ActionItem;
  onToggle: (item: ActionItem) => void;
}) {
  return (
    <li className={`history-action${item.done ? " done" : ""}`}>
      <label>
        <input type="checkbox" checked={item.done} onChange={() => onToggle(item)} />
        <span>
          <strong>{item.title}</strong>
          <em>{[item.timeframe, item.sourceLabel].filter(Boolean).join(" · ")}</em>
        </span>
      </label>
    </li>
  );
}
