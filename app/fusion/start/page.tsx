"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageLoading from "@/components/PageLoading";
import { fetchPackageInfo } from "@/lib/package/client";
import { nextJourneyStep } from "@/lib/package/journey";
import { createPerson, fetchPeople, personLabel, personSubtitle, switchPerson, type PeopleStore } from "@/lib/people/client";
import styles from "../../account/WorkspaceForms.module.css";

type Choice = { store: PeopleStore; registeredIds: string[] };

export default function FusionStartPage() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{ id: string; existing: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchPeople(), fetchPackageInfo()]).then(([store, pkg]) => {
      if (!alive) return;
      if (pkg.personId !== store.activeId) throw new Error("활성 인물이 바뀌었어요.");
      const registeredIds = store.people
        .filter(person => person.id === store.activeId ? pkg.state.hasProfile : Boolean(person.birthDate))
        .map(person => person.id);
      if (!registeredIds.length) {
        window.location.replace(nextJourneyStep(pkg.state).href);
        return;
      }
      setChoice({ store, registeredIds });
    }).catch(() => {
      if (alive) setError("인물 목록과 풀이 진행 상태를 불러오지 못했어요.");
    });
    return () => { alive = false; };
  }, [attempt]);

  async function proceed(target: { id: string; existing: boolean }) {
    const pkg = await fetchPackageInfo();
    // 등록된 인물로 선택한 경우, 최신 조회에서 정보가 없어도 입력 화면으로 밀어 넣지 않는다.
    if (pkg.personId !== target.id || (target.existing && !pkg.state.hasProfile)) {
      setPending(null);
      setChoice(null);
      setError("선택한 인물의 등록 정보를 찾지 못했어요. 목록을 다시 확인해 주세요.");
      setBusy(false);
      return;
    }
    window.location.replace(nextJourneyStep(pkg.state).href);
  }

  async function choose(id?: string) {
    if (!choice || busy) return;
    setBusy(true);
    setError("");
    try {
      let target = pending;
      if (!target) {
        if (id) {
          const store = id === choice.store.activeId ? choice.store : await switchPerson(id);
          if (store.activeId !== id) {
            setChoice(null);
            throw new Error("선택한 인물을 찾지 못했어요. 목록을 다시 확인해 주세요.");
          }
          target = { id, existing: true };
        } else {
          const store = await createPerson();
          if (store.activeId !== store.added.id) throw new Error("새 인물로 전환하지 못했어요.");
          target = { id: store.added.id, existing: false };
        }
        // 다음 조회만 실패하면 같은 인물을 다시 생성하거나 전환하지 않는다.
        setPending(target);
      }
      await proceed(target);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "풀이를 이어가지 못했어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  const people = choice?.store.people
    .filter(person => choice.registeredIds.includes(person.id))
    .sort((a, b) => Number(b.id === choice.store.activeId) - Number(a.id === choice.store.activeId));

  return (
    <main className={`page-narrow ${styles.page}`}>
      {!choice && !error ? <PageLoading label="등록된 인물을 확인하고 있어요" /> : (
        <>
          <header className={styles.mast}>
            <p className={styles.kicker}>사주 + 기질</p>
            <h1 className={styles.title}>누구의 풀이를 볼까요?</h1>
            <p className={styles.lead}>등록된 인물은 출생 정보를 다시 입력하지 않고, 이전에 진행한 단계부터 이어갈 수 있어요.</p>
          </header>
          {error && <p className="error" role="alert">{error}</p>}
          {!choice ? (
            <button type="button" className="btn btn-primary" onClick={() => { setError(""); setAttempt(value => value + 1); }}>목록 다시 불러오기</button>
          ) : pending ? (
            busy ? <PageLoading compact label="선택한 인물의 풀이를 확인하고 있어요" /> : (
              <button type="button" className="btn btn-primary" onClick={() => void choose()}>선택한 인물로 다시 시도</button>
            )
          ) : (
            <>
              <ul className="stack" aria-label="등록된 인물" style={{ listStyle: "none", padding: 0 }}>
                {people?.map(person => (
                  <li key={person.id}>
                    <button type="button" className={`btn btn-block ${person.id === choice.store.activeId ? "btn-primary" : "btn-ghost"}`} disabled={busy} onClick={() => void choose(person.id)}>
                      {personLabel(person)}{person.id === choice.store.activeId ? " · 현재 선택" : ""}
                      {personSubtitle(person) && <small>{personSubtitle(person)}</small>}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-ghost btn-block mt4" disabled={busy} onClick={() => void choose()}>새 인물 정보 입력</button>
            </>
          )}
          {!busy && <Link href="/dashboard" className="btn btn-ghost btn-sm mt4">홈으로</Link>}
        </>
      )}
    </main>
  );
}
