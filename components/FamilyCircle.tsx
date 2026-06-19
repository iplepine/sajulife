import type { SajuResult } from "@/lib/saju/calculator";
import {
  branchAngleDeg,
  branchMeta,
  branchPosition,
  dayunCompatScore,
  dayunDirection,
  lifelineNow,
  polylinePath,
  seasonOfBranch,
  SEASON_EMOJI,
  SEASON_SUBTITLE,
  SEASON_TRAITS,
  type Season,
} from "@/lib/saju/seasonClock";

/**
 * 가족 인생 흐름 — 여러 구성원의 LifeCircle을 한 계절 시계에 색으로 겹쳐 그린다.
 *
 * 구성원마다 색이 다른 ① 인생 흐름선(9 대운), ② 타고난 결(원국), ③ 지금 위치를 표시.
 * 색은 가족 페이지의 이름 옆 점(el-dot)과 같은 순서를 써서 한눈에 매칭된다.
 * 지오메트리·점수 계산은 LifeCircle.tsx와 동일하게 seasonClock.ts를 공유.
 */

const VIEW = 480;
const C = VIEW / 2; // 240
const R_WEDGE = 149;
const R_CENTER = 74;
const R_LIFELINE = 111;
const R_DELTA = 24;
const R_NATAL = 95;
const R_NATAL_STEP = 15; // 같은 자리에 겹친 구성원을 반지름 방향으로 벌리는 폭
const R_TICK_IN = 149;
const R_TICK_OUT = 156;
const R_TICK_EDGE_OUT = 162;
const DEG_TO_RAD = Math.PI / 180;

export type FamilyCircleMember = {
  id: string;
  name: string;
  relation: string;
  color: string; // CSS 변수 문자열 — 예: "var(--el-fire)"
  saju: SajuResult;
  birthYear: number;
};

type Props = {
  members: FamilyCircleMember[];
  currentYear: number;
};

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

export default function FamilyCircle({ members, currentYear }: Props) {
  // 같은 월지(타고난 자리)에 여러 명이 겹치면 반지름 방향으로 분산시킨다.
  const groupTotals = new Map<number, number>();
  for (const m of members) {
    const ci = branchMeta(m.saju.pillars.month.zhi.hanja).clockIndex;
    groupTotals.set(ci, (groupTotals.get(ci) ?? 0) + 1);
  }
  const groupSeen = new Map<number, number>();

  const rendered = members.map((m) => {
    const { saju, birthYear } = m;
    const dayuns = saju.daewoon ?? [];
    const direction = dayunDirection(dayuns);
    const currentAge = Math.max(0, currentYear - birthYear);

    // 9 대운 점 — 친화도(±2)에 따라 0 기준선에서 안팎으로 벌어진 인생 흐름선
    const dayunPositions = dayuns.map((d) => {
      const score = dayunCompatScore(saju.dayMaster.wuxing, d);
      const r = R_LIFELINE + (score / 2) * R_DELTA;
      const a = branchAngleDeg(d.zhi.hanja) * DEG_TO_RAD;
      return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) };
    });
    const arcPath = dayunPositions.length > 1 ? polylinePath(dayunPositions) : null;

    // 지금 위치 — 인접 대운 점 사이 선형 보간
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

    // 타고난 결(원국) — 월지가 가리키는 계절 자리, 겹치면 반지름으로 분산
    const ci = branchMeta(saju.pillars.month.zhi.hanja).clockIndex;
    const total = groupTotals.get(ci) ?? 1;
    const k = groupSeen.get(ci) ?? 0;
    groupSeen.set(ci, k + 1);
    const rNatal = R_NATAL + (k - (total - 1) / 2) * R_NATAL_STEP;
    const natalPos = branchPosition(saju.pillars.month.zhi.hanja, C, C, rNatal);

    return { ...m, arcPath, nowPos, natalPos, season: seasonOfBranch(saju.pillars.month.zhi.hanja) };
  });

  return (
    <div className="sc-wrap">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="sc-svg" role="img" aria-label="가족의 계절 시계">
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

        {/* 12 ticks */}
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

        {/* center — 가족 묶음 라벨 */}
        <text x={C} y={C - 8} className="fc-center-title" textAnchor="middle" dominantBaseline="central">
          우리 가족
        </text>
        <text x={C} y={C + 14} className="fc-center-sub" textAnchor="middle" dominantBaseline="central">
          {members.length}명
        </text>

        {/* 구성원별 인생 흐름선 — 색으로 구분 */}
        {rendered.map((m) =>
          m.arcPath ? (
            <path key={`line-${m.id}`} d={m.arcPath} className="fc-line" style={{ stroke: m.color }} />
          ) : null,
        )}

        {/* 구성원별 지금 위치 */}
        {rendered.map((m) =>
          m.nowPos ? (
            <circle
              key={`now-${m.id}`}
              cx={m.nowPos.x}
              cy={m.nowPos.y}
              r={5}
              className="fc-now-dot"
              style={{ fill: m.color }}
            />
          ) : null,
        )}

        {/* 구성원별 타고난 결(원국) */}
        {rendered.map((m) => (
          <g key={`natal-${m.id}`}>
            <circle cx={m.natalPos.x} cy={m.natalPos.y} r={16} className="fc-natal-halo" style={{ fill: m.color }} />
            <circle cx={m.natalPos.x} cy={m.natalPos.y} r={8} className="fc-natal-dot" style={{ fill: m.color }} />
          </g>
        ))}
      </svg>

      {/* 구성원 색 범례 */}
      <div className="fc-legend">
        {rendered.map((m) => (
          <span key={`leg-${m.id}`}>
            <span className="fc-swatch" style={{ background: m.color }} />
            <b>{m.name}</b>
            <span className="muted">· {m.relation} · {m.season.phrase}</span>
          </span>
        ))}
      </div>

      {/* 기호 설명 */}
      <p className="fc-caption">
        <span className="fc-mk natal" /> 타고난 결 &nbsp;·&nbsp;
        <span className="fc-mk now" /> 지금 흐름 &nbsp;·&nbsp;
        <span className="fc-mk line" /> 10년 단위 인생 흐름
      </p>

      <div className="sc-yaxis-note">
        <p>
          <span className="yn-icon">ⓘ</span> 위·아래는 좋고 나쁨이 아니야.
        </p>
        <p>
          <b>위는 도움받는 시기</b> — 부모·스승·후원자가 받쳐주는 때.{" "}
          <b>아래는 책임지는 시기</b> — 내가 일·역할을 직접 짊어지는 때.
        </p>
      </div>
    </div>
  );
}

function seasonClassName(season: Season): string {
  return { 봄: "spring", 여름: "summer", 가을: "autumn", 겨울: "winter" }[season];
}

function Wedge({ season, path }: { season: Season; path: string }) {
  return <path d={path} className={`sc-wedge s-${seasonClassName(season)}`} />;
}

/** 12 지지 위치에 짧은 틱, 계절 경계 4지점은 좀 더 굵게. */
function Ticks() {
  const ticks: { x1: number; y1: number; x2: number; y2: number; edge: boolean }[] = [];
  for (let i = 0; i < 12; i++) {
    const aRad = ((90 + i * 30) * Math.PI) / 180;
    const cosA = Math.cos(aRad);
    const sinA = Math.sin(aRad);
    ticks.push({
      x1: C + R_TICK_IN * cosA,
      y1: C - R_TICK_IN * sinA,
      x2: C + R_TICK_OUT * cosA,
      y2: C - R_TICK_OUT * sinA,
      edge: false,
    });
  }
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
