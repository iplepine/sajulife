"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { parsePersonalReport, type PersonalReport, type ReportRoadmap } from "@/lib/report/types";

/**
 * AI 리포트를 섹션 구조로 렌더한다. 두 입력 모두 지원:
 *
 * 1) 구조화 JSON (개인 사주 리포트) — lib/report/types.ts(PersonalReport) 모양이면
 *    제목·키워드·섹션·로드맵을 정규식 파싱 없이 그대로 렌더한다. 각 섹션 body는
 *    여전히 마커 텍스트라 아래 블록 파서를 재사용한다.
 * 2) plain text (그 외 리포트·옛 저장본) — `▣ 섹션`/`● ◆ ◇ ① • ▸ ─x─` 마커를
 *    파싱해 섹션 아코디언으로 렌더. ▣가 없으면 .report 스타일로 폴백.
 *
 * 블록 마커 규약(lib/prompts/defaults.ts)과 짝을 이룬다.
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "lead"; text: string }
  | { kind: "bullet"; label: string | null; text: string }
  | { kind: "sub"; text: string }
  | { kind: "num"; marker: string; text: string }
  | { kind: "dia"; hollow: boolean; text: string }
  | { kind: "phase"; text: string }
  | { kind: "score"; head: string; caption: string };

type Section = { title: string; blocks: Block[] };

const RULE_LINE = /^[━═─—]{4,}$/;
const SCORE_HEAD = /^(NS|HA|RD|PS|SD|CO|ST)\s+\S/;

/** 한 줄을 마커 블록으로. 마커가 아니면 null(=일반 문단 줄, 호출부가 이어붙임 판단). */
function matchBlock(t: string): Block | null {
  let m: RegExpMatchArray | null;
  if ((m = t.match(/^●\s*(.+)$/))) {
    const inner = m[1];
    const sep = inner.search(/[:▸]/);
    return sep > 0 && sep <= 16
      ? { kind: "bullet", label: inner.slice(0, sep).trim(), text: inner.slice(sep + 1).trim() }
      : { kind: "bullet", label: null, text: inner.trim() };
  }
  if ((m = t.match(/^([◆◇])\s*(.+)$/))) {
    return { kind: "dia", hollow: m[1] === "◇", text: m[2].trim() };
  }
  if ((m = t.match(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*(.+)$/))) {
    return { kind: "num", marker: m[1], text: m[2].trim() };
  }
  if ((m = t.match(/^[─—]+\s*(.+?)\s*[─—]*$/)) && !/^[─—\s]*$/.test(m[1])) {
    // "─ 1~30일 ─" (양쪽) / "─ 적합한 직무" (왼쪽만) 둘 다 소제목으로
    return { kind: "phase", text: m[1].trim() };
  }
  if (SCORE_HEAD.test(t) && t.includes("%")) {
    const arrow = t.indexOf("▸");
    return arrow >= 0
      ? { kind: "score", head: t.slice(0, arrow).trim(), caption: t.slice(arrow + 1).trim() }
      : { kind: "score", head: t, caption: "" };
  }
  if ((m = t.match(/^[•·▸]\s*(.+)$/))) {
    return { kind: "sub", text: m[1].trim() };
  }
  return null;
}

/** 마커 텍스트(섹션 헤더 없는 본문)를 블록 배열로. JSON 섹션 body 렌더에 쓴다. */
function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let open: Block | null = null; // 일반 줄을 이어붙일 수 있는 마지막 블록
  for (const raw of text.split("\n")) {
    const t = raw.trim();
    if (!t || RULE_LINE.test(t)) {
      open = null;
      continue;
    }
    const matched = matchBlock(t);
    let block: Block;
    if (matched) {
      block = matched;
    } else if (open && "text" in open) {
      open.text = `${open.text} ${t}`;
      continue;
    } else {
      block = { kind: "p", text: t };
    }
    blocks.push(block);
    open = block.kind === "score" || block.kind === "phase" ? null : block;
  }
  return blocks;
}

function parse(text: string): { intro: Block[]; sections: Section[] } {
  const sections: Section[] = [];
  let intro: Block[] = [];
  let current: Section | null = null;
  let open: Block | null = null;

  for (const raw of text.split("\n")) {
    const t = raw.trim();
    if (!t || RULE_LINE.test(t)) {
      open = null;
      continue;
    }

    const sec = t.match(/^▣\s*(.+)$/);
    if (sec) {
      // "1. [기본 성향] 한 문장 요약…" 형태는 제목과 요약을 분리해
      // 헤더가 여러 줄로 비대해지는 것을 막는다.
      const full = sec[1].trim();
      const split = full.match(/^(.{2,30}?\])\s+(.+)$/);
      current = split
        ? { title: split[1], blocks: [{ kind: "lead", text: split[2] }] }
        : { title: full, blocks: [] };
      sections.push(current);
      open = null;
      continue;
    }

    const matched = matchBlock(t);
    let block: Block;
    if (matched) {
      block = matched;
    } else if (open && "text" in open) {
      open.text = `${open.text} ${t}`;
      continue;
    } else {
      block = { kind: "p", text: t };
    }

    (current ? current.blocks : intro).push(block);
    open = block.kind === "score" || block.kind === "phase" ? null : block;
  }

  // 배너 제목("기질 리포트" 등) 제거 — 섹션 앞의 짧은 단독 줄
  if (sections.length > 0 && intro.length === 1 && intro[0].kind === "p" && intro[0].text.length <= 24) {
    intro = [];
  }
  return { intro, sections };
}

function renderBlock(b: Block, i: number): ReactNode {
  switch (b.kind) {
    case "p":
      return <p className="rv-p" key={i}>{b.text}</p>;
    case "lead":
      return <p className="rv-lead" key={i}>{b.text}</p>;
    case "bullet":
      return (
        <p className="rv-li rv-li--dot" key={i}>
          {b.label && <strong className="bl">{b.label}</strong>}
          {b.text}
        </p>
      );
    case "sub":
      return <p className="rv-li rv-li--sub" key={i}>{b.text}</p>;
    case "num":
      return (
        <p className="rv-li rv-li--num" key={i}>
          <span className="mk">{b.marker}</span>
          <span>{b.text}</span>
        </p>
      );
    case "dia":
      return <p className={`rv-li rv-li--dia${b.hollow ? " hollow" : ""}`} key={i}>{b.text}</p>;
    case "phase":
      return <div className="rv-phase" key={i}>{b.text}</div>;
    case "score":
      return (
        <div className="rv-score" key={i}>
          <span className="head">{b.head}</span>
          {b.caption && <span className="cap">{b.caption}</span>}
        </div>
      );
  }
}

/** 섹션 펼침 상태 + "모두 펼치기/접기"를 공유하는 훅. */
function useAccordion(count: number, resetKey: unknown) {
  const [openSet, setOpenSet] = useState<ReadonlySet<number>>(() => new Set());
  useEffect(() => setOpenSet(new Set()), [resetKey]);
  const allOpen = count > 0 && openSet.size === count;
  const toggle = (i: number) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const toggleAll = () =>
    setOpenSet(allOpen ? new Set() : new Set(Array.from({ length: count }, (_, i) => i)));
  return { openSet, allOpen, toggle, toggleAll };
}

export default function ReportView({
  text,
  className,
  plain = false,
}: {
  text: string;
  className?: string;
  /** 카드 안에 중첩될 때 — 섹션 카드 테두리 없이 헤더+본문만 */
  plain?: boolean;
}) {
  const report = useMemo(() => parsePersonalReport(text), [text]);
  if (report) {
    return <StructuredReport report={report} className={className} plain={plain} />;
  }
  return <TextReport text={text} className={className} plain={plain} />;
}

/** 구조화 JSON 리포트(개인 사주) — 제목·키워드·섹션·로드맵. */
function StructuredReport({
  report,
  className,
  plain,
}: {
  report: PersonalReport;
  className?: string;
  plain: boolean;
}) {
  const { sections } = report;
  const { openSet, allOpen, toggle, toggleAll } = useAccordion(sections.length, report);

  return (
    <div className={`rv rv--json${plain ? " rv--plain" : ""}${className ? ` ${className}` : ""}`}>
      <div className="rv-hero">
        <p className="rv-title">{report.title}</p>
        {report.keywords.length > 0 && (
          <div className="rv-keywords">
            {report.keywords.map((k, i) => (
              <span className="rv-kw" key={i}>
                <b>{k.word}</b>
                {k.desc && <em>{k.desc}</em>}
              </span>
            ))}
          </div>
        )}
      </div>

      {sections.length > 1 && (
        <div className="rv-tools">
          <button type="button" className="rv-toggle" onClick={toggleAll}>
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
      )}

      {sections.map((s, i) => (
        <details className="rv-sec" key={i} open={openSet.has(i)}>
          <summary
            className="rv-h"
            onClick={(e) => {
              e.preventDefault();
              toggle(i);
            }}
          >
            <span className="t">{s.id}</span>
          </summary>
          <div className="rv-body">
            {s.summary && <p className="rv-lead">{s.summary}</p>}
            {parseBlocks(s.body).map(renderBlock)}
          </div>
        </details>
      ))}

      <RoadmapCard roadmap={report.roadmap} />

      {report.disclaimer && <p className="rv-disclaimer">{report.disclaimer}</p>}
    </div>
  );
}

/** 인생 로드맵 요약 — 깨지던 ASCII 트리를 대체하는 시각 카드. */
function RoadmapCard({ roadmap }: { roadmap: ReportRoadmap }) {
  return (
    <div className="rmap">
      <div className="rmap-head">
        <span className="rmap-badge">인생 로드맵</span>
        <p className="rmap-character">{roadmap.character}</p>
      </div>
      <div className="rmap-rows">
        <div className="rmap-row">
          <span className="rmap-tag">타고난 자원</span>
          <div className="rmap-flow">
            <span className="rmap-pill">{roadmap.resourceInput}</span>
            <span className="rmap-arrow" aria-hidden="true">→</span>
            <span className="rmap-pill out">{roadmap.resourceOutput}</span>
          </div>
        </div>
        <div className="rmap-row">
          <span className="rmap-tag">리스크 관리</span>
          <div className="rmap-val">
            <p className="rmap-shadow">{roadmap.riskShadow}</p>
            <p className="rmap-tool">{roadmap.riskTool}</p>
          </div>
        </div>
        <div className="rmap-row">
          <span className="rmap-tag">향후 방향성</span>
          <p className="rmap-val rmap-dir">{roadmap.direction}</p>
        </div>
      </div>
    </div>
  );
}

/** plain text 리포트(그 외 종류·옛 저장본). */
function TextReport({
  text,
  className,
  plain,
}: {
  text: string;
  className?: string;
  plain: boolean;
}) {
  const { intro, sections } = useMemo(() => parse(text), [text]);
  const { openSet, allOpen, toggle, toggleAll } = useAccordion(sections.length, text);

  if (sections.length === 0) {
    return <div className={`report${className ? ` ${className}` : ""}`}>{text}</div>;
  }

  return (
    <div className={`rv${plain ? " rv--plain" : ""}${className ? ` ${className}` : ""}`}>
      {intro.length > 0 && <div className="rv-intro">{intro.map(renderBlock)}</div>}
      {sections.length > 1 && (
        <div className="rv-tools">
          <button type="button" className="rv-toggle" onClick={toggleAll}>
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
      )}
      {sections.map((s, i) => (
        <details className="rv-sec" key={i} open={openSet.has(i)}>
          <summary
            className="rv-h"
            onClick={(e) => {
              e.preventDefault();
              toggle(i);
            }}
          >
            <span className="t">{s.title}</span>
          </summary>
          <div className="rv-body">{s.blocks.map(renderBlock)}</div>
        </details>
      ))}
    </div>
  );
}
