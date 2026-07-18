"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageLoading from "@/components/PageLoading";
import {
  createPerson,
  deletePerson,
  fetchPeople,
  isSelf,
  personLabel,
  personSubtitle,
  switchPerson,
  type Person,
} from "@/lib/people/client";

/**
 * 계정의 인물 관리 — 추가·전환·정보변경·삭제.
 * 각 인물은 개인·기질·융합·가족 풀이를 독립적으로 갖는 별도 사주 워크스페이스다.
 * (전환은 서버에 바로 반영되며, 다른 화면으로 이동하면 그 인물 기준으로 보인다.)
 */
export default function PeopleManager() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [activeId, setActiveId] = useState<string>("self");
  const [busy, setBusy] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPeople()
      .then((s) => {
        setPeople(s.people);
        setActiveId(s.activeId);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  const onSwitch = (id: string) =>
    run(async () => {
      const s = await switchPerson(id);
      setPeople(s.people);
      setActiveId(s.activeId);
      setChangingId(null);
    });

  const onAdd = () =>
    run(async () => {
      await createPerson();
      router.push("/onboarding?next=/account");
    });

  const onDelete = (p: Person) =>
    run(async () => {
      if (!window.confirm(`'${personLabel(p)}'의 모든 풀이·정보가 삭제돼. 되돌릴 수 없어. 삭제할까?`)) return;
      const s = await deletePerson(p.id);
      setPeople(s.people);
      setActiveId(s.activeId);
      setChangingId(null);
    });

  const onChange = (p: Person) =>
    run(async () => {
      if (p.id !== activeId) {
        const s = await switchPerson(p.id);
        setPeople(s.people);
        setActiveId(s.activeId);
      }
      setChangingId(p.id);
    });

  if (!people) {
    return (
      <div className="card mt4">
        <PageLoading compact label="인물 목록을 불러오고 있어요" />
      </div>
    );
  }

  return (
    <div className="card mt4">
      <div style={{ fontWeight: 700 }}>사주 인물 관리</div>
      <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
        사람을 고르면 개인·기질·융합·가족 풀이가 그 사람 기준으로 바뀌어. 변경을 누르면 그 사람의 사주·가족·기질 정보를 고칠 수 있어.
      </p>

      <ul className="pm-list">
        {people.map((p) => {
          const active = p.id === activeId;
          const changing = changingId === p.id;
          const sub = personSubtitle(p);
          return (
            <li key={p.id} className={`pm-row${active ? " on" : ""}`}>
              <>
                <div className="pm-main">
                  <div className="pm-name">
                    {personLabel(p)}
                    {isSelf(p) && <span className="chip pm-self-badge">본인</span>}
                    {active && <span className="chip pm-badge">지금 보는 중</span>}
                  </div>
                  {sub && <div className="pm-sub muted">{sub}</div>}
                </div>
                <div className="pm-actions">
                  {!active && (
                    <button className="btn btn-ghost btn-sm" onClick={() => onSwitch(p.id)} disabled={busy}>
                      이 사람으로 보기
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => onChange(p)} disabled={busy}>
                    변경
                  </button>
                  {!isSelf(p) && (
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(p)} disabled={busy}>
                      삭제
                    </button>
                  )}
                </div>
                {changing && (
                  <div className="pm-change-links" aria-label={`${personLabel(p)} 정보 변경`}>
                    <span>변경할 정보</span>
                    <Link href="/onboarding?next=/account">사주 정보</Link>
                    <Link href="/family">가족 정보</Link>
                    <Link href="/tci">기질 검사</Link>
                  </div>
                )}
              </>
            </li>
          );
        })}
      </ul>

      {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}

      <button className="btn btn-primary btn-block mt4" onClick={onAdd} disabled={busy}>
        + 새 사람 추가
      </button>
    </div>
  );
}
