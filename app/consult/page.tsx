"use client";

import { useEffect, useState } from "react";
import type { ConsultBasis } from "@/lib/store/types";

type Availability = {
  hasProfile: boolean;
  hasTci: boolean;
  hasFamily: boolean;
};

type ConsultResponse = {
  answer: string;
  basis: ConsultBasis;
  basisLabel: string;
  debug: { prompt: string; model: string; provider: string };
};

type BasisOption = {
  value: ConsultBasis;
  label: string;
  desc: string;
  requires: (a: Availability) => string | null; // 부족하면 사유 반환
};

const OPTIONS: BasisOption[] = [
  {
    value: "fusion",
    label: "기질 + 사주",
    desc: "두 데이터를 함께 보는 가장 풍부한 답변. 추천.",
    requires: (a) => (!a.hasProfile ? "사주 정보 필요" : !a.hasTci ? "기질 검사 필요" : null),
  },
  {
    value: "tci",
    label: "기질만",
    desc: "TCI 7차원 점수 기반.",
    requires: (a) => (!a.hasTci ? "기질 검사 필요" : null),
  },
  {
    value: "saju",
    label: "사주만",
    desc: "만세력 4기둥·오행 기반.",
    requires: (a) => (!a.hasProfile ? "사주 정보 필요" : null),
  },
  {
    value: "family",
    label: "가족 사주",
    desc: "본인 + 등록된 가족 사주 함께 본 답변.",
    requires: (a) =>
      !a.hasProfile ? "사주 정보 필요" : !a.hasFamily ? "가족 구성원 1명 이상 필요" : null,
  },
];

export default function ConsultPage() {
  const [avail, setAvail] = useState<Availability | null>(null);
  const [basis, setBasis] = useState<ConsultBasis>("fusion");
  const [question, setQuestion] = useState("");
  const [data, setData] = useState<ConsultResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // 사용자가 가진 데이터로 어떤 베이스가 가능한지 판정
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
      // 가능한 첫 옵션으로 기본 선택
      const firstAvailable = OPTIONS.find((o) => o.requires(a) === null);
      if (firstAvailable) setBasis(firstAvailable.value);
    })();
  }, []);

  async function ask() {
    if (!question.trim()) {
      setError("질문을 입력하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), basis }),
      });
      const text = await res.text();
      let d: ConsultResponse | { error?: string } = {};
      try { d = text ? JSON.parse(text) : {}; }
      catch { d = { error: `서버 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 200)}` }; }
      if (!res.ok) {
        setError(("error" in d && d.error) || `상담 실패 (HTTP ${res.status})`);
        return;
      }
      setData(d as ConsultResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>상담하기</h1>
      <p className="muted">
        궁금한 점을 적고, 어떤 정보를 근거로 답변받을지 선택하세요.
      </p>

      <section className="card stack" style={{ marginTop: 16 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>1. 답변의 근거를 선택</div>
          <div className="consult-basis">
            {OPTIONS.map((opt) => {
              const blocked = avail ? opt.requires(avail) : null;
              const disabled = !!blocked;
              const checked = basis === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`basis-option${checked ? " is-checked" : ""}${disabled ? " is-disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name="basis"
                    value={opt.value}
                    checked={checked}
                    onChange={() => !disabled && setBasis(opt.value)}
                    disabled={disabled}
                  />
                  <div className="basis-body">
                    <div className="basis-title">{opt.label}</div>
                    <div className="basis-desc">{opt.desc}</div>
                    {blocked && <div className="basis-blocked">⚠ {blocked}</div>}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <label>
          <span style={{ fontWeight: 600 }}>2. 질문 입력</span>
          <textarea
            rows={5}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="예: 이직을 고민 중인데, 지금이 움직이기 좋은 시기일까요?"
            style={{ width: "100%", fontFamily: "inherit", fontSize: 15 }}
          />
        </label>

        {error && <div className="error">{error}</div>}

        <div className="row">
          <button className="btn--primary" onClick={ask} disabled={loading || !avail}>
            {loading ? "생각 중..." : "질문하기"}
          </button>
          {data?.debug && (
            <button className="btn--ghost" onClick={() => setShowDebug((v) => !v)}>
              {showDebug ? "디버그 숨기기" : "디버그 보기"}
            </button>
          )}
        </div>
      </section>

      {data && (
        <>
          <section className="card" style={{ marginTop: 16 }}>
            <div className="muted" style={{ marginBottom: 8 }}>
              근거: {data.basisLabel}
            </div>
            <div className="report">{data.answer}</div>
          </section>
          {showDebug && (
            <section className="card" style={{ marginTop: 16 }}>
              <div className="muted">model: {data.debug.provider} / {data.debug.model}</div>
              <h4>렌더된 프롬프트</h4>
              <pre className="debug-pre">{data.debug.prompt}</pre>
            </section>
          )}
        </>
      )}
    </main>
  );
}
