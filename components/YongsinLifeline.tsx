"use client";

import { ELEMENT_META, type FlowCell, type Verdict } from "@/lib/saju/yongsinView";

/**
 * 생애 연대기 리본 — 대운(10년 단위)을 '나이 축' 위에 가로 막대로 펼쳐,
 * 위에서 뽑은 보약 기운(용신)이 ★언제부터 언제까지★ 들어오는지 한눈에 보여준다.
 * 색은 순풍/역풍 '신호'로만(YongsinBoard 레일과 같은 팔레트, 이모지 없음).
 * ★AI 호출 없음 — buildYongsinView가 만든 결정론 값만 그린다.★
 */

const VCLS: Record<Verdict, "good" | "help" | "mid" | "bad"> = { 용신: "good", 도움: "help", 중립: "mid", 기신: "bad" };
type LineState = "good" | "help" | "mid" | "bad" | "mixed";

type Win = { from: number; to: number };

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

export default function YongsinLifeline({ cells, currentAge }: { cells: FlowCell[]; currentAge?: number }) {
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

  const goodWins = mergeWindows(dae, (c) => stateOf(c) === "good");
  const mixedWins = mergeWindows(dae, (c) => stateOf(c) === "mixed");
  const badWins = mergeWindows(dae, (c) => stateOf(c) === "bad");

  return (
    <div className="yv-line">
      <div className="yv-line-track">
        {nowPct != null && (
          <div className="yv-line-now" style={{ left: `${nowPct}%` }}>
            <span className="yv-line-now-tag">지금 {currentAge}세</span>
          </div>
        )}
        <div className="yv-line-bar" role="list" aria-label="대운 생애 흐름 연대기">
          {dae.map((c, i) => {
            const state = stateOf(c);
            return (
              <div
                key={`${c.startAge}-${i}`}
                role="listitem"
                className={`yv-line-seg yv-line-seg--${state}${c.isNow ? " is-now" : ""}`}
                style={{ flexGrow: (c.endAge! - c.startAge!) || 1 }}
                title={`${c.startAge}~${c.endAge}세 · 천간 ${ELEMENT_META[c.element].label}(${c.verdict}) / 지지 ${ELEMENT_META[c.branchElement].label}(${c.branchVerdict})`}
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
        <p className="yv-line-sum-row yv-line-sum-row--good">
          <span className="yv-line-sum-k">보약 기운 순풍 구간</span>
          <span>
            {goodWins.length
              ? fmtWins(goodWins)
              : "앞 대운엔 뚜렷한 순풍 구간이 도드라지진 않아 — 아래 해마다 흐름(세운)이랑 지금 가진 기운을 잘 쓰는 쪽으로 봐."}
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
      </div>
    </div>
  );
}
