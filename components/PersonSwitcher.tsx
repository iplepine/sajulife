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
  type PeopleStore,
} from "@/lib/people/client";

type PersonSwitcherProps = {
  nextPath?: string;
  /** 인물 전환 뒤 현재 상세 주소 대신 돌아갈 기본 화면. */
  reloadPath?: string;
  className?: string;
  nameOnly?: boolean;
  /** 트리거에 인물 이름 대신 띄울 문구. 이름이 옆에 이미 있는 자리(예: 기준 정보 표)에서 쓴다. */
  triggerLabel?: string;
  /** 상위 화면이 첫 데이터 묶음에서 이미 읽은 인물 목록. 있으면 중복 요청을 만들지 않는다. */
  initialStore?: PeopleStore | null;
};

/**
 * 보는 사람(활성 인물) 전환 칩.
 * 전환하면 서버 스코프가 바뀌므로 화면을 새로고침해 새 인물의 데이터로 다시 그린다.
 */
export default function PersonSwitcher({ nextPath, reloadPath, className, nameOnly = false, triggerLabel, initialStore }: PersonSwitcherProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [people, setPeople] = useState<Person[] | null>(() => initialStore?.people ?? null);
  const [activeId, setActiveId] = useState<string>(() => initialStore?.activeId ?? "self");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialStore) return;
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
  }, [initialStore]);

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

  // 이벤트 핸들러 안에서는 React 상태가 다시 null이 될 수 있다고 TS가 보기 때문에,
  // 이 렌더에서 확정된 목록을 로컬 상수로 잡아 즉시 전환 대상까지 일관되게 쓴다.
  const peopleList = people;
  const active = peopleList.find((p) => p.id === activeId) ?? peopleList[0];

  async function onSwitch(id: string) {
    if (id === activeId || busy) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      await switchPerson(id);
      // 서버가 활성 인물과 계절 쿠키를 함께 확정한다. 새 문서는 그 쿠키를 첫 페인트부터
      // 사용하므로, 클릭 직전의 별도 테마 전환 없이 한 번만 로드한다.
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
          <span className="psw-name">{triggerLabel ?? personLabel(active)}</span>
        </span>
        <span className="psw-caret" aria-hidden>
          ⌄
        </span>
      </button>

      {open && (
        <div className="psw-menu card" role="menu">
          <div className="psw-menu-head">누구로 볼까?</div>
          <div className="psw-list">
            {peopleList.map((p) => {
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
