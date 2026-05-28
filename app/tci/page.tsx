"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { INTERLEAVED_TCI_ITEMS, LIKERT_SCALE } from "@/lib/tci/questions";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function TciSurveyPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tci/answers")
      .then((r) => r.json())
      .then((d) => {
        if (d.tci?.answers) setAnswers(d.tci.answers);
        setLoaded(true);
      });
  }, []);

  // 답안 변경 시 400ms 디바운스 후 자동 저장
  useEffect(() => {
    if (!loaded) return;
    if (Object.keys(answers).length === 0) return;
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

  const total = INTERLEAVED_TCI_ITEMS.length;
  const done = Object.keys(answers).filter((k) => answers[k] != null).length;

  function setAnswer(id: string, value: number) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  function goToReport() {
    if (done < total) {
      setError(`${total - done}개 문항이 남아있습니다.`);
      return;
    }
    setError(null);
    router.push("/tci/report");
  }

  function saveLabel(): string {
    switch (saveState) {
      case "saving": return "저장 중...";
      case "saved": return "자동 저장됨";
      case "error": return "저장 실패";
      default: return "";
    }
  }

  return (
    <main className="container">
      <h1>기질 설문</h1>
      <p className="muted">
        모두 {total}개의 문항입니다. 정답이 없으니, <strong>평소 자기 모습</strong>에 가까운 쪽을
        고르세요. 어떻게 보이고 싶은지가 아니라, 실제로 그런지로 답할 때 결과가 정확합니다.
        응답은 클릭할 때마다 자동 저장됩니다.
      </p>

      <div className="row row--between" style={{ marginTop: 8 }}>
        <div className="muted">진행 {done} / {total}</div>
        <div className="muted">{saveLabel()}</div>
      </div>

      <section className="card stack" style={{ marginTop: 16, gap: 20 }}>
        {INTERLEAVED_TCI_ITEMS.map((it, idx) => (
          <div key={it.id} className="tci-item">
            <div className="tci-item-text">
              <span className="tci-num">{idx + 1}.</span> {it.text}
            </div>
            <div className="likert" role="radiogroup" aria-label={it.text}>
              {LIKERT_SCALE.map((s) => (
                <label key={s.value}>
                  <input
                    type="radio"
                    name={it.id}
                    checked={answers[it.id] === s.value}
                    onChange={() => setAnswer(it.id, s.value)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      {error && <div className="error" style={{ marginTop: 16 }}>{error}</div>}
      <div className="row" style={{ marginTop: 24 }}>
        <button className="btn--primary btn--block" onClick={goToReport}>
          리포트 보기
        </button>
        <span className="muted">답안은 이미 저장됨 — 나중에 다시 와도 그대로 있어요.</span>
      </div>
    </main>
  );
}
