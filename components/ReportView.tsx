"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * AI 리포트 plain text를 섹션 구조로 파싱해 렌더한다.
 *
 * 프롬프트 출력 규약(lib/prompts/defaults.ts)과 짝을 이룬다:
 * - `▣ 섹션명` → 섹션 카드 (헤더 + 본문)
 * - ● ◆ ◇ ① • ▸ ─x─ 마커 → 본문 블록 스타일
 * - ━/═ 가로줄 배너 → 제거 (페이지가 자체 타이틀을 가짐)
 *
 * 연속된 일반 줄은 직전 블록에 이어붙인다 — AI가 하드랩한 줄바꿈을 풀어
 * 화면 폭에 맞게 자연스럽게 흐르게 하는 반응형 처리의 핵심.
 * ▣가 하나도 없는 텍스트(옛 저장본 등)는 기존 .report 스타일로 폴백.
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

function parse(text: string): { intro: Block[]; sections: Section[] } {
  const sections: Section[] = [];
  let intro: Block[] = [];
  let current: Section | null = null;
  // 일반 줄을 이어붙일 수 있는 마지막 블록 (문단 경계·구분선에서 닫힘)
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
      // 요약 lead에는 이어지는 줄을 붙이지 않는다 (본문 시작과 구분)
      open = null;
      continue;
    }

    let block: Block;
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^●\s*(.+)$/))) {
      const inner = m[1];
      const sep = inner.search(/[:▸]/);
      block =
        sep > 0 && sep <= 16
          ? { kind: "bullet", label: inner.slice(0, sep).trim(), text: inner.slice(sep + 1).trim() }
          : { kind: "bullet", label: null, text: inner.trim() };
    } else if ((m = t.match(/^([◆◇])\s*(.+)$/))) {
      block = { kind: "dia", hollow: m[1] === "◇", text: m[2].trim() };
    } else if ((m = t.match(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*(.+)$/))) {
      block = { kind: "num", marker: m[1], text: m[2].trim() };
    } else if ((m = t.match(/^[─—]+\s*(.+?)\s*[─—]*$/)) && !/^[─—\s]*$/.test(m[1])) {
      // "─ 1~30일 ─" (양쪽) / "─ 적합한 직무" (왼쪽만) 둘 다 소제목으로
      block = { kind: "phase", text: m[1].trim() };
    } else if (SCORE_HEAD.test(t) && t.includes("%")) {
      const arrow = t.indexOf("▸");
      block =
        arrow >= 0
          ? { kind: "score", head: t.slice(0, arrow).trim(), caption: t.slice(arrow + 1).trim() }
          : { kind: "score", head: t, caption: "" };
    } else if ((m = t.match(/^[•·▸]\s*(.+)$/))) {
      block = { kind: "sub", text: m[1].trim() };
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
  const { intro, sections } = useMemo(() => parse(text), [text]);
  // 기본은 전부 접힘 — 헤더 목차만 쭉 보이고 탭하면 펼쳐진다.
  const [openSet, setOpenSet] = useState<ReadonlySet<number>>(() => new Set());

  useEffect(() => {
    setOpenSet(new Set());
  }, [text]);

  if (sections.length === 0) {
    return <div className={`report${className ? ` ${className}` : ""}`}>{text}</div>;
  }

  const allOpen = openSet.size === sections.length;
  const toggle = (i: number) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const toggleAll = () =>
    setOpenSet(allOpen ? new Set() : new Set(sections.map((_, i) => i)));

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
