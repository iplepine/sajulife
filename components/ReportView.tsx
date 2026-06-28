"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DIM_COLOR_BY_LABEL } from "@/components/TciRadar";
import {
  parseFamilyReport,
  parsePersonalReport,
  type DayunReading,
  type FamilyReport,
  type PersonalReport,
} from "@/lib/report/types";

/** 기질 해설/점수 줄의 맨 앞 차원명을 찾아 그 차원색을 돌려준다(기질 풀이 전용 신호). */
function dimColorOf(text: string): string | null {
  const m = text.match(/^\s*(추진성|안정성|공감성|지속성|주도성|연결성|통찰성|유연성)/);
  return m ? DIM_COLOR_BY_LABEL[m[1]] ?? null : null;
}

/**
 * AI 풀이를 섹션 구조로 렌더한다. 두 입력 모두 지원:
 *
 * 1) 구조화 JSON (개인 사주 풀이) — lib/report/types.ts(PersonalReport) 모양이면
 *    제목·키워드·섹션·로드맵을 정규식 파싱 없이 그대로 렌더한다. 각 섹션 body는
 *    여전히 마커 텍스트라 아래 블록 파서를 재사용한다.
 * 2) plain text (그 외 풀이·옛 저장본) — `▣ 섹션`/`● ◆ ◇ ① • ▸ ─x─` 마커를
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
type ReportViewMode = "report" | "consult";

// 가로줄/구분선(유니코드 박스 문자 + ASCII 하이픈·언더스코어·등호)을 통째로 버린다.
const RULE_LINE = /^[\s]*[━═─—–\-_=]{3,}[\s]*$/;
const SCORE_HEAD = /^(추진성|안정성|공감성|지속성|주도성|연결성|통찰성|유연성)\s+\d/;

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
  if (SCORE_HEAD.test(t) && t.includes("%") && t.includes("▸")) {
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
      // "1. [기본성향] 한 문장 요약…" 형태는 제목과 요약을 분리해
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

  // 배너 제목("기질 풀이" 등) 제거 — 섹션 앞의 짧은 단독 줄
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
    case "num": {
      const color = dimColorOf(b.text);
      const m = color
        ? b.text.match(/^(추진성|안정성|공감성|지속성|주도성|연결성|통찰성|유연성)(.*)$/s)
        : null;
      return (
        <p
          className="rv-li rv-li--num"
          key={i}
          style={color ? { borderLeft: `3px solid ${color}`, paddingLeft: 10, borderRadius: 0 } : undefined}
        >
          <span className="mk" style={color ? { color } : undefined}>{b.marker}</span>
          {m ? (
            <span><b style={{ color: color as string }}>{m[1]}</b>{m[2]}</span>
          ) : (
            <span>{b.text}</span>
          )}
        </p>
      );
    }
    case "dia":
      return <p className={`rv-li rv-li--dia${b.hollow ? " hollow" : ""}`} key={i}>{b.text}</p>;
    case "phase":
      return <div className="rv-phase" key={i}>{b.text}</div>;
    case "score": {
      const color = dimColorOf(b.head);
      return (
        <div className="rv-score" key={i}>
          <span className="head" style={color ? { color } : undefined}>{b.head}</span>
          {b.caption && <span className="cap">{b.caption}</span>}
        </div>
      );
    }
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
  currentAge,
  showFamilyActionPlan = true,
  mode = "report",
}: {
  text: string;
  className?: string;
  /** 카드 안에 중첩될 때 — 섹션 카드 테두리 없이 헤더+본문만 */
  plain?: boolean;
  /** 인생 흐름에서 "지금" 구간을 강조하기 위한 만 나이 (없으면 강조 생략). */
  currentAge?: number;
  /** 가족 JSON 풀이의 actionPlan을 본문 안에 읽기 전용으로 보여줄지 여부. */
  showFamilyActionPlan?: boolean;
  /** 상담 답변처럼 실행 순서가 중요한 텍스트는 전용 단계형 레이아웃으로 렌더한다. */
  mode?: ReportViewMode;
}) {
  const report = useMemo(() => parsePersonalReport(text), [text]);
  const family = useMemo(() => parseFamilyReport(text), [text]);
  if (report) {
    return (
      <StructuredReport report={report} className={className} plain={plain} currentAge={currentAge} />
    );
  }
  if (family) {
    return <FamilyReportView report={family} className={className} plain={plain} showActionPlan={showFamilyActionPlan} />;
  }
  return <TextReport text={text} className={className} plain={plain} mode={mode} />;
}

/** 구조화 JSON 가족 풀이 — 캐스팅 · 1대1 케미 카드 · 기운 지도 · 가족 의식. */
function FamilyReportView({
  report,
  className,
  plain,
  showActionPlan,
}: {
  report: FamilyReport;
  className?: string;
  plain: boolean;
  showActionPlan: boolean;
}) {
  if (report.sections.length > 0) {
    return <FamilySectionReport report={report} className={className} plain={plain} showActionPlan={showActionPlan} />;
  }

  const { rituals } = report;
  return (
    <div className={`rv rv--json${plain ? " rv--plain" : ""}${className ? ` ${className}` : ""}`}>
      <div className="rv-hero">
        <p className="rv-title">{report.title}</p>
      </div>

      {report.cast.length > 0 && (
        <div className="fcast">
          <p className="fsec-h">가족 캐스팅</p>
          <ul className="fcast-list">
            {report.cast.map((c, i) => (
              <li className="fcast-row" key={i}>
                <span className="fcast-rel">{c.relation}</span>
                <b className="fcast-name">{c.name}</b>
                {(c.metaphor || c.zodiac) && (
                  <span className="fcast-meta">
                    {c.metaphor}
                    {c.metaphor && c.zodiac ? " · " : ""}
                    {c.zodiac}
                  </span>
                )}
                {c.character && <p className="fcast-char">{c.character}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.compat.length > 0 && (
        <div className="fcompat-wrap">
          <p className="fsec-h">1대1 케미 카드</p>
          {report.compat.map((c, i) => (
            <div className="fcompat" key={i}>
              <div className="fcompat-head">
                <span className="fcompat-rel">{c.relation}</span>
                <span className="fcompat-name">{c.name} 님과의 결</span>
                {c.bond && <span className="fcompat-bond">{c.bond}</span>}
              </div>
              <div className="fcompat-body">
                <CompatField label="만남" text={c.meeting} />
                <CompatField label="잘 맞는 순간" text={c.goodMoments} tone="good" />
                <CompatField label="부딪치기 쉬운 순간" text={c.frictionMoments} tone="bad" />
                <CompatField label="시도할 한 가지" text={c.oneTry} tone="try" />
              </div>
            </div>
          ))}
        </div>
      )}

      {report.elementMap && <FamilyProse title="가족 기운 지도" body={report.elementMap} />}
      {report.togetherMood && <FamilyProse title="함께일 때의 분위기" body={report.togetherMood} />}

      {report.cautionScenes.length > 0 && (
        <div className="fscenes">
          <p className="fsec-h">주의가 필요한 장면</p>
          {report.cautionScenes.map((s, i) => (
            <div className="fscene" key={i}>
              {s.title && <p className="fscene-t">{s.title}</p>}
              {s.body && <p className="fscene-b">{s.body}</p>}
            </div>
          ))}
        </div>
      )}

      {(rituals.today || rituals.thisWeek || rituals.thisMonth) && (
        <div className="frit">
          <p className="fsec-h">지금부터 함께하는 가족 의식</p>
          {rituals.today && <div className="frit-row"><span className="frit-when">오늘</span><p>{rituals.today}</p></div>}
          {rituals.thisWeek && <div className="frit-row"><span className="frit-when">이번 주</span><p>{rituals.thisWeek}</p></div>}
          {rituals.thisMonth && <div className="frit-row"><span className="frit-when">이번 달</span><p>{rituals.thisMonth}</p></div>}
        </div>
      )}

      {report.disclaimer && <p className="rv-disclaimer">{report.disclaimer}</p>}
    </div>
  );
}

function FamilySectionReport({
  report,
  className,
  plain,
  showActionPlan,
}: {
  report: FamilyReport;
  className?: string;
  plain: boolean;
  showActionPlan: boolean;
}) {
  const { openSet, allOpen, toggle, toggleAll } = useAccordion(report.sections.length, report);
  const actionPlan = report.actionPlan.filter((a) => a?.title?.trim()).slice(0, 3);

  return (
    <div className={`rv rv--json${plain ? " rv--plain" : ""}${className ? ` ${className}` : ""}`}>
      {report.sections.length > 1 && (
        <div className="rv-tools">
          <button type="button" className="rv-toggle" onClick={toggleAll}>
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
      )}

      {report.sections.map((s, i) => (
        <details className={`rv-sec rv-sec--family ${familySectionToneClass(s)}`} key={s.id} open={openSet.has(i)}>
          <summary
            className={`rv-h${s.summary ? " rv-h--with-lead" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              toggle(i);
            }}
          >
            <span className="rv-h-copy">
              <span className="t">{displayFamilySectionTitle(s)}</span>
              {s.summary && <span className="rv-h-lead">{s.summary}</span>}
            </span>
          </summary>
          <div className="rv-body">
            {parseBlocks(s.body).map(renderBlock)}
          </div>
        </details>
      ))}

      {showActionPlan && actionPlan.length > 0 && <FamilyActionPlan actions={actionPlan} />}

      {report.disclaimer && <p className="rv-disclaimer">{report.disclaimer}</p>}
    </div>
  );
}

function displayFamilySectionTitle(section: { id: string }): string {
  const id = normalizedSectionId(section);
  const aliases: Record<string, string> = {
    기본성향: "기본성향",
    가족역할지도: "가족 역할 지도",
    관계별케미: "관계별 케미",
    자녀양육가이드: "자녀 양육 가이드",
    가족분위기: "가족분위기",
    갈등시나리오: "갈등 시나리오",
    가족건강운: "가족건강운",
    가족금전운: "가족금전운",
    가족대운별비교: "가족대운 별 비교",
    올해실행전략: "올해 실행전략",
  };
  return aliases[id] ?? section.id;
}

function familySectionToneClass(section: { id: string }): string {
  const id = normalizedSectionId(section);
  const aliases: Record<string, string> = {
    기본성향: "rv-sec--tone-core",
    가족역할지도: "rv-sec--tone-core",
    관계별케미: "rv-sec--tone-relation",
    자녀양육가이드: "rv-sec--tone-relation",
    가족분위기: "rv-sec--tone-relation",
    갈등시나리오: "rv-sec--tone-flow",
    가족건강운: "rv-sec--tone-health",
    가족금전운: "rv-sec--tone-money",
    가족대운별비교: "rv-sec--tone-flow",
    올해실행전략: "rv-sec--tone-action",
  };
  return aliases[id] ?? "rv-sec--tone-base";
}

function FamilyActionPlan({ actions }: { actions: FamilyReport["actionPlan"] }) {
  return (
    <div className="faction">
      <p className="fsec-h">바로 쓰는 가족 액션</p>
      <ol className="faction-list">
        {actions.map((a, i) => (
          <li className="faction-row" key={`${a.timeframe || "action"}-${i}`}>
            {a.timeframe && <span className="faction-when">{a.timeframe}</span>}
            <div className="faction-copy">
              <p className="faction-title">{a.title}</p>
              {a.hint && <p className="faction-hint">{a.hint}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CompatField({ label, text, tone }: { label: string; text: string; tone?: "good" | "bad" | "try" }) {
  if (!text) return null;
  return (
    <div className={`fcompat-field${tone ? ` ${tone}` : ""}`}>
      <span className="fcompat-label">{label}</span>
      <p>{text}</p>
    </div>
  );
}

function FamilyProse({ title, body }: { title: string; body: string }) {
  return (
    <div className="fprose">
      <p className="fsec-h">{title}</p>
      {body.split("\n").map((line, i) => {
        const t = line.trim();
        return t ? <p className="rv-p" key={i}>{t}</p> : null;
      })}
    </div>
  );
}

/** 구조화 JSON 풀이(개인 사주) — 제목·키워드·섹션·인생 흐름·로드맵. */
function StructuredReport({
  report,
  className,
  plain,
  currentAge,
}: {
  report: PersonalReport;
  className?: string;
  plain: boolean;
  currentAge?: number;
}) {
  const { sections } = report;
  const hasDayunSection = sections.some(isDayunSection);
  const shouldAppendDayun = !hasDayunSection && !!report.lifeline?.length;
  const foldedCount = sections.length + (shouldAppendDayun ? 1 : 0);
  const { openSet, allOpen, toggle, toggleAll } = useAccordion(foldedCount, report);
  let foldedIndex = 0;

  return (
    <div className={`rv rv--json${plain ? " rv--plain" : ""}${className ? ` ${className}` : ""}`}>
      {foldedCount > 1 && (
        <div className="rv-tools">
          <button type="button" className="rv-toggle" onClick={toggleAll}>
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
      )}

      {sections.map((s) => {
        const i = foldedIndex++;
        return (
        <details className="rv-sec rv-sec--personal" key={s.id} open={openSet.has(i)}>
          <summary
            className={`rv-h${s.summary ? " rv-h--with-lead" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              toggle(i);
            }}
          >
            <span className="rv-h-copy">
              <span className="t">{displayPersonalSectionTitle(s)}</span>
              {s.summary && <span className="rv-h-lead">{s.summary}</span>}
            </span>
          </summary>
          <div className="rv-body">
            {parseBlocks(s.body).map(renderBlock)}
            {isDayunSection(s) && report.lifeline && report.lifeline.length > 0 && (
              <LifelineCard lifeline={report.lifeline} currentAge={currentAge} />
            )}
          </div>
        </details>
        );
      })}

      {shouldAppendDayun && (
        <details className="rv-sec rv-sec--personal" open={openSet.has(foldedIndex)}>
          <summary
            className="rv-h"
            onClick={(e) => {
              e.preventDefault();
              toggle(foldedIndex);
            }}
          >
            <span className="t">대운</span>
          </summary>
          <div className="rv-body">
            <LifelineCard lifeline={report.lifeline ?? []} currentAge={currentAge} />
          </div>
        </details>
      )}

      {report.disclaimer && <p className="rv-disclaimer">{report.disclaimer}</p>}
    </div>
  );
}

function normalizedSectionId(section: { id: string }): string {
  return section.id.replace(/\s+/g, "").trim();
}

function isDayunSection(section: { id: string }): boolean {
  const id = normalizedSectionId(section);
  return id === "대운" || id === "장기적운의흐름";
}

function displayPersonalSectionTitle(section: { id: string }): string {
  const id = normalizedSectionId(section);
  const aliases: Record<string, string> = {
    기본성향: "기본성향",
    오행구성: "오행구성",
    직업적성및비즈니스: "직업운",
    인간관계및평판: "인간관계운",
    신체및멘탈관리: "건강운",
    장기적운의흐름: "대운",
    연간실행전략: "올해 실행전략",
  };
  return aliases[id] ?? section.id;
}

const SEASON_KEY: Record<string, string> = {
  봄: "spring",
  여름: "summer",
  가을: "autumn",
  겨울: "winter",
};

const LIFE_TONE_LABEL: Record<string, string> = {
  "받는 결": "배우고 채우는 시기",
  "여는 결": "시작하고 펼치는 시기",
  "주는 결": "나누고 남기는 시기",
};

function displayLifeTone(tone?: string): string {
  const key = (tone ?? "").trim();
  return LIFE_TONE_LABEL[key] ?? key;
}

/**
 * 인생 흐름 — 대운 9구간을 세로 타임라인으로. LifeCircle 계절 시계의 9점과 1:1.
 * currentAge가 들어오면 그 나이가 속한 구간을 "지금"으로 강조한다(렌더 시점 계산 → 나이 들어도 정확).
 */
function LifelineCard({ lifeline, currentAge }: { lifeline: DayunReading[]; currentAge?: number }) {
  return (
    <div className="llife">
      <div className="llife-head">
        <span className="llife-badge">인생 시기</span>
        <span className="llife-sub">10년 단위 시기 {lifeline.length}구간</span>
      </div>
      <ol className="llife-rows">
        {lifeline.map((d, i) => {
          const isCurrent =
            currentAge != null && currentAge >= d.startAge && currentAge <= d.endAge;
          const isPast = currentAge != null && currentAge > d.endAge;
          const season = SEASON_KEY[(d.season ?? "").trim()] ?? "";
          const tone = displayLifeTone(d.tone);
          return (
            <li
              key={i}
              className={`llife-row${isCurrent ? " now" : ""}${isPast ? " past" : ""}`}
              data-season={season}
            >
              <span className="llife-age">
                {d.startAge}–{d.endAge}
              </span>
              <span className="llife-rail" aria-hidden="true">
                <i className="llife-dot" />
              </span>
              <div className="llife-body">
                <span className="llife-meta">
                  {isCurrent && <em className="llife-nowtag">지금</em>}
                  <span className="llife-season">{d.seasonLabel}</span>
                  {tone && <span className="llife-tone">· {tone}</span>}
                </span>
                <p className="llife-text">{d.summary}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** plain text 풀이(그 외 종류·옛 저장본). */
function TextReport({
  text,
  className,
  plain,
  mode,
}: {
  text: string;
  className?: string;
  plain: boolean;
  mode: ReportViewMode;
}) {
  const { intro, sections } = useMemo(() => parse(text), [text]);
  const { openSet, allOpen, toggle, toggleAll } = useAccordion(sections.length, text);

  if (sections.length === 0) {
    return <div className={`report${className ? ` ${className}` : ""}`}>{text}</div>;
  }

  if (mode === "consult") {
    return <ConsultTextReport intro={intro} sections={sections} className={className} plain={plain} />;
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

function ConsultTextReport({
  intro,
  sections,
  className,
  plain,
}: {
  intro: Block[];
  sections: Section[];
  className?: string;
  plain: boolean;
}) {
  const lead = sections[0];
  const rest = sections.slice(1);

  return (
    <div className={`rv consult-answer${plain ? " rv--plain" : ""}${className ? ` ${className}` : ""}`}>
      {intro.length > 0 && <div className="rv-intro">{intro.map(renderBlock)}</div>}

      {lead && (
        <section className="consult-answer-hero">
          <span className="consult-answer-k">핵심 진단</span>
          <h3>{lead.title}</h3>
          <div className="consult-answer-body">{lead.blocks.map(renderBlock)}</div>
        </section>
      )}

      <div className="consult-answer-flow">
        {rest.map((s, i) => {
          const meta = consultSectionMeta(s.title);
          return (
            <section className={`consult-answer-sec ${meta.className}`} key={`${s.title}-${i}`}>
              <div className="consult-answer-sec-head">
                <span className="consult-step">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <span className="consult-answer-k">{meta.kicker}</span>
                  <h3>{meta.title}</h3>
                </div>
              </div>
              <div className="consult-answer-body">{s.blocks.map(renderBlock)}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function consultSectionMeta(title: string): { title: string; kicker: string; className: string } {
  const normalized = title.replace(/\s+/g, "");
  if (normalized.includes("같은결")) {
    return { title: "반복 역할과 패턴", kicker: "왜 반복되는지", className: "consult-answer-sec--pattern" };
  }
  if (normalized.includes("풀어가면")) {
    return { title: "상대 반응 시뮬레이션", kicker: "말하고 받아치는 순서", className: "consult-answer-sec--simulate" };
  }
  if (normalized.includes("사흘") || normalized.includes("해볼")) {
    return { title: "오늘 바로 할 행동", kicker: "작게 시작하기", className: "consult-answer-sec--action" };
  }
  if (normalized.includes("마음")) {
    return { title: "마음에 둘 한 줄", kicker: "마무리 기준", className: "consult-answer-sec--close" };
  }
  return { title, kicker: "상담 메모", className: "consult-answer-sec--note" };
}
