"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { INTERLEAVED_TCI_ITEMS, LIKERT_SCALE } from "@/lib/tci/questions";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function TciSurveyPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const items = INTERLEAVED_TCI_ITEMS;
  const total = items.length;

  useEffect(() => {
    fetch("/api/tci/answers")
      .then((r) => r.json())
      .then((d) => {
        const a: Record<string, number> = d.tci?.answers ?? {};
        setAnswers(a);
        // 처음으로 응답하지 않은 문항에서 이어 시작.
        const firstUnanswered = items.findIndex((it) => a[it.id] == null);
        setIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 변경 시 400ms 디바운스 자동 저장
  useEffect(() => {
    if (!loaded || Object.keys(answers).length === 0) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      const res = await fetch("/api/tci/answers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      setSaveState(res.ok ? "saved" : "error");
    }, 400);
    return () => clearTimeout(t);
  }, [answers, loaded]);

  const done = items.filter((it) => answers[it.id] != null).length;
  const current = items[idx];
  const next = items[idx + 1];
  const answeredCurrent = current && answers[current.id] != null;
  const isLast = idx === total - 1;

  function setAnswer(id: string, value: number) {
    setError(null);
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function goNext() {
    if (!answeredCurrent) {
      setError("문항을 선택해 주세요.");
      return;
    }
    if (isLast) {
      const firstUnanswered = items.findIndex((it) => answers[it.id] == null);
      if (firstUnanswered !== -1) {
        setIdx(firstUnanswered);
        setError(`아직 답하지 않은 문항이 있어요 (${total - done}개).`);
        return;
      }
      router.push("/tci/report");
      return;
    }
    setIdx((i) => Math.min(total - 1, i + 1));
  }

  if (!loaded) return <div className="page muted">불러오는 중...</div>;

  return (
    <div className="page-narrow">
      <div className="row gap3">
        <div className="prog grow"><span style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>
        <span className="muted mono" style={{ fontSize: 12 }}>{idx + 1} / {total}</span>
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
        {saveState === "saving" ? "저장 중…" : saveState === "saved" ? "자동 저장됨" : saveState === "error" ? "저장 실패" : `진행 ${done} / ${total}`}
      </div>

      <div style={{ marginTop: 28 }}>
        <div className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>{idx + 1}번 문항</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, margin: "12px 0 0", letterSpacing: "-.01em" }}>
          {current.text}
        </h2>
      </div>

      <div className="likert mt6" role="radiogroup" aria-label={current.text}>
        {LIKERT_SCALE.map((s) => (
          <label key={s.value}>
            <input
              type="radio"
              name={current.id}
              checked={answers[current.id] === s.value}
              onChange={() => setAnswer(current.id, s.value)}
            />
            <span className="ring" aria-hidden />
            <small>{s.label}</small>
          </label>
        ))}
      </div>

      {next && (
        <>
          <p className="h-sec mt6" style={{ marginBottom: 8 }}>다음 문항 미리보기</p>
          <div className="card" style={{ opacity: 0.55 }}>
            <p style={{ fontSize: 14, margin: 0 }}>{idx + 2}. {next.text}</p>
          </div>
        </>
      )}

      {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

      <div className="row gap3 mt6">
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
          이전
        </button>
        <button className="btn btn-primary" style={{ flex: 2 }} onClick={goNext}>
          {isLast ? "리포트 보기" : "다음 문항"}
        </button>
      </div>
    </div>
  );
}
