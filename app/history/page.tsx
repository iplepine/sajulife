"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ActionItem, ConsultSummary } from "@/lib/store/types";

type HistoryState = {
  consults: ConsultSummary[];
  actions: ActionItem[];
};

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
  const [state, setState] = useState<HistoryState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const j = (url: string) => fetch(url).then((r) => r.json()).catch(() => ({}));
    Promise.all([j("/api/consult"), j("/api/coaching")]).then(([consultRes, coachingRes]) => {
      setState({
        consults: consultRes.history ?? [],
        actions: coachingRes.items ?? [],
      });
    });
  }, []);

  const activeActions = useMemo(() => (state?.actions ?? []).filter((item) => !item.done), [state?.actions]);
  const doneActions = useMemo(() => (state?.actions ?? []).filter((item) => item.done), [state?.actions]);

  async function toggleAction(item: ActionItem) {
    if (!state) return;
    const next = !item.done;
    setState({
      ...state,
      actions: state.actions.map((x) => (x.id === item.id ? { ...x, done: next } : x)),
    });
    setError(null);
    try {
      const res = await fetch(`/api/coaching/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setState((prev) => prev
        ? { ...prev, actions: prev.actions.map((x) => (x.id === item.id ? item : x)) }
        : prev);
      setError("액션 상태를 저장하지 못했어요.");
    }
  }

  if (!state) return <div className="page muted">불러오는 중...</div>;

  return (
    <div className="page history-page">
      <div className="row between center">
        <div>
          <p className="h-sec">기록</p>
          <h1 className="h-app">상담과 액션</h1>
        </div>
        <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
          새 질문
        </Link>
      </div>

      {error && <p className="error mt3">{error}</p>}

      <section className="history-section mt5">
        <div className="home-section-head">
          <h2>지난 상담</h2>
          <span>{state.consults.length}개</span>
        </div>
        {state.consults.length > 0 ? (
          <ul className="history-card-list">
            {state.consults.map((item) => (
              <li key={item.id}>
                <Link href={`/consult?id=${item.id}`} className="history-record-card">
                  <strong>{item.question}</strong>
                  <span>{item.basisLabel} · {relativeTime(item.generatedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="home-empty-card">
            <strong>아직 상담 기록이 없어요</strong>
            <span>홈에서 첫 질문을 남기면 여기에 쌓입니다.</span>
          </div>
        )}
      </section>

      <section className="history-section mt6">
        <div className="home-section-head">
          <h2>저장한 액션</h2>
          <span>{activeActions.length}개 진행 중</span>
        </div>
        {activeActions.length > 0 ? (
          <ul className="history-action-list">
            {activeActions.map((item) => (
              <ActionRow key={item.id} item={item} onToggle={toggleAction} />
            ))}
          </ul>
        ) : (
          <div className="home-empty-card">
            <strong>진행 중인 액션이 없어요</strong>
            <span>풀이나 상담에서 마음에 드는 행동을 저장해두세요.</span>
          </div>
        )}

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
