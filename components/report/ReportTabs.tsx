"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ReportTabs.module.css";

export type ReportTab = "fusion" | "personal";
const TABS = [{ key: "fusion", label: "종합 풀이" }, { key: "personal", label: "사주 풀이" }] as const;

/** Keep both read-only panels mounted: tab changes must not reset accordion state or start generation. */
export default function ReportTabs({ initialTab, fusion, personal }: {
  initialTab: ReportTab;
  fusion: ReactNode;
  personal: ReactNode;
}) {
  const [active, setActive] = useState<ReportTab>(initialTab);
  const positions = useRef<Record<ReportTab, number>>({ fusion: 0, personal: 0 });
  const restorePosition = useRef(false);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const nav = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".mobile-topbar");
    if (!header) return;
    const measure = () => nav.current?.style.setProperty("--report-tabs-top", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!restorePosition.current) return;
    restorePosition.current = false;
    window.scrollTo({ top: positions.current[active], behavior: "instant" });
  }, [active]);

  function select(next: ReportTab) {
    if (active === next) return;
    positions.current[active] = window.scrollY;
    restorePosition.current = true;
    setActive(next);
  }

  return (
    <>
      <div className={styles.nav} ref={nav}>
        <div className={styles.tabs} role="tablist" aria-label="풀이 선택">
          {TABS.map((tab, index) => (
            <button key={tab.key} ref={(element) => { buttons.current[index] = element; }}
              id={`reading-tab-${tab.key}`} type="button" role="tab" aria-selected={active === tab.key}
              aria-controls={`reading-panel-${tab.key}`} tabIndex={active === tab.key ? 0 : -1}
              className={styles.tab} onClick={() => select(tab.key)}
              onKeyDown={(event) => {
                const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 :
                  event.key === "ArrowRight" ? (index + 1) % TABS.length : event.key === "ArrowLeft" ? (index + TABS.length - 1) % TABS.length : -1;
                if (next < 0) return;
                event.preventDefault();
                buttons.current[next]?.focus({ preventScroll: true });
                select(TABS[next].key);
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div id="reading-panel-fusion" role="tabpanel" aria-labelledby="reading-tab-fusion" hidden={active !== "fusion"} className={styles.panel}>{fusion}</div>
      <div id="reading-panel-personal" role="tabpanel" aria-labelledby="reading-tab-personal" hidden={active !== "personal"} className={styles.panel}>{personal}</div>
    </>
  );
}
