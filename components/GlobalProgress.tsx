"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * 전역 프로그레스바 — 화면 상단 3px 먹빛 바.
 *
 * 두 종류의 진행을 한 카운터로 합산해 표시한다:
 * 1. API 호출: window.fetch를 1회 패치해 /api/* 요청을 자동 감지.
 *    페이지마다 코드를 추가할 필요가 없고, 새로 생기는 호출도 자동 커버.
 * 2. 화면 전환: 내부 링크 클릭·뒤로가기에서 시작, pathname/searchParams
 *    변화로 완료 처리. (완료 신호를 못 받는 경우 8초 안전장치)
 *
 * 카운터가 0보다 크면 nprogress처럼 90%를 향해 점근 트리클하고,
 * 0이 되면 100%를 채운 뒤 페이드아웃한다. 깜빡임 방지를 위해 한 번
 * 보이면 최소 350ms는 유지.
 */

let active = 0;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function progressStart() {
  active += 1;
  emit();
}
export function progressDone() {
  active = Math.max(0, active - 1);
  emit();
}

const MIN_SHOWN_MS = 350;
const FADE_MS = 380;
const NAV_SAFETY_MS = 8000;

function Bar() {
  const [shown, setShown] = useState(false);
  const [pct, setPct] = useState(0);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);

  useEffect(() => {
    const stopTrickle = () => {
      if (trickle.current) {
        clearInterval(trickle.current);
        trickle.current = null;
      }
    };
    const clearHide = () => {
      if (hide.current) {
        clearTimeout(hide.current);
        hide.current = null;
      }
    };

    const update = () => {
      if (active > 0) {
        clearHide();
        setShown((was) => {
          if (!was) shownAt.current = Date.now();
          return true;
        });
        setPct((p) => (p < 12 ? 12 : p));
        if (!trickle.current) {
          trickle.current = setInterval(() => {
            setPct((p) => Math.min(90, p + (90 - p) * 0.08 + 0.4));
          }, 400);
        }
      } else {
        stopTrickle();
        clearHide();
        const wait = Math.max(0, MIN_SHOWN_MS - (Date.now() - shownAt.current));
        hide.current = setTimeout(() => {
          setPct(100);
          hide.current = setTimeout(() => {
            setShown(false);
            setPct(0);
          }, FADE_MS);
        }, wait);
      }
    };

    const un = subscribe(update);
    return () => {
      un();
      stopTrickle();
      clearHide();
    };
  }, []);

  return (
    <div className="gp" data-on={shown ? "1" : "0"} aria-hidden>
      <div className="gp-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

function NavWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 라우트 변경 완료 → 진행 중이던 전환 progress 해제
  useEffect(() => {
    if (pending.current) {
      clearTimeout(pending.current);
      pending.current = null;
      progressDone();
    }
  }, [pathname, searchKey]);

  // 전환 시작 감지: 내부 링크 클릭 + 뒤로가기/앞으로가기
  useEffect(() => {
    const begin = () => {
      if (pending.current) return;
      progressStart();
      pending.current = setTimeout(() => {
        pending.current = null;
        progressDone();
      }, NAV_SAFETY_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("/")) return;
      const dest = new URL(href, window.location.origin);
      // 같은 위치(해시 이동 포함)는 전환이 일어나지 않는다
      if (dest.pathname === window.location.pathname && dest.search === window.location.search) return;
      begin();
    };
    const onPop = () => begin();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // fetch 인터셉트 — /api/* 요청 동안 progress 활성 (HMR 중복 패치 방지 플래그)
  useEffect(() => {
    const w = window as typeof window & { __gpFetchPatched?: boolean };
    if (w.__gpFetchPatched) return;
    w.__gpFetchPatched = true;
    const orig = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const isApi = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
      if (!isApi) return orig(input, init);
      progressStart();
      return orig(input, init).finally(progressDone);
    };
  }, []);

  return null;
}

export default function GlobalProgress() {
  return (
    <>
      <Bar />
      {/* useSearchParams는 Suspense 경계 필요 */}
      <Suspense fallback={null}>
        <NavWatcher />
      </Suspense>
    </>
  );
}
