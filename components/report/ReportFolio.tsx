"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import ReportView from "@/components/ReportView";
import { getReportOutline } from "@/lib/report/outline";
import styles from "./ReportFolio.module.css";

const PERSPECTIVES = [
  ["큰 나무", "성장과 추진", "목표를 향해 나아가고 변화를 만들어 내는 힘"],
  ["타는 불", "열정과 표현", "먼저 행동하고 주변에 에너지를 전달하는 힘"],
  ["너른 흙", "지속과 신뢰", "꾸준히 지탱하고 신뢰를 쌓아 가는 힘"],
  ["흐르는 물", "연결과 적응", "맥락을 읽고 사람과 자원을 연결하며 변화에 적응하는 힘"],
  ["단단한 쇠", "분별과 중심", "원칙을 지키고 상황을 분별하며 중심을 잡는 힘"],
] as const;

/** An editorial reading surface over saved content; never invents a personal summary. */
export default function ReportFolio({ kind, text, headline, name, generatedAt, currentAge, persistKey, evidence, actions, visual }: {
  kind: "fusion" | "personal";
  text: string;
  headline?: string;
  name?: string;
  generatedAt?: string;
  currentAge?: number;
  persistKey?: string;
  evidence?: ReactNode;
  actions?: ReactNode;
  visual?: ReactNode;
}) {
  const outline = useMemo(() => getReportOutline(text), [text]);
  const prefix = `folio-${kind}`;
  const [current, setCurrent] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const tocTrigger = useRef<HTMLButtonElement>(null);
  const title = headline?.trim() || outline.title || (kind === "fusion" ? "사주와 기질로 함께 읽는 나" : "타고난 특징과 삶의 흐름");
  const label = kind === "fusion" ? "종합 풀이" : "사주 풀이";

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      const index = Number(visible.target.id.split("-section-").at(-1));
      if (Number.isInteger(index)) setCurrent(index);
    }, { rootMargin: "-12% 0px -65% 0px" });
    root.current?.querySelectorAll(`[id^="${prefix}-section-"]`).forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [prefix, text]);

  const opening = kind === "fusion" && visual;
  const excerpt = outline.summary.trim();

  function readSection(event: MouseEvent<HTMLAnchorElement>, index: number) {
    event.preventDefault();
    const section = document.getElementById(`${prefix}-section-${index}`);
    if (!section) return;
    if (section instanceof HTMLDetailsElement && !section.open) section.querySelector("summary")?.click();
    setCurrent(index);
    setTocOpen(false);
    requestAnimationFrame(() => {
      section.scrollIntoView({ block: "start", behavior: "instant" });
      const heading = section.querySelector<HTMLElement>("summary, h3");
      if (heading && heading.tagName !== "SUMMARY") heading.tabIndex = -1;
      heading?.focus({ preventScroll: true });
    });
  }

  return (
    <div className={`report-folio ${styles.folio}`} data-kind={kind} ref={root}>
      <aside className={styles.index} data-toc-open={tocOpen} onKeyDown={(event) => {
        if (event.key !== "Escape" || !tocOpen) return;
        event.preventDefault();
        setTocOpen(false);
        tocTrigger.current?.focus();
      }}>
        <p className={styles.indexLabel}>이 풀이의 순서</p>
        <button type="button" ref={tocTrigger} className={styles.tocTrigger} aria-expanded={tocOpen} aria-controls={`${prefix}-toc`} aria-labelledby={`${prefix}-toc-action`} aria-describedby={`${prefix}-toc-position`} onClick={() => setTocOpen(open => !open)}>
          <span id={`${prefix}-toc-position`} className={styles.tocPosition}>
            <span>{String(current + 1).padStart(2, "0")}</span><span>{outline.sections[current]?.title ?? outline.sections[0]?.title}</span>
          </span>
          <span id={`${prefix}-toc-action`} className={styles.tocAction}>{tocOpen ? "목차 닫기" : "목차 보기"}</span>
        </button>
        <nav aria-label={`${label} 목차`} id={`${prefix}-toc`} className={styles.toc}>
          {outline.sections.map((section, index) => <a key={index} href={`#${prefix}-section-${index}`} aria-current={current === index ? "location" : undefined} onClick={(event) => readSection(event, index)}>
            <span>{String(index + 1).padStart(2, "0")}</span><span>{section.title}</span>
          </a>)}
        </nav>
        <div className={styles.indexMeta}>
          <strong>풀이 기준</strong><p>{name ? `${name}님의 저장된 풀이` : "저장된 풀이"}</p>
          <p>{generatedAt ? new Date(generatedAt).toLocaleDateString("ko-KR") : ""}</p>
          <p>새로운 생성 없이 읽고 있습니다.</p>
        </div>
      </aside>
      <div className={styles.reading}>
        <section className={styles.intro} aria-label={`${label} 핵심 해석`}>
          <div className={styles.introMeta}>
            <p className={styles.kicker}>{kind === "fusion" ? "함께 읽은 핵심" : "사주 관점의 기초 풀이"}</p>
            {visual && <a className={styles.evidenceJump} href={`#${prefix}-evidence`}>풀이 근거 <span aria-hidden="true">↓</span></a>}
          </div>
          <h2>{title}</h2>
        </section>
        {opening && <div id={`${prefix}-evidence`} tabIndex={-1} className={styles.openingEvidence}>
          {visual}
          {excerpt && excerpt.length <= 240 && excerpt !== title && <blockquote className={styles.synthesis}><span>함께 읽은 핵심 · 본문 발췌</span><p>{excerpt}</p></blockquote>}
          <p className={styles.openingNote}>사주와 검사 응답은 서로 다른 자료야. 두 자료를 함께 읽되, 일치율이나 원인·결과를 뜻하지는 않아.</p>
          <div className={styles.readControls}>
            <a href={`#${prefix}-section-0`} onClick={event => readSection(event, 0)}>이어서 본문 읽기 <span aria-hidden="true">↓</span></a>
            <a href={`#${prefix}-reference`} onClick={() => {
              const reference = document.getElementById(`${prefix}-reference`);
              if (reference instanceof HTMLDetailsElement) reference.open = true;
            }}>자료를 더 자세히</a>
          </div>
        </div>}
        <ReportView text={text} currentAge={currentAge} persistKey={persistKey} layout="folio" anchorPrefix={prefix} />
        {!opening && visual && <div id={`${prefix}-evidence`} tabIndex={-1} className={styles.visualEvidence}>
          <p className={styles.evidenceCaption}>사주 관점의 근거가 된 명식이에요.</p>
          {visual}
        </div>}
        {kind === "fusion" && <section className={styles.five} aria-label="사주와 기질을 함께 읽는 다섯 관점">
          <div className={styles.fiveHeading}><h3>나를 읽는 다섯 가지 힘</h3><p>점수나 우열이 아닌 해석의 관점</p></div>
          <dl>{PERSPECTIVES.map(([symbol, title, description], index) => <div key={symbol}><dt><small>{String(index + 1).padStart(2, "0")} / {symbol}</small><span>{title}</span></dt><dd>{description}</dd></div>)}</dl>
        </section>}
        {evidence && <details id={`${prefix}-reference`} className={styles.reference}>
          <summary>풀이 기준과 참고 자료</summary>
          <div className={styles.referenceBody}>{evidence}</div>
        </details>}
        <footer className={styles.footer}>
          <p>사주와 검사 해석은 자기 이해와 선택을 돕는 참고 자료입니다.</p>
          {generatedAt && <p>저장된 {kind === "personal" ? "사주 " : ""}풀이 · {new Date(generatedAt).toLocaleString("ko-KR")}</p>}
          <div className={styles.actions}>{actions}</div>
        </footer>
      </div>
    </div>
  );
}
