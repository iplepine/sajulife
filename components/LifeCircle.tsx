import type { SajuResult } from "@/lib/saju/calculator";
import {
  branchAngleDeg,
  branchPosition,
  dayunCompatScore,
  dayunDirection,
  lifelineNow,
  polylinePath,
  seasonOfBranch,
  stemMeta,
  SEASON_EMOJI,
  SEASON_SUBTITLE,
  SEASON_TRAITS,
  SEASON_VARS,
  WUXING_VAR,
  type Season,
} from "@/lib/saju/seasonClock";

/**
 * 사주의 계절 시계 — 봄·여름·가을·겨울 사방위로 일간·원국·대운을 그린다.
 * 한자를 노출하지 않고 한국어 메타포만 사용해 일반인에게 직관적으로 보이도록 했다.
 *
 * 좌표 회전 및 데이터 매핑은 lib/saju/seasonClock.ts, 점수 계산은 balance.ts가 담당.
 */

const VIEW = 480;
const C = VIEW / 2; // 240
const R_WEDGE = 149;
const R_CENTER = 74;
const R_LIFELINE = 111;     // 점선 0 기준선 — 내원(74)과 외원(149)의 기하학적 중간
const R_DELTA = 24;         // 친화도 ±2가 0 기준에서 안팎으로 벌어지는 폭
const R_NATAL = 95;         // 월지 natal 점 반지름 (lifeline 안쪽, 내원 약간 밖)
const R_TICK_IN = 149;
const R_TICK_OUT = 156;
const R_TICK_EDGE_OUT = 162;
const DEG_TO_RAD = Math.PI / 180;

type SeasonPos = {
  x: number; y: number;
  sub: { x: number; y: number };
  traits: { x: number; y: number };
};
const SEASONS_BY_QUADRANT: { season: Season; pos: SeasonPos }[] = [
  { season: "여름", pos: { x: C,   y: 56,  sub: { x: C,   y: 72  }, traits: { x: C,   y: 88  } } },
  { season: "봄",   pos: { x: 428, y: 236, sub: { x: 428, y: 252 }, traits: { x: 428, y: 268 } } },
  { season: "겨울", pos: { x: C,   y: 424, sub: { x: C,   y: 440 }, traits: { x: C,   y: 456 } } },
  { season: "가을", pos: { x: 52,  y: 236, sub: { x: 52,  y: 252 }, traits: { x: 52,  y: 268 } } },
];

type Props = {
  saju: SajuResult;
  birthYear: number;
  currentYear: number;
};

export default function LifeCircle({ saju, birthYear, currentYear }: Props) {
  const stem = stemMeta(saju.dayMaster.hanja);
  const monthSeason = seasonOfBranch(saju.pillars.month.zhi.hanja);
  const dmColor = WUXING_VAR[saju.dayMaster.wuxing] ?? WUXING_VAR.목;

  const dayuns = saju.daewoon ?? [];
  const direction = dayunDirection(dayuns);
  const currentAge = Math.max(0, currentYear - birthYear);

  // 원국은 월지가 가리키는 계절 자리 — 칩의 "타고난 결"과 시각적으로 일치
  const natalPos = branchPosition(saju.pillars.month.zhi.hanja, C, C, R_NATAL);

  // 9 대운 점 위치 — 친화도(±2)에 따라 0 기준선(R_LIFELINE)에서 안팎으로 벌어진다
  const dayunPositions = dayuns.map((d) => {
    const score = dayunCompatScore(saju.dayMaster.wuxing, d);
    const r = R_LIFELINE + (score / 2) * R_DELTA;
    const a = branchAngleDeg(d.zhi.hanja) * DEG_TO_RAD;
    return { x: C + r * Math.cos(a), y: C - r * Math.sin(a), score, r };
  });

  // lifelineNow는 진행 비율만 활용. 실제 "지금" 위치는 인접 대운 점 사이의 선형 보간.
  const lifelineState = direction
    ? lifelineNow(dayuns, currentAge, direction, C, C, R_LIFELINE)
    : null;
  const nowPos = (() => {
    if (!lifelineState || dayunPositions.length === 0) return null;
    const cur = dayunPositions[lifelineState.activeIdx];
    const next = dayunPositions[lifelineState.activeIdx + 1] ?? cur;
    const frac = lifelineState.ageFrac;
    return { x: cur.x + (next.x - cur.x) * frac, y: cur.y + (next.y - cur.y) * frac };
  })();
  const currentBranch = lifelineState ? dayuns[lifelineState.activeIdx].zhi.hanja : null;
  const currentSeasonLabel = currentBranch ? seasonOfBranch(currentBranch) : null;

  const arcPath = dayunPositions.length > 1 ? polylinePath(dayunPositions) : null;

  // 9 대운 친화도 분포 → 인생 형상 한 줄
  const shapeNarrative = (() => {
    if (dayunPositions.length === 0) return null;
    const scores = dayunPositions.map((p) => p.score);
    const above = scores.filter((s) => s > 0.25).length;
    const below = scores.filter((s) => s < -0.25).length;
    if (above >= below + 3) return "도움받는 시기가 풍부한 결이에요.";
    if (below >= above + 3) return "책임지는 시기가 많은 결 — 결이 단단히 다져지는 흐름이에요.";
    return "도움받는 시기와 책임지는 시기가 골고루 섞인 결이에요.";
  })();

  return (
    <div className="sc-wrap">
      <div className="sc-chips">
        <span className="sc-chip">
          <span className="sc-dot" style={{ background: SEASON_VARS[monthSeason.season].deep }} />
          타고난 결 · <b>{monthSeason.phrase}</b>
        </span>
        {currentSeasonLabel && (
          <span className="sc-chip">
            <span className="sc-dot" style={{ background: SEASON_VARS[currentSeasonLabel.season].deep }} />
            지금 흐름 · <b>{currentSeasonLabel.phrase}</b>
          </span>
        )}
      </div>

      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="sc-svg" role="img" aria-label="사주의 계절 시계">
        {/* 4 season wedges — top=여름, right=봄, bottom=겨울, left=가을 */}
        <Wedge season="여름" path={`M ${C} ${C} L 134.7 134.7 A ${R_WEDGE} ${R_WEDGE} 0 0 1 345.3 134.7 Z`} />
        <Wedge season="봄"   path={`M ${C} ${C} L 345.3 134.7 A ${R_WEDGE} ${R_WEDGE} 0 0 1 345.3 345.3 Z`} />
        <Wedge season="겨울" path={`M ${C} ${C} L 345.3 345.3 A ${R_WEDGE} ${R_WEDGE} 0 0 1 134.7 345.3 Z`} />
        <Wedge season="가을" path={`M ${C} ${C} L 134.7 345.3 A ${R_WEDGE} ${R_WEDGE} 0 0 1 134.7 134.7 Z`} />

        {/* center white cutout */}
        <circle cx={C} cy={C} r={R_CENTER} className="sc-center-bg" />

        {/* rings */}
        <circle cx={C} cy={C} r={R_WEDGE} className="sc-ring" />
        <circle cx={C} cy={C} r={R_CENTER} className="sc-ring" />
        <circle cx={C} cy={C} r={R_LIFELINE} className="sc-ring sc-ring-dashed" />

        {/* axis cross */}
        <line x1={C - R_WEDGE} y1={C} x2={C + R_WEDGE} y2={C} className="sc-ring sc-ring-dashed" />
        <line x1={C} y1={C - R_WEDGE} x2={C} y2={C + R_WEDGE} className="sc-ring sc-ring-dashed" />

        {/* 12 ticks at branch positions; thicker at season boundaries */}
        <Ticks />

        {/* 4 cardinal season labels */}
        {SEASONS_BY_QUADRANT.map(({ season, pos }) => (
          <g key={season}>
            <text className={`sc-season-name s-${seasonClassName(season)}`} x={pos.x} y={pos.y} textAnchor="middle">
              {SEASON_EMOJI[season]} {season}
            </text>
            <text className="sc-season-sub" x={pos.sub.x} y={pos.sub.y} textAnchor="middle">
              {SEASON_SUBTITLE[season]}
            </text>
            <text className="sc-season-traits" x={pos.traits.x} y={pos.traits.y} textAnchor="middle">
              {SEASON_TRAITS[season].join(" · ")}
            </text>
          </g>
        ))}

        {/* center — day master(일간) = 나. emoji + Korean metaphor */}
        <text x={C} y={C - 44} className="sc-center-label" textAnchor="middle" dominantBaseline="central">
          일간
        </text>
        <text x={C} y={C - 18} className="sc-center-emoji" textAnchor="middle" dominantBaseline="central">
          {stem.emoji}
        </text>
        <text x={C} y={C + 22} className="sc-center-name" textAnchor="middle">
          {stem.short} 같은 사람
        </text>
        <text x={C} y={C + 38} className="sc-center-meta" textAnchor="middle">
          {stem.metaphor}
        </text>

        {/* 대운 곡선 — 친화도 ±2에 따라 0 기준선 위아래로 출렁이는 흐름 */}
        {arcPath && <path d={arcPath} className="sc-dayun-curve" />}

        {/* 9 dayun dots */}
        {dayunPositions.map((p, i) => {
          const isPast = lifelineState ? i < lifelineState.activeIdx : false;
          const isActive = lifelineState ? i === lifelineState.activeIdx : false;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={5}
              className={`sc-dayun-dot ${isPast || isActive ? "past" : "future"}`}
            />
          );
        })}

        {/* 첫·마지막 대운 옆 나이 라벨 */}
        {dayuns.length > 0 && (
          <BranchAgeLabel
            text={`${dayuns[0].startAge}세`}
            anchor={dayunPositions[0]}
            radial={-1}
          />
        )}
        {dayuns.length > 1 && (
          <BranchAgeLabel
            text={`${dayuns[dayuns.length - 1].startAge}세`}
            anchor={dayunPositions[dayunPositions.length - 1]}
            radial={-1}
          />
        )}

        {/* "지금 N세" 마커 — 인접 대운 점 사이를 보간한 위치 */}
        {nowPos && (
          <>
            <circle cx={nowPos.x} cy={nowPos.y} r={14} className="sc-now-ring" />
            <circle cx={nowPos.x} cy={nowPos.y} r={6.5} className="sc-now-dot" />
            <NowLabel pos={nowPos} age={currentAge} />
          </>
        )}

        {/* 원국 — 타고난 자리 */}
        <circle cx={natalPos.x} cy={natalPos.y} r={18} className="sc-natal-halo" style={{ fill: dmColor }} />
        <circle cx={natalPos.x} cy={natalPos.y} r={9} className="sc-natal-dot" style={{ fill: dmColor }} />
        <NatalLabel pos={natalPos} color={dmColor} />
      </svg>

      <div className="sc-legend">
        <span>
          <svg className="sc-legend-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill={dmColor} opacity="0.15" />
            <circle cx="12" cy="12" r="6" fill={dmColor} stroke="white" strokeWidth="2" />
          </svg>
          타고난 결
        </span>
        <span>
          <svg className="sc-legend-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <circle cx="12" cy="12" r="5" fill="currentColor" stroke="white" strokeWidth="2" />
          </svg>
          지금 흐름
        </span>
        <span>
          <svg className="sc-legend-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="5" fill="var(--text-sub)" />
          </svg>
          지나온 대운
        </span>
        <span>
          <svg className="sc-legend-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="5" fill="white" stroke="var(--text-sub)" strokeWidth="1.5" />
          </svg>
          다가올 대운
        </span>
      </div>

      <div className="sc-yaxis-note">
        <p>
          <span className="yn-icon">ⓘ</span> 위·아래는 좋고 나쁨이 아니에요.
        </p>
        <p>
          <b>위는 도움받는 시기</b> — 부모·스승·후원자가 받쳐주는 때.{" "}
          <b>아래는 책임지는 시기</b> — 내가 일·역할을 직접 짊어지는 때.
        </p>
        <p className="yn-foot">
          사람마다 분포가 달라요. 도움받는 시기가 많은 인생도, 책임지는 시기가 많은 인생도, 골고루 섞인 인생도 다 자연스러운 결입니다.
        </p>
      </div>

      <p className="sc-read">
        당신은 <b style={{ color: SEASON_VARS[monthSeason.season].deep }}>{monthSeason.phrase}</b>에 뿌리내린{" "}
        <em>
          {stem.emoji} {stem.short}
        </em>
        예요.
        {currentSeasonLabel && (
          <>
            <br />
            지금은 인생의 흐름이{" "}
            <b style={{ color: SEASON_VARS[currentSeasonLabel.season].deep }}>{currentSeasonLabel.phrase}</b>을 지나는
            중이에요.
          </>
        )}
        {shapeNarrative && (
          <>
            <br />
            {shapeNarrative}
          </>
        )}
      </p>
    </div>
  );
}

function seasonClassName(season: Season): string {
  return { 봄: "spring", 여름: "summer", 가을: "autumn", 겨울: "winter" }[season];
}

function Wedge({ season, path }: { season: Season; path: string }) {
  return <path d={path} className={`sc-wedge s-${seasonClassName(season)}`} />;
}

/** 12 지지 위치에 짧은 틱, 사방 4지점은 좀 더 굵게. */
function Ticks() {
  const ticks: { x1: number; y1: number; x2: number; y2: number; edge: boolean }[] = [];
  for (let i = 0; i < 12; i++) {
    const aRad = ((90 + i * 30) * Math.PI) / 180;
    const cosA = Math.cos(aRad);
    const sinA = Math.sin(aRad);
    // 사방위(여름=i0, 봄=i9, 겨울=i6, 가을=i3)는 강조하지 않고,
    // 계절 경계(i = 1.5, 4.5, 7.5, 10.5)에 별도 처리.
    ticks.push({
      x1: C + R_TICK_IN * cosA,
      y1: C - R_TICK_IN * sinA,
      x2: C + R_TICK_OUT * cosA,
      y2: C - R_TICK_OUT * sinA,
      edge: false,
    });
  }
  // 4 season-edge ticks: at quadrant corners (between i=1·2, i=4·5, i=7·8, i=10·11)
  for (const bound of [1.5, 4.5, 7.5, 10.5]) {
    const aRad = ((90 + bound * 30) * Math.PI) / 180;
    const cosA = Math.cos(aRad);
    const sinA = Math.sin(aRad);
    ticks.push({
      x1: C + R_TICK_IN * cosA,
      y1: C - R_TICK_IN * sinA,
      x2: C + R_TICK_EDGE_OUT * cosA,
      y2: C - R_TICK_EDGE_OUT * sinA,
      edge: true,
    });
  }
  return (
    <>
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.edge ? "sc-tick-edge" : "sc-tick"} />
      ))}
    </>
  );
}

/** 라이프라인 양 끝(시작/노년)에 점 안쪽으로 라벨을 붙인다. */
function BranchAgeLabel({
  text,
  anchor,
  radial,
}: {
  text: string;
  anchor: { x: number; y: number };
  /** 1이면 바깥쪽, -1이면 중심쪽. */
  radial: 1 | -1;
}) {
  const dx = anchor.x - C;
  const dy = anchor.y - C;
  const len = Math.hypot(dx, dy) || 1;
  const offset = 18 * radial;
  const x = anchor.x + (dx / len) * offset;
  const y = anchor.y + (dy / len) * offset;
  return (
    <text x={x} y={y} className="sc-age-label" textAnchor="middle" dominantBaseline="central">
      {text}
    </text>
  );
}

/** "지금 N세" — 현재 점의 바깥쪽으로 라벨. 위치는 사분면에 따라 좌/우 정렬. */
function NowLabel({ pos, age }: { pos: { x: number; y: number }; age: number }) {
  const dx = pos.x - C;
  const dy = pos.y - C;
  const len = Math.hypot(dx, dy) || 1;
  const off = 22;
  const lx = pos.x + (dx / len) * off;
  const ly = pos.y + (dy / len) * off;
  const anchor: "start" | "end" | "middle" = Math.abs(dx) < 12 ? "middle" : dx > 0 ? "start" : "end";
  return (
    <text x={lx} y={ly} className="sc-now-label" textAnchor={anchor} dominantBaseline="central">
      지금 {age}세
    </text>
  );
}

/** "타고난 결" — 사주의 월지(본바탕)가 위치한 자리에서 중심 반대 방향으로 라벨. */
function NatalLabel({ pos, color }: { pos: { x: number; y: number }; color: string }) {
  const dx = pos.x - C;
  const dy = pos.y - C;
  const len = Math.hypot(dx, dy) || 1;
  const off = 24;
  const lx = pos.x + (dx / len) * off;
  const ly = pos.y + (dy / len) * off;
  const anchor: "start" | "end" | "middle" = Math.abs(dx) < 12 ? "middle" : dx > 0 ? "start" : "end";
  return (
    <text x={lx} y={ly} className="sc-natal-label" style={{ fill: color }} textAnchor={anchor} dominantBaseline="central">
      타고난 결
    </text>
  );
}
