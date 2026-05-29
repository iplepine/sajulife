"use client";

import { useEffect, useRef, useState } from "react";
import type { ConsultBasis } from "@/lib/store/types";

type Availability = { hasProfile: boolean; hasTci: boolean; hasFamily: boolean };
type ConsultResponse = { answer: string; basis: ConsultBasis; basisLabel: string; debug: { prompt: string; model: string; provider: string } };
type Msg = { role: "ai" | "me"; text: string };

type BasisOption = {
  value: ConsultBasis; label: string; desc: string;
  requires: (a: Availability) => string | null;
};

const OPTIONS: BasisOption[] = [
  { value: "fusion", label: "기질 + 사주", desc: "가장 풍부한 답변. 추천.", requires: (a) => (!a.hasProfile ? "사주 정보 필요" : !a.hasTci ? "기질 검사 필요" : null) },
  { value: "tci", label: "기질만", desc: "TCI 7차원 점수 기반.", requires: (a) => (!a.hasTci ? "기질 검사 필요" : null) },
  { value: "saju", label: "사주만", desc: "만세력 4기둥·오행 기반.", requires: (a) => (!a.hasProfile ? "사주 정보 필요" : null) },
  { value: "family", label: "가족 사주", desc: "본인 + 가족 사주.", requires: (a) => (!a.hasProfile ? "사주 정보 필요" : !a.hasFamily ? "가족 1명 이상 필요" : null) },
];

const GREETING = "안녕하세요. 사주와 기질을 함께 보고 있어요. 요즘 가장 마음에 걸리는 건 무엇인가요?";

export default function ConsultPage() {
  const [avail, setAvail] = useState<Availability | null>(null);
  const [basis, setBasis] = useState<ConsultBasis>("fusion");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: GREETING }]);
  const [lastDebug, setLastDebug] = useState<ConsultResponse["debug"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [p, t, f] = await Promise.all([
        fetch("/api/profile").then((r) => r.json()).catch(() => ({})),
        fetch("/api/tci/answers").then((r) => r.json()).catch(() => ({})),
        fetch("/api/family").then((r) => r.json()).catch(() => ({})),
      ]);
      const a: Availability = {
        hasProfile: !!p.profile,
        hasTci: !!t.tci,
        hasFamily: !!f.family?.members && f.family.members.length > 0,
      };
      setAvail(a);
      const firstAvailable = OPTIONS.find((o) => o.requires(a) === null);
      if (firstAvailable) setBasis(firstAvailable.value);
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask() {
    const q = question.trim();
    if (!q) { setError("질문을 입력하세요."); return; }
    setError(null);
    setMessages((m) => [...m, { role: "me", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, basis }),
      });
      const text = await res.text();
      let d: ConsultResponse | { error?: string } = {};
      try { d = text ? JSON.parse(text) : {}; }
      catch { d = { error: `서버 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 200)}` }; }
      if (!res.ok) {
        setError(("error" in d && d.error) || `상담 실패 (HTTP ${res.status})`);
        return;
      }
      const ok = d as ConsultResponse;
      setMessages((m) => [...m, { role: "ai", text: ok.answer }]);
      setLastDebug(ok.debug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) void ask();
    }
  }

  const basisLabel = OPTIONS.find((o) => o.value === basis)?.label ?? "";

  return (
    <div className="page">
      <div className="consult-grid">
        <div className="chat-col">
          <h2 className="h-app">AI 상담</h2>
          <div className="ai-tag mt2"><span className="dot" />근거: {basisLabel}</div>

          <div className="chat mt4">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="bubble ai muted">생각 중…</div>}
            <div ref={endRef} />
          </div>

          {error && <p className="error mt3">{error}</p>}

          <div className="composer">
            <textarea
              className="ci" rows={1} value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="고민을 편하게 적어보세요"
            />
            <button className="send" aria-label="보내기" onClick={ask} disabled={loading || !avail}>↑</button>
          </div>

          {lastDebug && (
            <>
              <button className="btn btn-ghost btn-sm mt3" onClick={() => setShowDebug((v) => !v)}>
                {showDebug ? "디버그 숨기기" : "디버그 보기"}
              </button>
              {showDebug && (
                <div className="card mt3">
                  <div className="muted">model: {lastDebug.provider} / {lastDebug.model}</div>
                  <h4>렌더된 프롬프트</h4>
                  <pre className="debug-pre">{lastDebug.prompt}</pre>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="rail">
          <div className="card">
            <div className="ai-tag"><span className="dot" />답변 근거</div>
            <div className="stack mt3" style={{ gap: 8 }}>
              {OPTIONS.map((opt) => {
                const blocked = avail ? opt.requires(avail) : null;
                const disabled = !!blocked;
                const checked = basis === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => !disabled && setBasis(opt.value)}
                    disabled={disabled}
                    className="card"
                    style={{
                      textAlign: "left", padding: 12, cursor: disabled ? "not-allowed" : "pointer",
                      boxShadow: checked ? "inset 0 0 0 1.5px var(--text)" : "none",
                      background: disabled ? "var(--surface-2)" : "var(--surface)",
                      opacity: disabled ? 0.6 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{blocked ? `⚠ ${blocked}` : opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="card card-flat">
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              답변은 선택한 근거를 바탕으로 생성됩니다. 리포트를 갱신하면 상담도 함께 반영돼요.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
