"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { ConsultBasis, ConsultSummary, SavedConsult } from "@/lib/store/types";

type Availability = { hasProfile: boolean; hasTci: boolean; hasFamily: boolean };
type ConsultResponse = {
  record: SavedConsult;
  debug: { prompt: string; model: string; provider: string };
};

type BasisOption = {
  value: ConsultBasis;
  label: string;
  desc: string;
  requires: (a: Availability) => string | null;
};

const OPTIONS: BasisOption[] = [
  { value: "fusion", label: "기질 + 사주", desc: "가장 풍부한 답변. 추천.", requires: (a) => (!a.hasProfile ? "사주 정보 필요" : !a.hasTci ? "기질 검사 필요" : null) },
  { value: "tci", label: "기질만", desc: "TCI 7차원 점수 기반.", requires: (a) => (!a.hasTci ? "기질 검사 필요" : null) },
  { value: "saju", label: "사주만", desc: "만세력 4기둥·오행 기반.", requires: (a) => (!a.hasProfile ? "사주 정보 필요" : null) },
  { value: "family", label: "가족 사주", desc: "본인 + 가족 사주.", requires: (a) => (!a.hasProfile ? "사주 정보 필요" : !a.hasFamily ? "가족 1명 이상 필요" : null) },
];

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

export default function ConsultPage() {
  return (
    <Suspense fallback={<div className="page muted">불러오는 중...</div>}>
      <ConsultPageInner />
    </Suspense>
  );
}

function ConsultPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [avail, setAvail] = useState<Availability | null>(null);
  const [basis, setBasis] = useState<ConsultBasis>("fusion");
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ConsultSummary[]>([]);
  const [record, setRecord] = useState<SavedConsult | null>(null);
  const [lastDebug, setLastDebug] = useState<ConsultResponse["debug"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // 초기 로드: 가용성 + 히스토리.
  useEffect(() => {
    (async () => {
      const [p, t, f, h] = await Promise.all([
        fetch("/api/profile").then((r) => r.json()).catch(() => ({})),
        fetch("/api/tci/answers").then((r) => r.json()).catch(() => ({})),
        fetch("/api/family").then((r) => r.json()).catch(() => ({})),
        fetch("/api/consult").then((r) => r.json()).catch(() => ({ history: [] })),
      ]);
      const a: Availability = {
        hasProfile: !!p.profile,
        hasTci: !!t.tci,
        hasFamily: !!f.family?.members && f.family.members.length > 0,
      };
      setAvail(a);
      setHistory(h.history ?? []);
      const firstAvailable = OPTIONS.find((o) => o.requires(a) === null);
      if (firstAvailable) setBasis(firstAvailable.value);
    })();
  }, []);

  // URL의 ?id 변동 시 단건 로드. 새로 생성한 직후엔 record가 이미 세팅돼 있으므로 skip.
  useEffect(() => {
    if (!id) { setRecord(null); setLastDebug(null); return; }
    setRecord((prev) => (prev?.id === id ? prev : null));
    setRecordLoading(true);
    fetch(`/api/consult/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "상담을 찾을 수 없어요.");
        return r.json();
      })
      .then((d: { record: SavedConsult }) => { setRecord(d.record); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setRecordLoading(false));
  }, [id]);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q) { setError("질문을 입력하세요."); return; }
    setError(null);
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
      setRecord(ok.record);
      setLastDebug(ok.debug);
      setHistory((prev) => [
        {
          id: ok.record.id,
          question: ok.record.question,
          basis: ok.record.basis,
          basisLabel: ok.record.basisLabel,
          generatedAt: ok.record.generatedAt,
        },
        ...prev,
      ]);
      setQuestion("");
      router.replace(`/consult?id=${ok.record.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [question, basis, router]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!loading) void ask();
    }
  }

  const basisOpt = OPTIONS.find((o) => o.value === basis);
  const basisLabel = basisOpt?.label ?? "";
  const blockedReason = avail && basisOpt ? basisOpt.requires(avail) : null;

  return (
    <div className="page">
      <div className="report-grid">
        <div className="consult-main">
          <h2 className="h-app">AI 상담</h2>

          {/* 단건 리포트 뷰 */}
          {id ? (
            <>
              {recordLoading && !record && <p className="muted mt4">불러오는 중...</p>}
              {record && (
                <>
                  <div className="row gap2 mt2 wrap">
                    <span className="chip"><span className="el-dot el-dot-natal" />{record.basisLabel}</span>
                    <span className="chip muted">{new Date(record.generatedAt).toLocaleString("ko-KR")}</span>
                  </div>

                  <div className="card mt4">
                    <div className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>질문</div>
                    <p className="mt2" style={{ fontSize: 15, lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{record.question}</p>
                  </div>

                  <div className="card mt3">
                    <div className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>답변</div>
                    <div className="report mt2">{record.answer}</div>
                  </div>

                  <div className="row gap2 mt4 wrap">
                    <Link href="/consult" className="btn btn-primary" style={{ textDecoration: "none" }}>새 상담 시작</Link>
                    {lastDebug && (
                      <button className="btn btn-ghost" onClick={() => setShowDebug((v) => !v)}>
                        {showDebug ? "디버그 숨기기" : "디버그 보기"}
                      </button>
                    )}
                  </div>

                  {showDebug && lastDebug && (
                    <div className="card mt3">
                      <div className="muted">model: {lastDebug.provider} / {lastDebug.model}</div>
                      <h4>렌더된 프롬프트</h4>
                      <pre className="debug-pre">{lastDebug.prompt}</pre>
                    </div>
                  )}
                </>
              )}
              {error && <p className="error mt3">{error}</p>}
            </>
          ) : (
            /* 입력 폼 뷰 */
            <>
              <div className="ai-tag mt2"><span className="dot" />근거: {basisLabel}{blockedReason ? ` (${blockedReason})` : ""}</div>

              <div className="card mt4">
                <label className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>고민·질문</label>
                <textarea
                  className="consult-input mt2"
                  rows={6}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="요즘 가장 마음에 걸리는 일을 편하게 적어보세요. (⌘+Enter로 보내기)"
                  maxLength={1000}
                />
                <div className="row between mt2">
                  <span className="muted" style={{ fontSize: 12 }}>{question.length}/1000</span>
                  <button
                    className="btn btn-primary"
                    onClick={ask}
                    disabled={loading || !avail || !!blockedReason}
                  >
                    {loading ? "상담 중…" : "상담 요청"}
                  </button>
                </div>
              </div>

              {error && <p className="error mt3">{error}</p>}

              {history.length === 0 && (
                <p className="muted mt4" style={{ fontSize: 13 }}>
                  첫 상담을 시작해보세요. 결과는 자동으로 저장돼 나중에 다시 볼 수 있어요.
                </p>
              )}
            </>
          )}
        </div>

        <aside className="rail">
          {!id && (
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
          )}

          <div className="card">
            <div className="row between center">
              <div className="ai-tag"><span className="dot" />지난 상담</div>
              {id && <Link href="/consult" className="link-tiny">새 상담</Link>}
            </div>
            {history.length === 0 ? (
              <p className="muted mt3" style={{ fontSize: 12, margin: "12px 0 0" }}>아직 기록이 없어요.</p>
            ) : (
              <ul className="history-list mt3">
                {history.map((h) => {
                  const active = h.id === id;
                  return (
                    <li key={h.id}>
                      <Link
                        href={`/consult?id=${h.id}`}
                        className={`history-item${active ? " active" : ""}`}
                      >
                        <div className="history-q">{h.question}</div>
                        <div className="history-meta">
                          <span>{h.basisLabel}</span>
                          <span>·</span>
                          <span>{relativeTime(h.generatedAt)}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
