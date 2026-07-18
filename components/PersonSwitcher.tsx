"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createPerson,
  fetchPeople,
  personLabel,
  personSubtitle,
  switchPerson,
  type Person,
} from "@/lib/people/client";

type PersonSwitcherProps = {
  nextPath?: string;
  /** 인물 전환 뒤 현재 상세 주소 대신 돌아갈 기본 화면. */
  reloadPath?: string;
  className?: string;
  nameOnly?: boolean;
};

/**
 * 보는 사람(활성 인물) 전환 칩.
 * 전환하면 서버 스코프가 바뀌므로 화면을 새로고침해 새 인물의 데이터로 다시 그린다.
 */
export default function PersonSwitcher({ nextPath, reloadPath, className, nameOnly = false }: PersonSwitcherProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [activeId, setActiveId] = useState<string>("self");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchPeople()
      .then((s) => {
        if (!alive) return;
        setPeople(s.people);
        setActiveId(s.activeId);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!people) return null;

  const active = people.find((p) => p.id === activeId) ?? people[0];

  async function onSwitch(id: string) {
    if (id === activeId || busy) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await switchPerson(id);
      // 활성 인물이 바뀌면 모든 풀이가 달라진다 → 새로고침으로 일관되게 다시 로드.
      if (reloadPath) window.location.assign(reloadPath);
      else window.location.reload();
    } catch {
      setBusy(false);
    }
  }

  async function onAdd() {
    if (busy) return;
    setBusy(true);
    try {
      await createPerson();
      // 새 인물은 서버에서 곧바로 활성. 입력 후 지금 보던 화면으로 돌아온다.
      const next = nextPath ?? pathname ?? "/dashboard";
      router.push(`/onboarding?next=${encodeURIComponent(next)}`);
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className={["psw", nameOnly && "psw-name-only", className].filter(Boolean).join(" ")} ref={rootRef}>
      <button
        type="button"
        className="psw-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${personLabel(active)} 선택`}
        disabled={busy}
      >
        <span className="psw-trigger-label">
          {!nameOnly && <span className="psw-eyebrow">보는 사람</span>}
          <span className="psw-name">{personLabel(active)}</span>
        </span>
        <span className="psw-caret" aria-hidden>
          ⌄
        </span>
      </button>

      {open && (
        <div className="psw-menu card" role="menu">
          <div className="psw-menu-head">누구로 볼까?</div>
          <div className="psw-list">
            {people.map((p) => {
              const sub = personSubtitle(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={p.id === activeId}
                  className={`psw-item${p.id === activeId ? " on" : ""}`}
                  onClick={() => onSwitch(p.id)}
                  disabled={busy}
                >
                  <span className="psw-item-main">
                    <strong>{personLabel(p)}</strong>
                    {sub && <em>{sub}</em>}
                  </span>
                  {p.id === activeId && (
                    <span className="psw-check" aria-hidden>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="psw-sep" />
          <button type="button" className="psw-action" onClick={onAdd} disabled={busy}>
            + 새 사람 추가
          </button>
          <Link href="/account" className="psw-action" onClick={() => setOpen(false)}>
            인물 관리
          </Link>
        </div>
      )}
    </div>
  );
}
