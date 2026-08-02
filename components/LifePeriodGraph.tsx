import type { SajuResult } from "@/lib/saju/calculator";
import {
  SEASON_VARS,
  dayunCompatScore,
  dayunDirection,
  lifelineNow,
  seasonOfBranch,
  type Season,
} from "@/lib/saju/seasonClock";

/**
 * 인생 시기 그림 — 대운을 시간 순서로 읽는다.
 * 점의 높이는 길흉 점수가 아니라 해당 시기에 힘이 오는 방향을 표현한다.
 *
 * ★x축 라벨은 간지가 아니라 계절 이름★ — `경진`·`기묘`는 일반인에게 아무 뜻이 없다.
 * 같은 값이 `막 깨어나는 초봄`처럼 코드로(BRANCH_META) 사람 말로 나오는데 안 쓸 이유가 없다.
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
  const height = 244;
  const left = 36;
  const right = 22;
  const top = 32;
  const bottom = 80;
  const innerWidth = width - left - right;
  const baseline = 112;
  const points = dayuns.map((dayun, index) => {
    const x = left + (innerWidth * index) / Math.max(1, dayuns.length - 1);
    const score = dayunCompatScore(saju.dayMaster.wuxing, dayun);
    const label = seasonOfBranch(dayun.zhi.hanja);
    return {
      dayun,
      index,
      score,
      x,
      y: baseline - score * 20,
      season: label.season,
      phrase: label.phrase,
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
            <text x={point.x} y={height - 52} textAnchor="middle" className="lpg-age">{point.dayun.startAge}세</text>
            {splitPhrase(point.phrase).map((line, lineIndex) => (
              <text
                key={line + lineIndex}
                x={point.x}
                y={height - 34 + lineIndex * 15}
                textAnchor="middle"
                className={`lpg-label${point.index === active ? " is-current" : ""}`}
              >
                {line}
              </text>
            ))}
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

/** "찬바람 부는 초겨울" → ["찬바람 부는", "초겨울"]. 9칸에 한 줄로 넣으면 서로 겹친다. */
function splitPhrase(phrase: string): string[] {
  const at = phrase.lastIndexOf(" ");
  return at < 0 ? [phrase] : [phrase.slice(0, at), phrase.slice(at + 1)];
}

/**
 * 타고난 결 / 지금 흐름 칩 — 원래 계절 시계 위에 있던 두 줄.
 * 시계를 걷어내도 이 대비(본바탕 ↔ 지금)는 남아야 해서 그래프 쪽으로 옮겼다.
 */
export function SeasonChips({ saju, currentAge }: { saju: SajuResult; currentAge: number }) {
  const monthSeason = seasonOfBranch(saju.pillars.month.zhi.hanja);
  const dayuns = saju.daewoon ?? [];
  const current = dayuns.filter((d) => d.startAge <= currentAge).sort((a, b) => b.startAge - a.startAge)[0];
  const now = current ? seasonOfBranch(current.zhi.hanja) : null;

  return (
    <div className="sc-chips">
      <span className="sc-chip">
        <span className="sc-dot" style={{ background: SEASON_VARS[monthSeason.season].deep }} />
        타고난 결 · <b>{monthSeason.phrase}</b>
      </span>
      {now && (
        <span className="sc-chip">
          <span className="sc-dot" style={{ background: SEASON_VARS[now.season].deep }} />
          지금 흐름 · <b>{now.phrase}</b>
        </span>
      )}
    </div>
  );
}

function seasonClassName(season: Season) {
  return { 봄: "spring", 여름: "summer", 가을: "autumn", 겨울: "winter" }[season];
}
