"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GenerateLoading from "@/components/GenerateLoading";
import PageLoading from "@/components/PageLoading";
import SavedPersonalReading, { type PersonalReading } from "@/components/report/SavedPersonalReading";
import TemperamentReportPanel from "@/components/report/TemperamentReportPanel";
import { sharedGet } from "@/lib/net/sharedGet";
import { formatWon } from "@/lib/package/product";
import { ensureNotifyPermission, isGenerating, startGeneration, subscribeGenerations } from "@/lib/generation/tracker";
import type { SajuResult } from "@/lib/saju/calculator";
import styles from "./revisit.module.css";

/**
 * 종합 사주 다시 보기 — 2026-11-18 대표 결정.
 *
 * 다시 보기를 시작하는 순간 다시 보기권 1장을 쓴다(베타 동안 무료, 실결제는 4,900원).
 * 1장에는 사주 다시 분석 1회 · 기질 검사 1회 · 통합 리포트 1회가 들어 있고, ★횟수는 서버가 센다★(lib/store/revisit.ts).
 * ① 사주: 그대로 쓰기 / 다시 분석 ② 기질: 그대로 쓰기 / 다시 검사 ③ 통합 리포트를 새로 만든다.
 * 사주·기질 중 하나라도 바꿨으면 저장된 최종 풀이로 돌아가지 않고 반드시 새로 만든다.
 * 사주 분석은 서버에서 따로 돌아서, 기다리는 동안 기질 단계를 함께 진행할 수 있다.
 * ★AI 생성은 모두 다이얼로그 확인 뒤에만 시작한다★ — 새로고침·재방문으로 다시 만들지 않는다.
 */

type Step = "saju" | "tci" | "final";
const STEPS: Array<[Step, string]> = [["saju", "사주"], ["tci", "기질"], ["final", "통합 리포트"]];

type ChartResponse = { saju: SajuResult | null; name?: string; gender?: string; occupation?: string; currentAge?: number; currentYear?: number };
type PersonalResponse = { saved: PersonalReading | null; status: "idle" | "generating" | "error"; error?: string };
type Pass = { id: string; startedAt: string; saju: boolean; tci: boolean; fusion: boolean };
type RevisitResponse = { pass: Pass | null; payment: "free" | "portone" | "unavailable"; price: number };
type ConfirmKind = "start" | "saju" | "tci" | "final";

const CONFIRM: Record<ConfirmKind, { title: string; body: string; action: string }> = {
  start: { title: "다시 보기를 시작할까요?", body: "다시 보기권 1장을 사용해요. 사주 다시 분석 1회, 기질 검사 1회, 통합 리포트 1회가 들어 있어요.", action: "시작하기" },
  saju: { title: "사주를 다시 분석할까요?", body: "이번 다시 보기의 사주 다시 분석 1회를 사용해요. 지금 사주 풀이는 새 풀이로 바뀌고 남지 않아요. 몇 분 걸릴 수 있어요.", action: "다시 분석하기" },
  tci: { title: "기질 검사를 다시 할까요?", body: "이번 다시 보기의 기질 검사 1회를 사용해요. 처음부터 다시 답하고, 끝까지 마쳐야 새 응답으로 바뀌어요. 중간에 그만두면 지금 응답이 그대로 남아요.", action: "다시 검사하기" },
  final: { title: "통합 리포트를 새로 만들까요?", body: "이번 다시 보기의 통합 리포트 1회를 사용해요. 지금 최종 풀이는 새 풀이로 바뀌고, 이 다시 보기는 여기서 끝나요. 몇 분 걸릴 수 있어요.", action: "새로 만들기" },
};

function ConfirmDialog({ title, body, confirmLabel, busy, onConfirm, onCancel }: {
  title: string;
  body: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-labelledby="revisit-confirm-title" aria-describedby="revisit-confirm-body" onClose={onCancel}>
    <h2 id="revisit-confirm-title">{title}</h2>
    <p id="revisit-confirm-body">{body}</p>
    <div className={styles.dialogButtons}>
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => ref.current?.close()}>취소</button>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </dialog>;
}

/** 기질 재검사 주소 — 끝까지 마쳐야 새 응답으로 저장되고, 마치면 이 화면 ③으로 돌아온다. */
function retakeHref(variant: string): string {
  return `/tci?variant=${variant === "full" ? "full" : "short"}&retake=1&next=revisit`;
}

export default function FusionRevisitPage() {
  return <Suspense fallback={<main className="page"><PageLoading label="종합 사주를 불러오고 있어요" /></main>}><Revisit /></Suspense>;
}

function Revisit() {
  const router = useRouter();
  const params = useSearchParams();
  const step: Step = params.get("step") === "tci" ? "tci" : params.get("step") === "final" ? "final" : "saju";

  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [revisit, setRevisit] = useState<RevisitResponse | null>(null);
  const [personal, setPersonal] = useState<PersonalResponse | null>(null);
  const [tciVariant, setTciVariant] = useState("short");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [personalGenerating, setPersonalGenerating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const pass = revisit?.pass ?? null;
  const sajuChanged = pass?.saju ?? false;
  const tciChanged = pass?.tci ?? false;

  const go = useCallback((next: Step) => {
    setConfirm(null);
    setError(null);
    router.replace(`/fusion/revisit?step=${next}`);
    window.scrollTo({ top: 0 });
  }, [router]);

  const loadPersonal = useCallback(async () => {
    const response = await fetch("/api/saju/personal", { cache: "no-store" });
    if (!response.ok) throw new Error("조회 실패");
    const data = (await response.json()) as PersonalResponse;
    setPersonal(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [chartRes, revisitRes, personalRes, tciRes] = await Promise.all([
          sharedGet("/api/saju/chart").then((r) => r.json()).catch(() => ({ saju: null })),
          fetch("/api/package/revisit", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error("조회 실패"); return r.json() as Promise<RevisitResponse>; }),
          loadPersonal(),
          fetch("/api/tci/answers", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        setRevisit(revisitRes);
        if (tciRes?.tci?.variant) setTciVariant(tciRes.tci.variant);
        // 진행 여부는 서버 상태가 기준이다 — 브라우저에 남은 추적 표시만으로 최종 만들기를 막지 않는다.
        setPersonalGenerating(personalRes.status === "generating");
        if (personalRes.status === "generating") startGeneration({ kind: "personal", label: "사주 풀이", href: "/fusion/revisit" });
      } catch {
        if (!cancelled) setLoadError("저장된 풀이를 불러오지 못했어요. 새로 만들지 않고 조회만 다시 시도할 수 있어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadPersonal]);

  // 사주 다시 분석이 끝나는 순간 새 저장본을 읽어 같은 자리에 보여준다.
  useEffect(() => {
    let was = isGenerating("personal");
    return subscribeGenerations(() => {
      const now = isGenerating("personal");
      setPersonalGenerating(now);
      if (was && !now) void loadPersonal().catch(() => setLoadError("새 사주 풀이를 불러오지 못했어요. 새로고침하면 다시 조회해요."));
      was = now;
    });
  }, [loadPersonal]);

  /** 버튼 하나가 서버 요청 하나 — 중복 클릭으로 두 번 보내지 않는다. */
  async function run(request: () => Promise<Response>, onOk: (res: Response) => Promise<void> | void, failMessage: string) {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarting(true);
    setError(null);
    try {
      const res = await request();
      if (res.ok) { await onOk(res); return; }
      const d = await res.json().catch(() => ({} as { error?: string }));
      setError(d.error || `${failMessage} (HTTP ${res.status})`);
    } catch {
      setError(`${failMessage} 잠시 후 다시 시도해 주세요.`);
    } finally {
      startedRef.current = false;
      setStarting(false);
      setConfirm(null);
    }
  }

  const startPass = () => run(() => fetch("/api/package/revisit", { method: "POST" }), async (res) => {
    const d = (await res.json()) as { pass: Pass };
    setRevisit((r) => (r ? { ...r, pass: d.pass } : r));
    go("saju");
  }, "다시 보기를 시작하지 못했어요.");

  const reanalyzeSaju = () => run(() => fetch("/api/saju/personal", { method: "POST" }), () => {
    ensureNotifyPermission();
    startGeneration({ kind: "personal", label: "사주 풀이", href: "/fusion/revisit" });
    setPersonalGenerating(true);
    setRevisit((r) => (r?.pass ? { ...r, pass: { ...r.pass, saju: true } } : r));
  }, "사주 다시 분석을 시작하지 못했어요.");

  const remakeFinal = () => {
    // 최종 풀이는 저장된 사주 풀이를 재료로 쓴다 — 사주 분석이 끝나기 전엔 만들지 않는다(서버도 막는다).
    if (personalGenerating) return;
    return run(() => fetch("/api/fusion/report", { method: "POST" }), () => {
      ensureNotifyPermission();
      startGeneration({ kind: "fusion", label: "사주+기질 최종 통합 풀이", href: "/fusion" });
      router.push("/fusion");
    }, "통합 리포트를 만들지 못했어요.");
  };

  if (loading) return <main className="page"><PageLoading label="종합 사주를 불러오고 있어요" /></main>;

  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const stepIndex = STEPS.findIndex(([key]) => key === step);
  const priceLabel = revisit
    ? revisit.payment === "free" ? `베타 기간 무료 · 정가 ${formatWon(revisit.price)}` : formatWon(revisit.price)
    : "";

  const dialog = confirm && <ConfirmDialog
    key={confirm}
    title={CONFIRM[confirm].title}
    body={confirm === "start" ? `${CONFIRM.start.body} (${priceLabel})` : CONFIRM[confirm].body}
    confirmLabel={starting ? "시작하는 중…" : CONFIRM[confirm].action}
    busy={starting}
    onCancel={() => setConfirm(null)}
    onConfirm={() => {
      if (confirm === "start") void startPass();
      else if (confirm === "saju") void reanalyzeSaju();
      else if (confirm === "final") void remakeFinal();
      else router.push(retakeHref(tciVariant));
    }}
  />;

  // 다시 보기권이 없으면 무엇이 들어 있는지와 가격부터 보여준다 — 시작은 다이얼로그 확인 뒤.
  if (!pass) {
    return <div className={`page ${styles.page}`}>
      <header className={styles.mast}>
        <p className={styles.kicker}>종합 사주 다시 보기</p>
        <h1>사주와 기질을 다시 살펴보고, 통합 리포트를 새로 받아요</h1>
      </header>
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <section className={styles.decision} aria-label="다시 보기권 안내">
        <p>다시 보기권 1장에 아래 세 가지가 들어 있어요.</p>
        <ol className={styles.includes}>
          <li><strong>사주 다시 분석 1회</strong><span>지금 풀이를 그대로 써도 돼요.</span></li>
          <li><strong>기질 검사 1회</strong><span>지금 응답을 그대로 써도 돼요.</span></li>
          <li><strong>통합 리포트 1회</strong><span>고른 사주와 기질로 최종 풀이를 새로 만들어요.</span></li>
        </ol>
        <p className={styles.price}>{priceLabel}</p>
        <div className={styles.buttons}>
          <button type="button" className="btn btn-primary" onClick={() => setConfirm("start")}>다시 보기 시작하기</button>
          <Link href="/fusion" className="btn btn-ghost">저장된 최종 풀이 보기</Link>
        </div>
      </section>
      {dialog}
    </div>;
  }

  return <div className={`page ${styles.page}`}>
    <header className={styles.mast}>
      <p className={styles.kicker}>종합 사주 다시 보기</p>
      <h1>{step === "saju" ? "사주 풀이를 확인해 주세요" : step === "tci" ? "기질 검사 결과를 확인해 주세요" : "통합 리포트를 새로 만들어요"}</h1>
      <ol className={styles.steps} aria-label="진행 단계">
        {STEPS.map(([key, label], i) => <li key={key} aria-current={i === stepIndex ? "step" : undefined} data-done={i < stepIndex || undefined}>
          <span>{i + 1}</span>{label}
          {key === "saju" && sajuChanged && <em>다시 분석</em>}
          {key === "tci" && tciChanged && <em>다시 검사</em>}
        </li>)}
      </ol>
    </header>

    {loadError && <p className="error" role="alert">{loadError}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {step !== "saju" && personalGenerating && <p className={styles.running} role="status">사주 풀이를 다시 분석하고 있어요. 끝나면 사주 단계에서 새 풀이를 확인할 수 있어요.</p>}

    {step === "saju" && <section aria-label="사주 단계">
      {personalGenerating ? <>
        {/* 사주 분석은 서버에서 따로 돈다 — 기다리지 않고 기질 단계를 함께 진행한다. */}
        <div className={styles.decision} role="group" aria-label="사주 분석 중 선택">
          <p>사주 풀이를 다시 분석하고 있어요. 기다리는 동안 기질 단계를 먼저 진행할 수 있어요. 통합 리포트는 사주 분석이 끝난 뒤에 만들어요.</p>
          <div className={styles.buttons}><button type="button" className="btn btn-primary" onClick={() => go("tci")}>기다리는 동안 기질 단계로</button></div>
        </div>
        <GenerateLoading className="mt4" note="끝나면 이 자리에 새 풀이가 보여요. 다른 단계로 가도 분석은 계속돼요." />
      </> : <>
        <div className={styles.decision} role="group" aria-label="사주 풀이 선택">
          <p>{sajuChanged ? "새로 분석한 사주 풀이예요. 이번 다시 보기의 사주 다시 분석은 사용했어요." : "아래 사주 풀이를 그대로 쓸지, 다시 분석할지 골라 주세요."}</p>
          <div className={styles.buttons}>
            <button type="button" className="btn btn-primary" onClick={() => go("tci")}>{sajuChanged ? "다음: 기질 단계" : "이 사주 풀이 그대로 쓰기"}</button>
            {!sajuChanged && <button type="button" className="btn btn-ghost" onClick={() => setConfirm("saju")}>사주 다시 분석하기</button>}
          </div>
        </div>
        {personal?.saved && <SavedPersonalReading saved={personal.saved} saju={chart?.saju ?? null} currentAge={chart?.currentAge} currentYear={currentYear} name={chart?.name} gender={chart?.gender} occupation={chart?.occupation} />}
      </>}
    </section>}

    {step === "tci" && <section aria-label="기질 단계">
      <div className={styles.decision} role="group" aria-label="기질 검사 선택">
        <p>{tciChanged ? "새로 답한 기질 검사 결과예요. 이번 다시 보기의 기질 검사는 사용했어요." : "아래 기질 검사 결과를 그대로 쓸지, 다시 검사할지 골라 주세요."}</p>
        <div className={styles.buttons}>
          <button type="button" className="btn btn-primary" onClick={() => go("final")}>{tciChanged ? "다음: 통합 리포트" : "이 검사 결과 그대로 쓰기"}</button>
          {!tciChanged && <button type="button" className="btn btn-ghost" onClick={() => setConfirm("tci")}>기질 다시 검사하기</button>}
        </div>
        <button type="button" className={styles.back} onClick={() => go("saju")}>← 사주 단계로</button>
      </div>
      <TemperamentReportPanel />
    </section>}

    {step === "final" && <section aria-label="통합 리포트 단계" className={styles.decision}>
      <p>{sajuChanged && tciChanged ? "사주를 다시 분석하고 기질도 다시 검사했어요."
        : sajuChanged ? "사주를 다시 분석했어요."
        : tciChanged ? "기질을 다시 검사했어요."
        : "사주와 기질을 그대로 쓰기로 했어요."} 고른 내용으로 통합 리포트를 새로 만들어요.</p>
      <div className={styles.buttons}>
        <button type="button" className="btn btn-primary" disabled={personalGenerating} onClick={() => setConfirm("final")}>{personalGenerating ? "사주 분석이 끝나면 만들 수 있어요" : "통합 리포트 새로 만들기"}</button>
      </div>
      {/* 하나라도 바꿨으면 저장된 최종 풀이로 돌아가지 않는다 — 바뀐 내용과 맞지 않는 풀이가 남는다. */}
      {!sajuChanged && !tciChanged && <p className={styles.note}>지금 만들지 않아도 이 다시 보기는 남아 있어요. <Link href="/fusion" className="link-tiny">저장된 최종 풀이 보기</Link></p>}
      <button type="button" className={styles.back} onClick={() => go("tci")}>← 기질 단계로</button>
    </section>}

    {dialog}
  </div>;
}
