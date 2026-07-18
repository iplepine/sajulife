"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import GenerateLoading from "@/components/GenerateLoading";
import PageLoading from "@/components/PageLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import type { ConsultSummary, SavedConsult } from "@/lib/store/types";
import { trackEvent } from "@/lib/analytics";

const CONSULT_MESSAGES = [
  "용신 흐름과 고민을 맞춰 보는 중이에요…",
  "지금 힘을 줄 곳을 정리하는 중이에요…",
  "현실에서 쓸 수 있는 방향을 고르는 중이에요…",
];

type ConsultMeta = { hasProfile: boolean };
type ConsultResponse = {
  record: SavedConsult;
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
    <Suspense fallback={<main className="page"><PageLoading label="용신상담을 준비하고 있어요" /></main>}>
      <ConsultPageInner />
    </Suspense>
  );
}

function ConsultPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const draftQuestion = searchParams.get("q")?.slice(0, 1000) ?? "";

  const [meta, setMeta] = useState<ConsultMeta | null>(null);
  const [question, setQuestion] = useState(() => draftQuestion);
  const [history, setHistory] = useState<ConsultSummary[]>([]);
  const [record, setRecord] = useState<SavedConsult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 로드: 히스토리 + 사주 정보 유무.
  useEffect(() => {
    fetch("/api/consult")
      .then((r) => r.json())
      .catch(() => ({ history: [], hasProfile: false }))
      .then((d) => {
        setHistory(d.history ?? []);
        setMeta({ hasProfile: !!d.hasProfile });
      });
  }, []);

  // URL의 ?id 변동 시 단건 로드. 새로 생성한 직후엔 record가 이미 세팅돼 있으므로 skip.
  useEffect(() => {
    if (!id) { setRecord(null); return; }
    setRecord((prev) => (prev?.id === id ? prev : null));
    setRecordLoading(true);
    fetch(`/api/consult/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "용신상담 기록을 찾을 수 없어요.");
        return r.json();
      })
      .then((d: { record: SavedConsult }) => { setRecord(d.record); setError(null); })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setRecordLoading(false));
  }, [id]);

  useEffect(() => {
    if (id || !draftQuestion) return;
    setQuestion((prev) => (prev.trim() ? prev : draftQuestion));
  }, [draftQuestion, id]);

  const ask = useCallback(async () => {
    const q = question.trim();
    if (!q) { setError("질문을 입력하세요."); return; }
    if (!meta?.hasProfile) { setError("용신상담을 하려면 먼저 사주 정보를 입력하세요."); return; }
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
        setError(("error" in d && d.error) || `용신상담 실패 (HTTP ${res.status})`);
        return;
      }
      const ok = d as ConsultResponse;
      setRecord(ok.record);
      trackEvent("consult_asked");
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
  }, [meta, question, router]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!loading) void ask();
    }
  }

  const hasProfile = meta?.hasProfile ?? false;
  const canAsk = hasProfile;
  const questionPlaceholder = "지금 망설이는 선택이나 막히는 일을 적어줘. 내 용신 흐름을 기준으로 풀어볼게. (⌘+Enter로 보내기)";

  return (
    <div className="page">
      <div className="report-grid">
        <div className="consult-main">
          <div className="report-person-head">
            <h1 className="h-app">용신상담</h1>
            <PersonSwitcher nameOnly reloadPath="/consult" />
          </div>
          <p className="lead mt2">내 용신을 기준으로 고민을 정리하고, 지금 힘을 줄 곳을 찾아봐.</p>

          {/* 단건 풀이 뷰 */}
          {id ? (
            <>
              {recordLoading && !record && <PageLoading compact label="용신상담 기록을 불러오고 있어요" />}
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
                    <div className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>용신 답변</div>
                    <ReportView className="mt2" plain text={record.answer} mode="consult" />
                  </div>

                  <ActionPlanRegister actions={record.actions ?? []} source="consult" sourceLabel="용신상담" />

                  <div className="row gap2 mt4 wrap">
                    <Link href="/consult" className="btn btn-primary" style={{ textDecoration: "none" }}>새 용신상담</Link>
                  </div>
                </>
              )}
              {error && <p className="error mt3">{error}</p>}
            </>
          ) : (
            /* 입력 폼 뷰 */
            <>
              {!meta ? (
                <PageLoading compact label="용신 정보를 확인하고 있어요" />
              ) : !hasProfile ? (
                <div className="card mt4">
                  <b style={{ fontSize: 15 }}>사주 정보를 먼저 입력해줘</b>
                  <p className="muted mt2" style={{ fontSize: 13, lineHeight: 1.6 }}>
                    용신상담은 입력한 사주로 계산한 용신을 기준으로 답해. 기본 정보를 입력하면 바로 시작할 수 있어.
                  </p>
                  <Link href="/onboarding?next=/consult" className="btn btn-primary mt3" style={{ textDecoration: "none" }}>
                    사주 정보 입력하기
                  </Link>
                </div>
              ) : (
                <div className="card mt4">
                  <label className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>용신에게 물어보기</label>
                  <textarea
                    className="consult-input mt2"
                    rows={6}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={questionPlaceholder}
                    maxLength={1000}
                  />
                  <div className="row between mt2">
                    <span className="muted" style={{ fontSize: 12 }}>{question.length}/1000</span>
                    <button
                      className="btn btn-primary"
                      onClick={ask}
                      disabled={loading || !canAsk}
                    >
                      {loading ? "용신을 살피는 중…" : "용신상담 시작"}
                    </button>
                  </div>
                </div>
              )}

              {loading && <GenerateLoading messages={CONSULT_MESSAGES} note="용신 흐름과 질문을 맞춰 답을 정리하고 있어요. 창을 닫지 말고 기다려 주세요." className="mt3" />}

              {error && <p className="error mt3">{error}</p>}

              {history.length === 0 && (
                <p className="muted mt4" style={{ fontSize: 13 }}>
                  첫 용신상담을 시작해보세요. 결과는 자동으로 저장돼 나중에 다시 볼 수 있어요.
                </p>
              )}
            </>
          )}
        </div>

        <aside className="rail">
          <div className="card">
            <div className="row between center">
              <div className="ai-tag"><span className="dot" />지난 용신상담</div>
              {id && <Link href="/consult" className="link-tiny">새 질문</Link>}
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
