"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getInterleavedItems,
  LIKERT_SCALE,
  type TciItem,
} from "@/lib/tci/questions";
import { isValidTciAnswer, tciCompletionFromItems } from "@/lib/tci/completion";
import { TCI_STANDALONE_REPORT_ENABLED } from "@/lib/tci/standalone";
import type { TciVariant } from "@/lib/store/types";
import PageLoading from "@/components/PageLoading";
import { withGenerateIntent } from "@/lib/generation/intent";
import styles from "../account/WorkspaceForms.module.css";

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * 설문 명칭·설명 — ★코드가 실제로 하는 일과 어긋나지 않게 쓴다.★
 *
 * 예전 문구("약식/정식", "정밀 진단")는 이 설문을 ★공인 심리검사★로 오해하게 만들었다.
 * 실제로는 자체 문항으로 7개 경향을 채점할 뿐이고(lib/tci/scoring.ts), 여덟 번째 축인
 * ★유연성은 채점 데이터가 없어 보조로 가늠한 값★이다(app/api/tci/report의 FLEX=NN).
 * '약식/정식'은 같은 검사의 축약본·완본이라는 인상을 주므로 문항 수를 그대로 이름에 쓴다.
 */
const VARIANT_LABEL: Record<
  TciVariant,
  { title: string; shortLabel: string; subtitle: string; description: string; estimate: string }
> = {
  short: {
    title: "기본 35문항",
    shortLabel: "기본",
    subtitle: "기질·성격 경향 살펴보기",
    description: "설문 응답으로 7개 경향을 살펴봐요. 경향당 5문항이에요.",
    estimate: "약 3~5분",
  },
  full: {
    title: "확장 140문항",
    shortLabel: "확장",
    subtitle: "기질·성격 경향 자세히 살펴보기",
    description: "탐색 흥분·예기불안 같은 세부 결까지 나눠 물어봐요. 같은 7개 경향을 더 촘촘하게 봅니다.",
    estimate: "약 10~15분",
  },
};

export default function TciSurveyPage() {
  return (
    <Suspense fallback={<main className="page"><PageLoading label="기질 문항을 준비하고 있어요" /></main>}>
      <TciSurveyInner />
    </Suspense>
  );
}

function TciSurveyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawVariant = searchParams.get("variant");
  const variant: TciVariant | null = rawVariant === "short" || rawVariant === "full" ? rawVariant : null;

  // 사주+기질 풀이 흐름에서 왔으면(next=fusion) 검사를 마친 뒤 최종 통합 리포트로 이어간다.
  // 기질 단독 풀이가 꺼져 있으면(2026-10-15) 어디서 들어왔든 같은 길로 간다 — 단독 풀이로 끝나는 출구를 없앤다.
  const toFusion = searchParams.get("next") === "fusion" || !TCI_STANDALONE_REPORT_ENABLED;

  // 변형 선택 안 됨 → 변형 선택 화면.
  if (!variant) return <VariantPicker />;
  return <SurveyRunner variant={variant} router={router} toFusion={toFusion} />;
}

function VariantPicker() {
  // 사주+기질 흐름에서 왔다는 표시는 문항 선택 뒤에도 이어 붙인다 — 끝나면 최종 리포트로 간다.
  const nextQuery = useSearchParams().get("next") === "fusion" || !TCI_STANDALONE_REPORT_ENABLED ? "&next=fusion" : "";
  const [shortHas, setShortHas] = useState<boolean | null>(null);
  const [fullHas, setFullHas] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/tci/answers?variant=short").then((r) => r.json()).then((d) => setShortHas(!!d.tci?.answers));
    fetch("/api/tci/answers?variant=full").then((r) => r.json()).then((d) => setFullHas(!!d.tci?.answers));
  }, []);

  return (
    <div className={`page-narrow ${styles.page}`}>
      <header className={styles.mast}>
        <p className={styles.kicker}>TEMPERAMENT / 나의 반응 살펴보기</p>
        <h1 className={styles.title}>기질 설문</h1>
        <p className={styles.lead}>두 가지 중 하나를 골라 시작하세요. 문항 수만 다르고 보는 경향은 같아요. 응답은 따로 저장되며, 둘 다 풀어둘 수 있어요.</p>
      </header>

      <div className={styles.choices}>
        {(["short", "full"] as const).map((v) => {
          const meta = VARIANT_LABEL[v];
          const has = v === "short" ? shortHas : fullHas;
          return (
            <Link
              key={v}
              href={`/tci?variant=${v}${nextQuery}`}
              className={styles.choice}
            >
              <div className="row between wrap">
                <div>
                  <div className={styles.choiceTitle}>{meta.title}</div>
                  <div className={styles.choiceSubtitle}>{meta.subtitle}</div>
                </div>
                {has && <span className="chip" style={{ fontSize: 11 }}>이어서 풀기</span>}
              </div>
              <p className={styles.choiceCopy}>
                {meta.description}
              </p>
              <div className={styles.estimate}>{meta.estimate}</div>
            </Link>
          );
        })}
      </div>
      <p className={styles.disclosure}>
        기질 네 차원과 성격 세 차원을 구분해 평소의 반응과 행동 경향을 살펴봐요. 한 번의 응답으로 과거와의 변화를 판단하지 않아요.
        결과는 자기 이해를 위한 참고 자료이지, 의학적 진단이나 공인 심리검사가 아니에요. 유연성 같은 보조 해석은 직접 채점한 일곱 경향과 구분해요.
      </p>
    </div>
  );
}

function SurveyRunner({ variant, router, toFusion }: { variant: TciVariant; router: ReturnType<typeof useRouter>; toFusion: boolean }) {
  const [items, setItems] = useState<TciItem[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  // 마지막 응답을 저장한 뒤에만 결과로 넘어간다 — 그동안 완료 버튼을 잠근다.
  const [finishing, setFinishing] = useState(false);
  const finishLock = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionDialog = useRef<HTMLDialogElement>(null);
  // 보기를 손가락·마우스로 골랐는지(→ 자동 넘김) 키보드로 골랐는지(→ 그대로) 구분한다.
  const pointerPickRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
  }, []);
  /**
   * ★답의 단일 출처★. state만 쓰면 저장 시점의 클로저가 한 박자 늦은 스냅샷을 잡는다.
   * 마지막 문항처럼 "찍고 바로 이동"하는 순간엔 그 한 박자가 응답 하나를 통째로 날린다.
   */
  const answersRef = useRef<Record<string, number>>({});
  /**
   * 저장 요청을 ★한 줄로 세운다★. 자동 저장과 최종 저장이 동시에 날아가면 도착 순서가
   * 뒤집혀 오래된 답이 새 답을 덮어쓸 수 있다. 보낼 때마다 최신 스냅샷을 다시 읽는다.
   */
  const saveChain = useRef<Promise<boolean>>(Promise.resolve(true));

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
        answersRef.current = a;
        setAnswers(a);
        const firstUnanswered = items.findIndex((it) => a[it.id] == null);
        setIdx(firstUnanswered === -1 ? 0 : firstUnanswered);
        setLoaded(true);
      });
  }, [items, variant]);

  /**
   * 저장을 실제로 보내는 곳. 항상 ★보내는 순간의 최신 스냅샷★을 쓴다.
   * 자동 저장은 부분 응답을 그대로 허용한다 — 이어서 풀 수 있어야 하니까.
   */
  const flushSave = useCallback((): Promise<boolean> => {
    const run = saveChain.current.then(async () => {
      try {
        const res = await fetch("/api/tci/answers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variant, answers: answersRef.current }),
        });
        return res.ok;
      } catch {
        return false;
      }
    });
    saveChain.current = run.catch(() => false);
    return run;
  }, [variant]);

  // 3) 변경 시 디바운스 자동 저장.
  //    ★언마운트로 타이머가 취소되는 경로가 있다★ — 마지막 답을 찍고 바로 이동하면
  //    이 타이머가 clear되어 저장이 안 된다. 그래서 최종 이동은 goNext가 직접 flush한다.
  useEffect(() => {
    if (!loaded || finishLock.current || Object.keys(answers).length === 0) return;
    setSaveState("saving");
    const t = setTimeout(() => {
      void flushSave().then((ok) => {
        if (!finishLock.current) setSaveState(ok ? "saved" : "error");
      });
    }, 400);
    autosaveTimer.current = t;
    return () => clearTimeout(t);
  }, [answers, loaded, flushSave]);

  if (!loaded || !items) return <main className="page"><PageLoading label="기질 문항을 준비하고 있어요" /></main>;

  // 정식판이 비어있는 케이스 — 안내 화면.
  if (items.length === 0) {
    return (
      <div className="page-narrow">
        <h2 className="h-app">{VARIANT_LABEL[variant].title}</h2>
        <div className="card mt5">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            확장 140문항이 아직 비어 있어요. 운영팀이 보유한 라이선스 자료에서{" "}
            <code>lib/tci/questions-rs.ts</code>의 <code>TCI_RS_ITEMS</code> 배열에
            140문항을 채워 넣어 주세요. 채워지면 이 화면이 자동으로 설문 진행 화면으로 바뀝니다.
          </p>
          <p className="muted mt3" style={{ fontSize: 12 }}>
            그 동안에는 기본 35문항을 사용할 수 있어요.
          </p>
          <div className="row gap2 mt4">
            <Link href="/tci?variant=short" className="btn btn-primary" style={{ textDecoration: "none" }}>기본 35문항으로 시작</Link>
            <Link href="/tci" className="btn btn-ghost" style={{ textDecoration: "none" }}>← 설문 선택으로</Link>
          </div>
        </div>
      </div>
    );
  }

  const total = items.length;
  const done = items.filter((it) => isValidTciAnswer(answers[it.id])).length;
  const percent = Math.floor(done * 100 / total);
  const current = items[idx];
  const next = items[idx + 1];
  const answeredCurrent = current && answers[current.id] != null;
  const isLast = idx === total - 1;

  function setAnswer(id: string, value: number) {
    if (finishLock.current) return;
    setError(null);
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    // ★손가락·마우스로 고르면 다음 문항으로 넘어간다★ — 예전엔 35문항에 "고르기 + 다음" 70번을 눌러야 했다.
    // 키보드(방향키)로 보기를 훑을 땐 넘기지 않는다 — 훑는 도중에 문항이 바뀌면 원하는 답을 못 고른다.
    if (!pointerPickRef.current) return;
    pointerPickRef.current = false;
    if (isLast) {
      void finishSurvey();
      return;
    }
    const from = idx;
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      // 그사이 사용자가 '다음'을 눌렀으면 두 칸 넘어가지 않는다.
      setIdx((i) => (i === from ? i + 1 : i));
    }, 220);
  }

  async function finishSurvey() {
    if (!items || finishLock.current) return;
    // 부분 응답으로 결과 화면에 보내지 않는다. 완료 판정은 서버와 같은 기준을 쓴다.
    const completion = tciCompletionFromItems(variant, items.map((it) => it.id), answersRef.current);
    if (!completion.complete) {
      const firstUnanswered = items.findIndex((it) => !isValidTciAnswer(answersRef.current[it.id]));
      if (firstUnanswered !== -1) setIdx(firstUnanswered);
      setError(`아직 답하지 않은 문항이 ${completion.total - completion.answered}개 있어.`);
      return;
    }
    // 최종 저장은 대기 중인 자동 저장을 대체하고, 진행 중인 요청 뒤에 순서대로 보낸다.
    finishLock.current = true;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setError(null);
    setFinishing(true);
    setSaveState("saving");
    const ok = await flushSave();
    if (!ok) {
      finishLock.current = false;
      setFinishing(false);
      setSaveState("error");
      setError("마지막 답을 저장하지 못했어. 고른 답은 그대로 있으니 ‘검사 완료’를 다시 눌러 봐.");
      return;
    }
    setSaveState("saved");
    completionDialog.current?.showModal();
  }

  function goNext() {
    if (finishLock.current) return;
    if (!answeredCurrent) {
      setError("먼저 답을 골라 줘.");
      return;
    }
    if (isLast) {
      void finishSurvey();
      return;
    }
    setIdx((i) => Math.min(total - 1, i + 1));
  }

  return (
    <div className={`page-narrow tci-survey ${styles.survey}`}>
      <p className={styles.kicker}>TEMPERAMENT / 기질 설문</p>
      <div className={styles.progress}>
        <div className={styles.progressHead}>
          <strong>검사 진행률 <span>{percent}%</span></strong>
          <span className="mono" aria-label={`현재 ${total}문항 중 ${idx + 1}번`}>{idx + 1} / {total}</span>
        </div>
        <div className="prog" role="progressbar" aria-label="기질검사 진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`총 ${total}문항 중 ${done}문항 응답, ${percent}%`}>
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="row between mt2" style={{ fontSize: 12 }}>
        {/* 위의 "N / 35"(지금 몇 번째)와 같은 모양의 분수를 또 두지 않는다 — "1 / 35"와 "진행 0 / 35"가
            나란히 있어 무엇을 세는지 헷갈렸다. 여긴 저장 상태와 답한 개수만. */}
        <span className="muted" role="status">
          {saveState === "saving" ? "저장 중…" : saveState === "saved" ? `자동 저장됨 · 답한 문항 ${done}개` : saveState === "error" ? "저장 실패" : `답한 문항 ${done}개`}
        </span>
        <Link href={toFusion ? "/tci?next=fusion" : "/tci"} className="link-tiny">← 설문 선택</Link>
      </div>
      {toFusion && (
        <p className="tci-fusion-note" role="note">
          기질 네 차원과 성격 세 차원의 응답 경향을 살펴봐요. 마치면 사주와 함께 읽는 최종 리포트로 이어져요.
        </p>
      )}

      <div className={styles.question}>
        <div className={styles.questionLabel}>
          {VARIANT_LABEL[variant].shortLabel} · {idx + 1}번 문항
        </div>
        <h2>
          {current.text}
        </h2>
      </div>

      <div
        className="likert mt6"
        role="radiogroup"
        aria-label={current.text}
        // 키보드 조작이 시작되면 손가락 신호를 지운다 — 이미 고른 보기를 다시 눌러 신호가 남은 채
        // 방향키로 옮기면, 그 한 번이 자동 넘김으로 잘못 이어지지 않게.
        onKeyDown={() => { pointerPickRef.current = false; }}
      >
        {LIKERT_SCALE.map((s) => (
          <label key={s.value} onPointerDown={() => { pointerPickRef.current = true; }}>
            <input
              type="radio"
              name={current.id}
              checked={answers[current.id] === s.value}
              disabled={finishing}
              onChange={() => setAnswer(current.id, s.value)}
            />
            <span className="ring" aria-hidden />
            <small>{s.label}</small>
          </label>
        ))}
      </div>

      {next && (
        <div className="tci-next-preview">
          <p className="h-sec mt6" style={{ marginBottom: 8 }}>다음 문항 미리보기</p>
          <div className="card" style={{ opacity: 0.55 }}>
            <p style={{ fontSize: 14, margin: 0 }}>{idx + 2}. {next.text}</p>
          </div>
        </div>
      )}

      {error && <p className="error" role="alert" style={{ marginTop: 16 }}>{error}</p>}

      <div className="row gap3 mt6 tci-survey-controls">
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0 || finishing}>
          이전
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={() => void goNext()}
          disabled={finishing}
        >
          {/* 사주+기질 흐름이면 최종 통합 리포트로 이어진다 — 버튼이 다음에 뭐가 오는지 말한다. */}
          {finishing && saveState === "saving" ? "저장 중…" : isLast ? "검사 완료" : "다음 문항"}
        </button>
      </div>
      <dialog ref={completionDialog} className={styles.completionDialog} aria-labelledby="tci-completion-title" aria-describedby="tci-completion-description" onClose={() => {
        finishLock.current = false;
        setFinishing(false);
      }}>
        <p className={styles.kicker}>기질검사 완료</p>
        <h2 id="tci-completion-title" className={styles.title}>수고했어!</h2>
        <p id="tci-completion-description" className={styles.lead}>
          {total}문항에 고른 답은 모두 저장했어.
          {toFusion ? " 이제 사주와 기질을 함께 살펴보자." : " 이제 네 기질을 함께 살펴보자."}
        </p>
        <button type="button" className="btn btn-primary btn-block mt4" onClick={() => router.push(toFusion ? withGenerateIntent("/fusion") : "/tci/report")}>검사 결과 보기</button>
        <button type="button" className="btn btn-ghost btn-block mt2" onClick={() => completionDialog.current?.close()}>답변 다시 확인</button>
      </dialog>
    </div>
  );
}
