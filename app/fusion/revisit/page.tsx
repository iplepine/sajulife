"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GenerateLoading from "@/components/GenerateLoading";
import PageLoading from "@/components/PageLoading";
import SavedPersonalReading, { type PersonalReading } from "@/components/report/SavedPersonalReading";
import TemperamentReportPanel from "@/components/report/TemperamentReportPanel";
import { sharedGet } from "@/lib/net/sharedGet";
import { fetchPackageInfo, type PackageInfo } from "@/lib/package/client";
import { ensureNotifyPermission, isGenerating, startGeneration, subscribeGenerations } from "@/lib/generation/tracker";
import type { SajuResult } from "@/lib/saju/calculator";
import styles from "./revisit.module.css";

/**
 * 종합 사주 다시 보기 — 2026-11-18 대표 결정.
 * ① 사주: 저장된 사주 풀이를 보여주고 '그대로 쓰기 / 다시 분석' ② 기질: 저장된 검사 결과를 보여주고 '그대로 쓰기 / 다시 검사'
 * ③ 최종: 바뀐 게 있으면 최종 풀이를 다시 만들고, 없으면 저장본을 볼지 새로 만들지 고른다.
 *
 * 단계와 '무엇을 바꿨는지'는 주소(step·saju·tci)에 둔다 — 기질 재검사로 다른 화면을 다녀와도 이어진다.
 * ★AI 생성은 모두 버튼을 눌러야만 시작한다★ — 새로고침·재방문으로 다시 만들지 않는다.
 */

type Step = "saju" | "tci" | "final";
const STEPS: Array<[Step, string]> = [["saju", "사주"], ["tci", "기질"], ["final", "최종 풀이"]];

type ChartResponse = { saju: SajuResult | null; name?: string; gender?: string; occupation?: string; currentAge?: number; currentYear?: number };
type PersonalResponse = { saved: PersonalReading | null; status: "idle" | "generating" | "error"; error?: string };

/** 기질 재검사 주소 — 끝까지 마쳐야 새 응답으로 저장되고, 마치면 이 화면 ③으로 돌아온다. */
function retakeHref(variant: string, sajuChanged: boolean): string {
  return `/tci?variant=${variant === "full" ? "full" : "short"}&retake=1&next=revisit${sajuChanged ? "&saju=1" : ""}`;
}

export default function FusionRevisitPage() {
  return <Suspense fallback={<main className="page"><PageLoading label="종합 사주를 불러오고 있어요" /></main>}><Revisit /></Suspense>;
}

function Revisit() {
  const router = useRouter();
  const params = useSearchParams();
  const step: Step = params.get("step") === "tci" ? "tci" : params.get("step") === "final" ? "final" : "saju";
  const sajuChanged = params.get("saju") === "1";
  const tciChanged = params.get("tci") === "1";

  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [pkg, setPkg] = useState<PackageInfo | null>(null);
  const [personal, setPersonal] = useState<PersonalResponse | null>(null);
  const [tciVariant, setTciVariant] = useState("short");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"saju" | "tci" | null>(null);
  const [personalGenerating, setPersonalGenerating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const go = useCallback((next: Step, changes: { saju?: boolean; tci?: boolean } = {}) => {
    const q = new URLSearchParams({ step: next });
    if (changes.saju ?? sajuChanged) q.set("saju", "1");
    if (changes.tci ?? tciChanged) q.set("tci", "1");
    setConfirm(null);
    setError(null);
    router.replace(`/fusion/revisit?${q.toString()}`);
    window.scrollTo({ top: 0 });
  }, [router, sajuChanged, tciChanged]);

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
        const [chartRes, pkgRes, personalRes, tciRes] = await Promise.all([
          sharedGet("/api/saju/chart").then((r) => r.json()).catch(() => ({ saju: null })),
          fetchPackageInfo().catch(() => null),
          loadPersonal(),
          fetch("/api/tci/answers", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        setChart(chartRes);
        setPkg(pkgRes);
        if (tciRes?.tci?.variant) setTciVariant(tciRes.tci.variant);
        if (personalRes.status === "generating") {
          startGeneration({ kind: "personal", label: "개인 사주 풀이", href: "/fusion/revisit" });
          setPersonalGenerating(true);
        }
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

  const entitled = pkg?.state.entitled ?? false;

  async function reanalyzeSaju() {
    if (startedRef.current || !entitled) return;
    startedRef.current = true;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/saju/personal", { method: "POST" });
      if (res.status === 202) {
        ensureNotifyPermission();
        startGeneration({ kind: "personal", label: "개인 사주 풀이", href: "/fusion/revisit" });
        setPersonalGenerating(true);
        setConfirm(null);
        router.replace("/fusion/revisit?step=saju&saju=1" + (tciChanged ? "&tci=1" : ""));
        return;
      }
      const d = await res.json().catch(() => ({} as { error?: string }));
      setError(d.error || `사주 다시 분석을 시작하지 못했어요. (HTTP ${res.status})`);
    } catch {
      setError("사주 다시 분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      startedRef.current = false;
      setStarting(false);
    }
  }

  async function remakeFinal() {
    if (startedRef.current || !entitled) return;
    startedRef.current = true;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/fusion/report", { method: "POST" });
      if (res.status === 202) {
        ensureNotifyPermission();
        startGeneration({ kind: "fusion", label: "사주+기질 최종 통합 풀이", href: "/fusion" });
        router.push("/fusion");
        return;
      }
      const d = await res.json().catch(() => ({} as { error?: string }));
      setError(d.error || `최종 풀이를 다시 만들지 못했어요. (HTTP ${res.status})`);
    } catch {
      setError("최종 풀이를 다시 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      startedRef.current = false;
      setStarting(false);
    }
  }

  if (loading) return <main className="page"><PageLoading label="종합 사주를 불러오고 있어요" /></main>;

  const currentYear = chart?.currentYear ?? new Date().getFullYear();
  const stepIndex = STEPS.findIndex(([key]) => key === step);

  return <div className={`page ${styles.page}`}>
    <header className={styles.mast}>
      <p className={styles.kicker}>종합 사주 다시 보기</p>
      <h1>{step === "saju" ? "사주 풀이를 확인해 주세요" : step === "tci" ? "기질 검사 결과를 확인해 주세요" : "최종 풀이를 다시 볼 준비가 됐어요"}</h1>
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
    {pkg && !entitled && <p className={styles.note}>다시 분석과 최종 풀이 다시 만들기는 사주+기질 이용권이 있을 때 할 수 있어요. 저장된 풀이 보기는 그대로 할 수 있어요.</p>}

    {step === "saju" && <section aria-label="사주 단계">
      {personalGenerating ? <GenerateLoading className="mt4" note="사주 풀이를 다시 분석하고 있어요. 끝나면 이 자리에 새 풀이가 보여요." /> : <>
        <div className={styles.decision} role="group" aria-label="사주 풀이 선택">
          {personal?.saved ? <>
            <p>{sajuChanged ? "새로 분석한 사주 풀이예요. 확인하셨으면 기질 단계로 넘어가세요." : "아래 저장된 사주 풀이를 그대로 쓸지, 다시 분석할지 골라 주세요."}</p>
            {confirm === "saju" ? <div className={styles.confirm}>
              <p>다시 분석하면 지금 사주 풀이는 새 풀이로 바뀌고 남지 않아요. 다시 분석할까요?</p>
              <div className={styles.buttons}>
                <button type="button" className="btn btn-primary" disabled={starting} onClick={() => void reanalyzeSaju()}>{starting ? "시작하는 중…" : "사주 다시 분석하기"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>취소</button>
              </div>
            </div> : <div className={styles.buttons}>
              <button type="button" className="btn btn-primary" onClick={() => go("tci")}>{sajuChanged ? "이 풀이로 다음 단계" : "이 사주 풀이 그대로 쓰기"}</button>
              {entitled && <button type="button" className="btn btn-ghost" onClick={() => setConfirm("saju")}>사주 다시 분석하기</button>}
            </div>}
          </> : <>
            <p>저장된 사주 풀이가 없어요. 사주를 분석해야 최종 풀이를 다시 볼 수 있어요.</p>
            <div className={styles.buttons}>{entitled && <button type="button" className="btn btn-primary" disabled={starting} onClick={() => void reanalyzeSaju()}>{starting ? "시작하는 중…" : "사주 분석하기"}</button>}</div>
          </>}
        </div>
        {personal?.saved && <SavedPersonalReading saved={personal.saved} saju={chart?.saju ?? null} currentAge={chart?.currentAge} currentYear={currentYear} name={chart?.name} gender={chart?.gender} occupation={chart?.occupation} />}
      </>}
    </section>}

    {step === "tci" && <section aria-label="기질 단계">
      <div className={styles.decision} role="group" aria-label="기질 검사 선택">
        <p>{tciChanged ? "새로 답한 기질 검사 결과예요." : "아래 기질 검사 결과를 그대로 쓸지, 다시 검사할지 골라 주세요."}</p>
        {confirm === "tci" ? <div className={styles.confirm}>
          <p>처음부터 다시 답해요. 끝까지 마쳐야 새 응답으로 바뀌고, 중간에 그만두면 지금 응답이 그대로 남아요.</p>
          <div className={styles.buttons}>
            <Link href={retakeHref(tciVariant, sajuChanged)} className="btn btn-primary">기질 다시 검사하기</Link>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>취소</button>
          </div>
        </div> : <div className={styles.buttons}>
          <button type="button" className="btn btn-primary" onClick={() => go("final")}>{tciChanged ? "이 결과로 다음 단계" : "이 검사 결과 그대로 쓰기"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm("tci")}>기질 다시 검사하기</button>
        </div>}
        <button type="button" className={styles.back} onClick={() => go("saju")}>← 사주 단계로</button>
      </div>
      <TemperamentReportPanel />
    </section>}

    {step === "final" && <section aria-label="최종 단계" className={styles.decision}>
      {sajuChanged || tciChanged ? <>
        <p>{sajuChanged && tciChanged ? "사주를 다시 분석하고 기질도 다시 검사했어요." : sajuChanged ? "사주를 다시 분석했어요." : "기질을 다시 검사했어요."} 바뀐 내용으로 최종 풀이를 다시 만들어요.</p>
        <div className={styles.buttons}>
          {entitled && <button type="button" className="btn btn-primary" disabled={starting} onClick={() => void remakeFinal()}>{starting ? "시작하는 중…" : "최종 풀이 다시 만들기"}</button>}
          <Link href="/fusion" className="btn btn-ghost">저장된 최종 풀이 보기</Link>
        </div>
      </> : <>
        <p>사주와 기질을 그대로 쓰기로 했어요. 저장된 최종 풀이를 바로 보거나, 같은 자료로 최종 풀이를 새로 만들 수 있어요.</p>
        <div className={styles.buttons}>
          <Link href="/fusion" className="btn btn-primary">저장된 최종 풀이 보기</Link>
          {entitled && <button type="button" className="btn btn-ghost" disabled={starting} onClick={() => void remakeFinal()}>{starting ? "시작하는 중…" : "최종 풀이 새로 만들기"}</button>}
        </div>
      </>}
      <p className={styles.note}>최종 풀이를 새로 만들면 지금 최종 풀이는 새 풀이로 바뀌어요.</p>
      <button type="button" className={styles.back} onClick={() => go("tci")}>← 기질 단계로</button>
    </section>}
  </div>;
}
