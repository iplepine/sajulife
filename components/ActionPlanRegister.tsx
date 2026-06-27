"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActionSource, SuggestedAction } from "@/lib/store/types";

/**
 * 풀이 하단에 붙는 "코칭 액션 플랜" 등록 카드.
 * 풀이가 생성될 때 함께 받은 액션 후보(SuggestedAction[])를 보여주고,
 * 골라서 기록(/history)에 액션 아이템으로 등록한다.
 * 후보가 없으면(옛 저장본 등) 아무것도 렌더하지 않는다.
 *
 * 톤: 제목·안내문은 반말(풀이 설명문구), 버튼 라벨은 중립 UI.
 */
export default function ActionPlanRegister({
  actions,
  source,
  sourceLabel,
}: {
  actions: SuggestedAction[];
  source: ActionSource;
  sourceLabel: string;
}) {
  const [registered, setRegistered] = useState<ReadonlySet<number>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!actions || actions.length === 0) return null;

  const allRegistered = registered.size === actions.length;

  async function register(indices: number[]) {
    const fresh = indices.filter((i) => !registered.has(i));
    if (fresh.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: fresh.map((i) => ({ ...actions[i], source, sourceLabel })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "등록에 실패했어요.");
        return;
      }
      setRegistered((prev) => {
        const next = new Set(prev);
        fresh.forEach((i) => next.add(i));
        return next;
      });
    } catch {
      setError("네트워크 오류로 등록에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card ap-suggest mt5">
      <div className="row between center">
        <div className="ai-tag"><span className="dot" />코칭 액션 플랜</div>
        {!allRegistered && (
          <button
            type="button"
            className="link-tiny"
            disabled={busy}
            onClick={() => register(actions.map((_, i) => i))}
          >
            전체 등록
          </button>
        )}
      </div>
      <p className="ap-suggest-guide">
        바로 실천할 액션만 골라 등록해. 기록에서 하나씩 체크하면 돼.
      </p>

      <ul className="ap-suggest-list">
        {actions.map((a, i) => {
          const on = registered.has(i);
          return (
            <li className="ap-suggest-row" key={i}>
              <div className="ap-suggest-main">
                <div className="ap-suggest-head">
                  {a.timeframe && (
                    <span className="ap-when" data-when={a.timeframe}>{a.timeframe}</span>
                  )}
                  <span className="ap-suggest-title">{a.title}</span>
                </div>
                {a.hint && <span className="ap-suggest-hint">{a.hint}</span>}
              </div>
              <button
                type="button"
                className={`btn btn-sm ${on ? "btn-ghost" : "btn-primary"}`}
                disabled={on || busy}
                onClick={() => register([i])}
              >
                {on ? "추가됨 ✓" : "등록"}
              </button>
            </li>
          );
        })}
      </ul>

      {registered.size > 0 && (
        <Link href="/history" className="ap-suggest-link">기록에서 보기 →</Link>
      )}
      {error && <p className="error mt2">{error}</p>}
    </div>
  );
}
