import type { SajuResult } from "@/lib/saju/calculator";
import {
  dayunCompatScore,
  dayunDirection,
  lifelineNow,
  seasonOfBranch,
  type Season,
} from "@/lib/saju/seasonClock";

/**
 * 인생 시기 그림의 두 번째 읽기 방식.
 * 원형 시계가 계절의 관계를 보여준다면, 이 그래프는 대운의 시간 순서를 읽게 한다.
 * 점의 높이는 길흉 점수가 아니라 해당 시기에 힘이 오는 방향을 표현한다.
 */
export default function LifePeriodGraph({
  saju,
  birthYear,
  currentYear,
}: {
  saju: SajuResult;
  birthYear: number;
  currentYear: number;
}) {
  const dayuns = saju.daewoon ?? [];
  const currentAge = Math.max(0, currentYear - birthYear);
  const direction = dayunDirection(dayuns);
  const active = direction ? lifelineNow(dayuns, currentAge, direction, 0, 0, 1)?.activeIdx ?? -1 : -1;

  if (dayuns.length === 0) {
    return <p className="life-period-graph-empty">대운 정보가 준비되면 시간 흐름 그래프를 볼 수 있어요.</p>;
  }

  const width = 560;
  const height = 220;
  const left = 36;
  const right = 22;
  const top = 32;
  const bottom = 56;
  const innerWidth = width - left - right;
  const baseline = 112;
  const points = dayuns.map((dayun, index) => {
    const x = left + (innerWidth * index) / Math.max(1, dayuns.length - 1);
    const score = dayunCompatScore(saju.dayMaster.wuxing, dayun);
    return {
      dayun,
      index,
      score,
      x,
      y: baseline - score * 20,
      season: seasonOfBranch(dayun.zhi.hanja).season,
    };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");

  return (
    <div className="life-period-graph">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="대운의 계절 변화와 인생 시기 흐름 그래프">
        <line x1={left} y1={top} x2={left} y2={height - bottom} className="lpg-axis" />
        <line x1={left} y1={baseline} x2={width - right} y2={baseline} className="lpg-baseline" />
        <text x={left - 8} y={top + 3} textAnchor="end" className="lpg-axis-label">주변의 힘</text>
        <text x={left - 8} y={height - bottom + 4} textAnchor="end" className="lpg-axis-label">내가 잡는 힘</text>

        {points.map((point, index) => {
          const next = points[index + 1];
          const x1 = index === 0 ? left : (points[index - 1].x + point.x) / 2;
          const x2 = next ? (point.x + next.x) / 2 : width - right;
          return (
            <rect
              key={`${point.dayun.startAge}-${point.dayun.zhi.hanja}`}
              x={x1}
              y={top}
              width={Math.max(0, x2 - x1)}
              height={height - top - bottom}
              className={`lpg-season lpg-season--${seasonClassName(point.season)}`}
            />
          );
        })}

        <path d={path} className="lpg-path" />
        {points.map((point) => (
          <g key={`${point.dayun.gan.hanja}-${point.dayun.zhi.hanja}-${point.index}`}>
            <line x1={point.x} y1={top} x2={point.x} y2={height - bottom} className="lpg-guide" />
            <circle cx={point.x} cy={point.y} r={point.index === active ? 6.5 : 4.5} className={`lpg-dot${point.index === active ? " is-current" : ""}`} />
            <text x={point.x} y={height - 30} textAnchor="middle" className="lpg-age">{point.dayun.startAge}세</text>
            <text x={point.x} y={height - 14} textAnchor="middle" className="lpg-label">{point.dayun.gan.ko}{point.dayun.zhi.ko}</text>
          </g>
        ))}
      </svg>
      <div className="life-period-graph-legend" aria-label="계절 범례">
        {(["봄", "여름", "가을", "겨울"] as const).map((season) => (
          <span key={season}><i className={`lpg-legend-dot lpg-season--${seasonClassName(season)}`} />{season}</span>
        ))}
      </div>
      <p>색 띠는 각 대운의 계절감을, 선은 시기마다 힘이 오는 방향을 보여줘요.</p>
    </div>
  );
}

function seasonClassName(season: Season) {
  return { 봄: "spring", 여름: "summer", 가을: "autumn", 겨울: "winter" }[season];
}
