"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import GenerateLoading from "@/components/GenerateLoading";
import type { ConsultSummary, ReportKind, SavedConsult } from "@/lib/store/types";

const CONSULT_MESSAGES = [
  "고민을 차분히 들여다보는 중이에요…",
  "당신의 기질과 사주에 비추어 보는 중이에요…",
  "도움이 될 이야기를 골라 쓰는 중이에요…",
];

/** 근거 안내 라인용 짧은 라벨. */
const SOURCE_SHORT: Record<ReportKind, string> = {
  fusion: "융합",
  personal: "개인 사주",
  tci: "기질",
  family: "가족 사주",
};

type ConsultMeta = { sources: ReportKind[]; hasProfile: boolean };
type ConsultResponse = {
  record: SavedConsult;
  debug: { prompt: string; model: string; provider: string };
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

  const [meta, setMeta] = useState<ConsultMeta | null>(null);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ConsultSummary[]>([]);
  const [record, setRecord] = useState<SavedConsult | null>(null);
  const [lastDebug, setLastDebug] = useState<ConsultResponse["debug"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // 초기 로드: 히스토리 + 근거로 쓸 리포트 목록 + 프로필 유무.
  useEffect(() => {
    fetch("/api/consult")
      .then((r) => r.json())
      .catch(() => ({ history: [], sources: [], hasProfile: false }))
      .then((d) => {
        setHistory(d.history ?? []);
        setMeta({ sources: d.sources ?? [], hasProfile: !!d.hasProfile });
      });
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
        body: JSON.stringify({ question: q }),
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
  }, [question, router]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!loading) void ask();
    }
  }

  const sources = meta?.sources ?? [];
  const hasProfile = meta?.hasProfile ?? false;
  const sourceText = sources.length
    ? `근거로 쓰는 리포트: ${sources.map((k) => SOURCE_SHORT[k]).join("·")}`
    : "아직 만든 리포트가 없어 — 기본 사주 정보로 답할게.";

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
                    <ReportView className="mt2" plain text={record.answer} />
                  </div>

                  <ActionPlanRegister actions={record.actions ?? []} source="consult" sourceLabel="AI 상담" />

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
              <div className="ai-tag mt2"><span className="dot" />{sourceText}</div>

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
                    disabled={loading || !meta || !hasProfile}
                  >
                    {loading ? "상담 중…" : "상담 요청"}
                  </button>
                </div>
              </div>

              {meta && !hasProfile && (
                <p className="muted mt3" style={{ fontSize: 13 }}>
                  먼저 <Link href="/onboarding">사주 정보</Link>를 입력하면 상담을 시작할 수 있어요.
                </p>
              )}

              {loading && <GenerateLoading messages={CONSULT_MESSAGES} note="질문을 읽고 답을 써 내려가는 중이라 시간이 좀 걸려요. 창을 닫지 말고 기다려 주세요." className="mt3" />}

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
              {sources.length > 0 ? (
                <>
                  <p className="muted mt3" style={{ fontSize: 12, margin: "12px 0 0" }}>
                    네가 만든 리포트를 모두 근거로 삼아 답해. 따로 고를 필요 없어.
                  </p>
                  <div className="row gap2 mt3 wrap">
                    {sources.map((k) => (
                      <span key={k} className="chip">{SOURCE_SHORT[k]}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="muted mt3" style={{ fontSize: 12, margin: "12px 0 0" }}>
                  아직 만든 리포트가 없어. 사주·기질·융합·가족 리포트를 만들면 상담이 자동으로 그
                  내용을 근거로 삼아 더 정확해져.
                </p>
              )}
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
