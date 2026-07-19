"use client";

import { ELEMENT_META, type Element, type FlowCell, type Verdict } from "@/lib/saju/yongsinView";

/**
 * 생애 연대기 리본 — 대운(10년 단위)을 '나이 축' 위에 가로 막대로 펼쳐,
 * 어떤 기운이 ★언제부터 언제까지★ 들어오는지 한눈에 보여준다.
 * ★AI 호출 없음 — buildYongsinView가 만든 결정론 값만 그린다.★
 *
 * 두 가지 모드로 쓴다:
 * - 기본(focus 없음): 종합 판정(순풍/역풍) 색칠.
 * - focus 모드: 격국·억부·조후 ★한 방법이 꼽은 기운★만 기준으로, 그 기운이 들어오는
 *   구간만 칠한다. 방법 카드마다 "이 방법이 말하는 기운은 언제 오나"를 붙이는 용도.
 */

const VCLS: Record<Verdict, "good" | "help" | "mid" | "bad"> = { 용신: "good", 도움: "help", 중립: "mid", 기신: "bad" };
type LineState = "good" | "help" | "mid" | "bad" | "mixed";

type Win = { from: number; to: number };

export type LifelineFocus = {
  /** 이 방법이 꼽은 기운. 이 중 하나라도 들어오는 칸을 칠한다. */
  els: Element[];
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

const isGood = (v: Verdict) => v === "용신" || v === "도움";
const isBad = (v: Verdict) => v === "기신";

/** 이 칸(천간·지지 중 하나라도)에 대상 기운이 들어와 있나. */
const hasEl = (c: FlowCell, els: Element[]) => els.includes(c.element) || els.includes(c.branchElement);

function stateOf(c: FlowCell): LineState {
  const verdicts = [c.verdict, c.branchVerdict];
  if (verdicts.some(isGood) && verdicts.some(isBad)) return "mixed";
  if (c.verdict !== "중립") return VCLS[c.verdict];
  return VCLS[c.branchVerdict];
}

function elLabel(c: FlowCell): string {
  const stem = ELEMENT_META[c.element].label;
  const branch = ELEMENT_META[c.branchElement].label;
  return c.element === c.branchElement ? stem : `${stem}/${branch}`;
}

export default function YongsinLifeline({
  cells,
  currentAge,
  focus,
}: {
  cells: FlowCell[];
  currentAge?: number;
  focus?: LifelineFocus;
}) {
  const dae = cells.filter((c) => c.startAge != null && c.endAge != null);
  if (dae.length < 2) return null;

  const axisStart = dae[0].startAge!;
  const axisEnd = dae[dae.length - 1].endAge!;
  const span = axisEnd - axisStart || 1;
  const pct = (age: number) => ((age - axisStart) / span) * 100;

  // 경계 눈금 = 각 대운 시작 나이 + 마지막 대운 끝 나이.
  const ticks = [...dae.map((c) => c.startAge!), axisEnd];

  const nowIn = currentAge != null && currentAge >= axisStart && currentAge <= axisEnd;
  const nowPct = nowIn ? Math.min(100, Math.max(0, pct(currentAge!))) : null;

  // focus 모드는 '그 기운이 들어오나'만 본다 — 순풍/역풍 판정은 섞지 않는다.
  const segState = (c: FlowCell): LineState =>
    focus ? (hasEl(c, focus.els) ? "good" : "mid") : stateOf(c);

  const goodWins = mergeWindows(dae, (c) => segState(c) === "good");
  const mixedWins = focus ? [] : mergeWindows(dae, (c) => stateOf(c) === "mixed");
  const badWins = focus ? [] : mergeWindows(dae, (c) => stateOf(c) === "bad");

  // focus 모드에서 지금 지나는 칸에 그 기운이 들어와 있는지 — "지금은 오나?"에 바로 답해준다.
  const nowCell = dae.find((c) => c.isNow);
  const nowHasFocus = focus && nowCell ? hasEl(nowCell, focus.els) : false;

  return (
    <div className={`yv-line${focus ? " yv-line--focus" : ""}`}>
      <div className="yv-line-track">
        {nowPct != null && (
          <div className="yv-line-now" style={{ left: `${nowPct}%` }}>
            <span className="yv-line-now-tag">지금 {currentAge}세</span>
          </div>
        )}
        <div className="yv-line-bar" role="list" aria-label={focus ? `${focus.label}이 들어오는 시기` : "대운 생애 흐름 연대기"}>
          {dae.map((c, i) => {
            const state = segState(c);
            return (
              <div
                key={`${c.startAge}-${i}`}
                role="listitem"
                className={`yv-line-seg yv-line-seg--${state}${c.isNow ? " is-now" : ""}`}
                style={{ flexGrow: (c.endAge! - c.startAge!) || 1 }}
                title={
                  focus
                    ? `${c.startAge}~${c.endAge}세 · ${elLabel(c)} 기운${hasEl(c, focus.els) ? " — 이 방법이 꼽은 기운이 들어와" : ""}`
                    : `${c.startAge}~${c.endAge}세 · 천간 ${ELEMENT_META[c.element].label}(${c.verdict}) / 지지 ${ELEMENT_META[c.branchElement].label}(${c.branchVerdict})`
                }
              >
                <b className="yv-line-el">{elLabel(c)}</b>
                {state === "mixed" && <span className="yv-line-mix">혼재</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="yv-line-axis" aria-hidden>
        {ticks.map((age, i) => {
          const edge = i === 0 ? "0" : i === ticks.length - 1 ? "-100%" : "-50%";
          const label = i === 0 || i === ticks.length - 1 ? `${age}세` : `${age}`;
          return (
            <span key={age} className="yv-line-tick" style={{ left: `${pct(age)}%`, transform: `translateX(${edge})` }}>
              {label}
            </span>
          );
        })}
      </div>

      <div className="yv-line-sum">
        {focus ? (
          <p className="yv-line-sum-row yv-line-sum-row--good">
            <span className="yv-line-sum-k">언제 들어와</span>
            <span>
              {goodWins.length ? (
                <>
                  {fmtWins(goodWins)}
                  {nowHasFocus ? " — 지금이 딱 그때야." : " — 지금은 아직이야."}
                </>
              ) : (
                "평생 대운에는 이 기운이 뚜렷하게 들어오는 구간이 없어. 그래서 기다리기보다 네가 직접 끌어다 써야 해."
              )}
            </span>
          </p>
        ) : (
          <>
            <p className="yv-line-sum-row yv-line-sum-row--good">
              <span className="yv-line-sum-k">보약 기운 순풍 구간</span>
              <span>
                {goodWins.length
                  ? fmtWins(goodWins)
                  : "앞 대운엔 뚜렷한 순풍 구간이 도드라지진 않아 — 지금 가진 기운을 잘 쓰는 쪽으로 봐."}
              </span>
            </p>
            {badWins.length > 0 && (
              <p className="yv-line-sum-row yv-line-sum-row--bad">
                <span className="yv-line-sum-k">과부하 역풍 구간</span>
                <span>{fmtWins(badWins)}</span>
              </p>
            )}
            {mixedWins.length > 0 && (
              <p className="yv-line-sum-row yv-line-sum-row--mixed">
                <span className="yv-line-sum-k">보약·과부하 혼재 구간</span>
                <span>{fmtWins(mixedWins)} · 밀어붙이되 무리수는 줄이는 구간</span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
