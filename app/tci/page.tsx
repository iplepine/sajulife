"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getInterleavedItems,
  LIKERT_SCALE,
  type TciItem,
} from "@/lib/tci/questions";
import type { TciVariant } from "@/lib/store/types";

type SaveState = "idle" | "saving" | "saved" | "error";

const VARIANT_LABEL: Record<TciVariant, { title: string; subtitle: string; description: string; estimate: string }> = {
  short: {
    title: "약식 (35문항)",
    subtitle: "7차원 빠른 진단",
    description: "기질-성격 7차원을 빠르게 가늠합니다. 차원당 5문항.",
    estimate: "약 3~5분",
  },
  full: {
    title: "정식 (140문항)",
    subtitle: "7차원 + 28하위척도 정밀 진단",
    description: "탐색 흥분·예기불안 등 하위척도까지 잡아 차원 안에서의 결을 본다.",
    estimate: "약 10~15분",
  },
};

export default function TciSurveyPage() {
  return (
    <Suspense fallback={<div className="page muted">불러오는 중...</div>}>
      <TciSurveyInner />
    </Suspense>
  );
}

function TciSurveyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawVariant = searchParams.get("variant");
  const variant: TciVariant | null = rawVariant === "short" || rawVariant === "full" ? rawVariant : null;

  // 변형 선택 안 됨 → 변형 선택 화면.
  if (!variant) return <VariantPicker />;
  return <SurveyRunner variant={variant} router={router} />;
}

function VariantPicker() {
  const [shortHas, setShortHas] = useState<boolean | null>(null);
  const [fullHas, setFullHas] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/tci/answers?variant=short").then((r) => r.json()).then((d) => setShortHas(!!d.tci?.answers));
    fetch("/api/tci/answers?variant=full").then((r) => r.json()).then((d) => setFullHas(!!d.tci?.answers));
  }, []);

  return (
    <div className="page-narrow">
      <h2 className="h-app">기질 검사</h2>
      <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
        두 가지 검사 중 하나를 골라 시작하세요. 두 검사는 따로 저장되며, 둘 다 풀어둘 수 있어요.
      </p>

      <div className="stack mt5" style={{ gap: 12 }}>
        {(["short", "full"] as const).map((v) => {
          const meta = VARIANT_LABEL[v];
          const has = v === "short" ? shortHas : fullHas;
          return (
            <Link
              key={v}
              href={`/tci?variant=${v}`}
              className="card"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div className="row between center wrap">
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{meta.title}</div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{meta.subtitle}</div>
                </div>
                {has && <span className="chip" style={{ fontSize: 11 }}>이어서 풀기</span>}
              </div>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, margin: "10px 0 6px" }}>
                {meta.description}
              </p>
              <div className="muted" style={{ fontSize: 12 }}>{meta.estimate}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SurveyRunner({ variant, router }: { variant: TciVariant; router: ReturnType<typeof useRouter> }) {
  const [items, setItems] = useState<TciItem[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  // 1) 문항 로드 (정식판은 동적 import).
  useEffect(() => {
    let cancelled = false;
    getInterleavedItems(variant).then((list) => {
      if (cancelled) return;
      setItems(list);
    });
    return () => { cancelled = true; };
  }, [variant]);

  // 2) 응답 로드 + 이어서 시작 지점 계산.
  useEffect(() => {
    if (!items) return;
    fetch(`/api/tci/answers?variant=${variant}`)
      .then((r) => r.json())
      .then((d) => {
        const a: Record<string, number> = d.tci?.answers ?? {};
        setAnswers(a);
        const firstUnanswered = items.findIndex((it) => a[it.id] == null);
        setIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
        setLoaded(true);
      });
  }, [items, variant]);

  // 3) 변경 시 디바운스 자동 저장.
  useEffect(() => {
    if (!loaded || Object.keys(answers).length === 0) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      const res = await fetch("/api/tci/answers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, answers }),
      });
      setSaveState(res.ok ? "saved" : "error");
    }, 400);
    return () => clearTimeout(t);
  }, [answers, loaded, variant]);

  if (!loaded || !items) return <div className="page muted">불러오는 중...</div>;

  // 정식판이 비어있는 케이스 — 안내 화면.
  if (items.length === 0) {
    return (
      <div className="page-narrow">
        <h2 className="h-app">{VARIANT_LABEL[variant].title}</h2>
        <div className="card mt5">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            정식판 문항이 아직 비어 있어요. 운영팀이 보유한 라이선스 자료에서{" "}
            <code>lib/tci/questions-rs.ts</code>의 <code>TCI_RS_ITEMS</code> 배열에
            140문항을 채워 넣어 주세요. 채워지면 이 화면이 자동으로 검사 진행 화면으로 바뀝니다.
          </p>
          <p className="muted mt3" style={{ fontSize: 12 }}>
            그 동안에는 약식 검사를 사용할 수 있어요.
          </p>
          <div className="row gap2 mt4">
            <Link href="/tci?variant=short" className="btn btn-primary" style={{ textDecoration: "none" }}>약식 검사로 시작</Link>
            <Link href="/tci" className="btn btn-ghost" style={{ textDecoration: "none" }}>← 검사 선택으로</Link>
          </div>
        </div>
      </div>
    );
  }

  const total = items.length;
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
    if (!items) return;
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

  return (
    <div className="page-narrow">
      <div className="row gap3">
        <div className="prog grow"><span style={{ width: `${((idx + 1) / total) * 100}%` }} /></div>
        <span className="muted mono" style={{ fontSize: 12 }}>{idx + 1} / {total}</span>
      </div>
      <div className="row between mt2" style={{ fontSize: 12 }}>
        <span className="muted">
          {saveState === "saving" ? "저장 중…" : saveState === "saved" ? "자동 저장됨" : saveState === "error" ? "저장 실패" : `진행 ${done} / ${total}`}
        </span>
        <Link href="/tci" className="link-tiny">← 검사 선택</Link>
      </div>

      <div style={{ marginTop: 28 }}>
        <div className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em" }}>
          {VARIANT_LABEL[variant].title.split(" ")[0]} · {idx + 1}번 문항
        </div>
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
