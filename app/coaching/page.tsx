"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACTION_TIMEFRAMES } from "@/lib/report/actions";
import type { ActionItem } from "@/lib/store/types";

/**
 * 코칭 액션 플랜 탭.
 * - 리포트에서 "등록"했거나 직접 추가한 액션 아이템을 모아 추적한다.
 * - 시점(오늘/이번 주/이번 달/기타)별로 묶고, 완료한 건 접어둔다.
 * 톤: 제목·안내·응원은 반말, 기능 버튼은 중립 UI.
 */

const GROUP_ORDER = ["오늘", "이번 주", "이번 달", ""] as const;
const GROUP_LABEL: Record<string, string> = {
  "오늘": "오늘",
  "이번 주": "이번 주",
  "이번 달": "이번 달",
  "": "기타",
};

export default function CoachingPage() {
  const [items, setItems] = useState<ActionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWhen, setNewWhen] = useState<string>("오늘");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/coaching");
      const d = await res.json();
      if (!res.ok) { setError(d.error || "불러오기에 실패했어요."); setItems([]); return; }
      setItems(d.items ?? []);
    } catch {
      setError("네트워크 오류로 불러오지 못했어요.");
      setItems([]);
    }
  }

  async function toggle(it: ActionItem) {
    const next = !it.done;
    setItems((prev) => prev?.map((x) => (x.id === it.id ? { ...x, done: next } : x)) ?? prev);
    try {
      const res = await fetch(`/api/coaching/${it.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems((prev) => prev?.map((x) => (x.id === it.id ? { ...x, done: it.done } : x)) ?? prev);
    }
  }

  async function remove(it: ActionItem) {
    setItems((prev) => prev?.filter((x) => x.id !== it.id) ?? prev);
    try {
      await fetch(`/api/coaching/${it.id}`, { method: "DELETE" });
    } catch {
      void load();
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ title, timeframe: newWhen, source: "manual", sourceLabel: "직접 추가" }],
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "추가에 실패했어요."); return; }
      setItems(d.items ?? []);
      setNewTitle("");
      setShowAdd(false);
    } catch {
      setError("네트워크 오류로 추가하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (items === null) return <div className="page muted">불러오는 중...</div>;

  const active = items.filter((x) => !x.done);
  const done = items.filter((x) => x.done);
  const total = items.length;
  const doneCount = done.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="page">
      <h2 className="h-app">코칭 액션 플랜</h2>
      <p className="lead mt2" style={{ fontSize: 14 }}>
        리포트에서 받은 코칭을 여기 모아 하나씩 해치우는 칸이야.
      </p>

      {total > 0 && (
        <div className="card ap-progress mt4">
          <div className="row between center">
            <b style={{ fontSize: 14 }}>{doneCount}/{total} 완료</b>
            <span className="muted" style={{ fontSize: 12 }}>{pct}%</span>
          </div>
          <div className="ap-bar mt2"><i style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      <div className="mt4">
        {showAdd ? (
          <form onSubmit={add} className="card">
            <input
              className="input"
              placeholder="직접 추가할 액션 (예: 매일 아침 물 한 잔)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />
            <div className="row between mt3 wrap" style={{ gap: 8 }}>
              <div className="seg">
                {ACTION_TIMEFRAMES.map((tf) => (
                  <button type="button" key={tf} className={newWhen === tf ? "on" : ""} onClick={() => setNewWhen(tf)}>{tf}</button>
                ))}
                <button type="button" className={newWhen === "" ? "on" : ""} onClick={() => setNewWhen("")}>기타</button>
              </div>
              <div className="row gap2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowAdd(false); setNewTitle(""); }}>취소</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !newTitle.trim()}>추가</button>
              </div>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setShowAdd(true)}>+ 직접 추가</button>
        )}
      </div>

      {error && <p className="error mt3">{error}</p>}

      {total === 0 ? (
        <div className="card muted mt4" style={{ textAlign: "center", padding: "28px 16px", lineHeight: 1.7 }}>
          아직 등록한 액션이 없어.<br />
          <Link href="/dashboard" className="link-tiny">리포트</Link>를 받고 코칭 액션을 등록하거나, 위에서 직접 추가해봐.
        </div>
      ) : (
        <>
          {GROUP_ORDER.map((g) => {
            const groupItems = active.filter((x) => x.timeframe === g);
            if (groupItems.length === 0) return null;
            return (
              <div key={g || "etc"} className="mt5">
                <p className="ap-group-h">{GROUP_LABEL[g]}</p>
                <ul className="ap-list">
                  {groupItems.map((it) => <Row key={it.id} it={it} onToggle={toggle} onRemove={remove} />)}
                </ul>
              </div>
            );
          })}

          {active.length === 0 && (
            <p className="muted mt5" style={{ textAlign: "center" }}>다 해냈네. 멋지다 진짜 👏</p>
          )}

          {done.length > 0 && (
            <details className="ap-done-wrap mt5">
              <summary className="ap-group-h ap-done-summary">완료한 액션 ({done.length})</summary>
              <ul className="ap-list mt3">
                {done.map((it) => <Row key={it.id} it={it} onToggle={toggle} onRemove={remove} />)}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  it,
  onToggle,
  onRemove,
}: {
  it: ActionItem;
  onToggle: (it: ActionItem) => void;
  onRemove: (it: ActionItem) => void;
}) {
  return (
    <li className={`ap-item${it.done ? " done" : ""}`}>
      <label className="ap-check">
        <input type="checkbox" checked={it.done} onChange={() => onToggle(it)} />
      </label>
      <div className="ap-item-body">
        <p className="ap-item-title">{it.title}</p>
        <div className="ap-item-meta">
          {it.timeframe && <span className="ap-when" data-when={it.timeframe}>{it.timeframe}</span>}
          <span className="ap-src">{it.sourceLabel}</span>
          {it.hint && <span className="ap-item-hint">{it.hint}</span>}
        </div>
      </div>
      <button type="button" className="ap-del" aria-label="삭제" onClick={() => onRemove(it)}>×</button>
    </li>
  );
}
