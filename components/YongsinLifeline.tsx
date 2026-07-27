"use client";

import { useEffect, useRef, useState } from "react";
import { scheduleAlignCurrentStart } from "@/lib/ui/scroll";
import { ELEMENT_META, computeMonthFlow, type Element, type FlowCell } from "@/lib/saju/yongsinView";

/**
 * 생애 연대기 — 격국·억부·조후 카드마다 "이 방법이 꼽은 기운은 언제 오나"를 보여준다.
 * ★AI 호출 없음 — buildYongsinView가 만든 결정론 값만 그린다.★
 *
 * 기본(접힘)은 "좋은 기간 / 나쁜 기간" 두 줄 요약만. 펼치면 만세력 스타일 카드(한자+음,
 * 십성 없음)로 대운(생애 9구간) + 가까운 세운(10년)이 나오고, 세운 카드를 누르면 그 해
 * 월운(12개월)까지 같은 카드로 드릴다운된다. 좋은 기간은 초록, 나쁜 기간은 붉은 배경.
 */

type LineState = "good" | "bad" | "mid" | "mixed";

type Win = { from: number; to: number };

export type LifelineFocus = {
  /** 이 방법이 꼽은 '좋은' 기운. 이 중 하나라도 들어오는 칸을 좋은 기간으로 친다. */
  els: Element[];
  /** 이 방법이 꼽은 '나쁜(과부하)' 기운 — 있는 방법(억부)만 넘긴다. */
  badEls?: Element[];
  /** 요약 줄에 붙일 이름 — 예: "그릇을 완성시키는 기운" */
  label: string;
};

/** 나이 오름차순 대운에서 조건에 맞는 판정이 이어지는 구간을 하나로 병합. */
function mergeWindows(cells: FlowCell[], keep: (c: FlowCell) => boolean): Win[] {
  const wins: Win[] = [];
  for (const c of cells) {
    if (c.startAge == null || c.endAge == null || !keep(c)) continue;
    const last = wins[wins.length - 1];
    if (last && last.to === c.startAge) last.to = c.endAge;
    else wins.push({ from: c.startAge, to: c.endAge });
  }
  return wins;
}

const fmtWins = (w: Win[]) => w.map((x) => `${x.from}~${x.to}세`).join(" · ");

/** 이 칸(천간·지지 중 하나라도)에 대상 기운이 들어와 있나. */
const hasEl = (c: FlowCell, els: Element[]) => els.includes(c.element) || els.includes(c.branchElement);

function elLabel(c: FlowCell): string {
  const stem = ELEMENT_META[c.element].label;
  const branch = ELEMENT_META[c.branchElement].label;
  return c.element === c.branchElement ? stem : `${stem}/${branch}`;
}

export default function YongsinLifeline({
  cells,
  years,
  currentAge,
  focus,
}: {
  /** 대운(생애 전체, 보통 9구간) */
  cells: FlowCell[];
  /** 세운(가까운 10년) — 주면 대운 카드 레일 아래에 붙는다. */
  years?: FlowCell[];
  currentAge?: number;
  focus: LifelineFocus;
}) {
  const [expanded, setExpanded] = useState(false);
  // 기본값 = 올해(세운 중 '지금' 칸) — 펼치면 세운 카드를 따로 누르지 않아도 올해 월운이 바로 보인다.
  const [selectedYear, setSelectedYear] = useState<number | null>(() => years?.find((c) => c.isNow)?.year ?? null);
  const daeRailRef = useRef<HTMLDivElement>(null);

  // 펼쳤을 때 대운 레일의 '지금' 카드를 왼쪽 근처로 맞춰, 스크롤 없이 바로 보이게.
  useEffect(() => {
    if (!expanded) return;
    return scheduleAlignCurrentStart(() => [daeRailRef.current], ".yv-card.now");
  }, [expanded]);

  const dae = cells.filter((c) => c.startAge != null && c.endAge != null);
  if (dae.length < 2) return null;

  const seun = years ?? [];
  const badEls = focus.badEls ?? [];

  const segState = (c: FlowCell): LineState => {
    const bad = badEls.length > 0 && hasEl(c, badEls);
    const good = hasEl(c, focus.els);
    if (bad && good) return "mixed";
    if (bad) return "bad";
    if (good) return "good";
    return "mid";
  };

  const goodWins = mergeWindows(dae, (c) => segState(c) === "good" || segState(c) === "mixed");
  const badWins = mergeWindows(dae, (c) => segState(c) === "bad" || segState(c) === "mixed");

  const nowCell = dae.find((c) => c.isNow);
  const nowHasGood = nowCell ? segState(nowCell) === "good" || segState(nowCell) === "mixed" : false;

  const seunNowYear = seun.find((c) => c.isNow)?.year;
  const now = new Date();
  const monthFlow = selectedYear != null ? computeMonthFlow(selectedYear, focus.els, badEls) : null;
  const goodMonths = monthFlow ? monthFlow.filter((c) => hasEl(c, focus.els)).map((c) => c.label) : [];

  return (
    <div className="yv-timing">
      <div className="yv-timing-sum">
        <p className="yv-timing-row yv-timing-row--good">
          <span className="yv-timing-k">좋은 기간</span>
          <span>
            {goodWins.length
              ? `${fmtWins(goodWins)}${nowHasGood ? " — 지금이 딱 그때야." : ""}`
              : "평생 대운에는 이 기운이 뚜렷하게 들어오는 구간이 없어 — 기다리기보다 네가 직접 끌어다 써야 해."}
          </span>
        </p>
        {badWins.length > 0 && (
          <p className="yv-timing-row yv-timing-row--bad">
            <span className="yv-timing-k">나쁜 기간</span>
            <span>{fmtWins(badWins)}</span>
          </p>
        )}
      </div>

      <button
        type="button"
        className="yv-timing-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? "접기 ▴" : "대운·세운 자세히 보기 ▾"}
      </button>

      {expanded && (
        <div className="yv-cardview">
          <div className="yv-cards" role="list" aria-label={`${focus.label}이 들어오는 시기 — 대운`} ref={daeRailRef}>
            {dae.map((c) => (
              <TimeCard key={`dw-${c.label}`} cell={c} goodEls={focus.els} badEls={badEls} />
            ))}
          </div>

          {seun.length > 0 && (
            <div className="yv-cards-block">
              <span className="yv-cards-k">
                가까운 10년 ({seun[0].year}~{seun[seun.length - 1].year}년) · 눌러서 월운 보기
              </span>
              <div className="yv-cards yv-cards--sm" role="list">
                {seun.map((c) => (
                  <TimeCard
                    key={`sw-${c.year}`}
                    cell={c}
                    goodEls={focus.els}
                    badEls={badEls}
                    currentAge={currentAge}
                    anchorYear={seunNowYear}
                    selected={selectedYear === c.year}
                    onClick={() => setSelectedYear((y) => (y === c.year ? null : c.year))}
                  />
                ))}
              </div>
            </div>
          )}

          {monthFlow && selectedYear != null && (
            <div className="yv-cards-block">
              <span className="yv-cards-k">{selectedYear}년 월운</span>
              <div className="yv-cards yv-cards--sm" role="list">
                {monthFlow.map((c) => {
                  const isThisMonth = selectedYear === now.getFullYear() && c.label === `${now.getMonth() + 1}월`;
                  return <TimeCard key={`wl-${c.label}`} cell={c} goodEls={focus.els} badEls={badEls} forceNow={isThisMonth} />;
                })}
              </div>
              <span className="yv-cards-note">
                {goodMonths.length ? `${goodMonths.join(" · ")}에 이 기운이 들어와.` : "이 해엔 달마다 뚜렷하게 들어오는 달이 적어."}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 만세력 스타일 카드 한 칸 — 십성 없이 오행 색 + 한자 + 음(훈)만. */
function TimeCard({
  cell,
  goodEls,
  badEls,
  currentAge,
  anchorYear,
  selected,
  forceNow,
  onClick,
}: {
  cell: FlowCell;
  goodEls: Element[];
  badEls: Element[];
  currentAge?: number;
  anchorYear?: number;
  selected?: boolean;
  forceNow?: boolean;
  onClick?: () => void;
}) {
  const good = hasEl(cell, goodEls);
  const bad = badEls.length > 0 && hasEl(cell, badEls);
  const state = good && bad ? "mixed" : good ? "good" : bad ? "bad" : "";
  const isNow = cell.isNow || Boolean(forceNow);
  const cls = ["yv-card", state, isNow ? "now" : "", selected ? "selected" : "", onClick ? "tappable" : ""]
    .filter(Boolean)
    .join(" ");

  const sub =
    cell.kind === "대운"
      ? `${cell.year}~`
      : cell.kind === "세운" && currentAge != null && anchorYear != null
        ? `${currentAge + (cell.year - anchorYear)}세`
        : undefined;

  const inner = (
    <>
      <div className="yv-card-head">
        <span className="yv-card-label">{cell.label}</span>
        {sub && <span className="yv-card-sub">{sub}</span>}
        {isNow && <span className="yv-card-now">지금</span>}
      </div>
      <GzMini ko={cell.ganzhi[0]} hanja={cell.ganHanja} el={cell.element} yinyang={cell.ganYinYang} />
      <GzMini ko={cell.ganzhi[1]} hanja={cell.zhiHanja} el={cell.branchElement} yinyang={cell.zhiYinYang} />
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={cls} role="listitem" onClick={onClick} title={`${elLabel(cell)} 기운(${cell.ganzhi}) — 눌러서 월운 보기`}>
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} role="listitem" title={`${elLabel(cell)} 기운(${cell.ganzhi})`}>
      {inner}
    </div>
  );
}

function GzMini({ ko, hanja, el, yinyang }: { ko: string; hanja: string; el: Element; yinyang: "양" | "음" }) {
  const meta = ELEMENT_META[el];
  return (
    <div className="yv-card-gz" style={{ background: `var(${meta.cssVar}-bg)` }}>
      <span className="yv-card-gz-ko" style={{ color: `var(${meta.cssVar})` }}>{hanja}</span>
      <span className="yv-card-gz-han">{ko} {meta.label}{yinyang}</span>
    </div>
  );
}
