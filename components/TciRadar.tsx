/**
 * 8축 기질 레이더 — 팔각형 위에 각 축 점수를 폴리곤으로 그린다.
 *
 * - 중앙에 가까울수록 낮음, 바깥으로 갈수록 높음(돌출 = 그 기질 강조).
 * - 50% '균형 고리'를 기준선으로 깔아, 안쪽=움푹 / 바깥=돌출이 한눈에 보이게.
 * - deficitKeys(오행 부족과 연결된 축)는 라벨·점을 다른 색으로 '움푹' 표시(융합 리포트용).
 *
 * 축 데이터는 호출부가 7개(기질 차원) + 유연성 1개 순서로 넘긴다. 유연성 값이
 * 없으면(옛 리포트) 7축으로 그려도 자연스럽게 동작한다.
 */
export type RadarAxis = { key: string; label: string; percent: number };

const C = 160;
const R = 104;

function angleRad(i: number, n: number): number {
  return (-90 + (360 / n) * i) * (Math.PI / 180);
}

function point(i: number, n: number, radius: number): { x: number; y: number } {
  const a = angleRad(i, n);
  return { x: C + radius * Math.cos(a), y: C + radius * Math.sin(a) };
}

export default function TciRadar({
  axes,
  deficitKeys = [],
}: {
  axes: RadarAxis[];
  deficitKeys?: string[];
}) {
  const n = axes.length;
  if (n < 3) return null;

  const ring = (pct: number) => (R * pct) / 100;
  const polyAt = (radius: (i: number) => number) =>
    axes.map((_, i) => { const p = point(i, n, radius(i)); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");

  const valuePoly = polyAt((i) => ring(axes[i].percent));
  const gridPoly = (pct: number) => polyAt(() => ring(pct));

  return (
    <svg viewBox="0 0 320 320" className="tci-radar" role="img" aria-label="8축 기질 레이더">
      {[25, 50, 75, 100].map((g) => (
        <polygon key={g} points={gridPoly(g)} className={`tcr-grid${g === 50 ? " bal" : ""}`} />
      ))}

      {axes.map((a, i) => {
        const o = point(i, n, R);
        return <line key={`sp-${a.key}`} x1={C} y1={C} x2={o.x} y2={o.y} className="tcr-spoke" />;
      })}

      <polygon points={valuePoly} className="tcr-area" />

      {axes.map((a, i) => {
        const v = point(i, n, ring(a.percent));
        const lab = point(i, n, R + 22);
        const deficit = deficitKeys.includes(a.key);
        const anchor = Math.abs(lab.x - C) < 10 ? "middle" : lab.x > C ? "start" : "end";
        return (
          <g key={`ax-${a.key}`}>
            <circle cx={v.x} cy={v.y} r={3.6} className={`tcr-dot${deficit ? " def" : ""}`} />
            <text x={lab.x} y={lab.y - 5} textAnchor={anchor} dominantBaseline="middle" className={`tcr-label${deficit ? " def" : ""}`}>
              {a.label}
            </text>
            <text x={lab.x} y={lab.y + 9} textAnchor={anchor} dominantBaseline="middle" className="tcr-pct">
              {a.percent}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
