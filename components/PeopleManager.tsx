"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPerson,
  deletePerson,
  fetchPeople,
  isSelf,
  personLabel,
  personSubtitle,
  renamePerson,
  switchPerson,
  type Person,
} from "@/lib/people/client";

/**
 * 계정의 인물 관리 — 추가·전환·이름변경·삭제.
 * 각 인물은 개인·기질·융합·가족 풀이를 독립적으로 갖는 별도 사주 워크스페이스다.
 * (전환은 서버에 바로 반영되며, 다른 화면으로 이동하면 그 인물 기준으로 보인다.)
 */
export default function PeopleManager() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [activeId, setActiveId] = useState<string>("self");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPeople()
      .then((s) => {
        setPeople(s.people);
        setActiveId(s.activeId);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (editingId) editRef.current?.focus();
  }, [editingId]);

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
    });

  function startEdit(p: Person) {
    setEditingId(p.id);
    setDraft(p.label ?? "");
    setError(null);
  }

  const saveEdit = (id: string) =>
    run(async () => {
      const s = await renamePerson(id, draft);
      setPeople(s.people);
      setActiveId(s.activeId);
      setEditingId(null);
    });

  if (!people) {
    return (
      <div className="card mt4">
        <div className="muted">인물 목록 불러오는 중…</div>
      </div>
    );
  }

  return (
    <div className="card mt4">
      <div style={{ fontWeight: 700 }}>사주 인물 관리</div>
      <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
        여러 사람의 사주를 넣어두고 언제든 바꿔볼 수 있어. 지금 보는 사람을 고르면 개인·기질·융합·가족 풀이가 그 사람 기준으로 바뀐다.
      </p>

      <ul className="pm-list">
        {people.map((p) => {
          const active = p.id === activeId;
          const editing = editingId === p.id;
          const sub = personSubtitle(p);
          return (
            <li key={p.id} className={`pm-row${active ? " on" : ""}`}>
              {editing ? (
                <div className="pm-edit">
                  <input
                    ref={editRef}
                    className="input"
                    value={draft}
                    maxLength={20}
                    placeholder="이름 또는 별명"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(p.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    disabled={busy}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => saveEdit(p.id)} disabled={busy}>
                    저장
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} disabled={busy}>
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <div className="pm-main">
                    <div className="pm-name">
                      {personLabel(p)}
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
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)} disabled={busy}>
                      이름
                    </button>
                    {!isSelf(p) && (
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(p)} disabled={busy}>
                        삭제
                      </button>
                    )}
                  </div>
                </>
              )}
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
