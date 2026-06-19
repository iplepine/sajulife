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

/** 기질 축(코드)별 고유 색 — 바·레이더 점에서 같은 출처를 쓴다. */
export const DIM_COLOR: Record<string, string> = {
  NS: "#2f7d62", // 추진성
  HA: "#c79a3a", // 안정성
  RD: "#c2483c", // 공감성
  PS: "#9c6b3f", // 지속성
  SD: "#cf6a2e", // 주도성
  CO: "#5d7898", // 연결성
  ST: "#33507e", // 통찰성
  FLEX: "#6a4f9c", // 유연성
};

/** 한국어 차원 라벨 → 색. 리포트 본문(기질분석 ①~⑧ 해설)에서 차원명으로 색을 찾을 때 쓴다. */
export const DIM_COLOR_BY_LABEL: Record<string, string> = {
  추진성: DIM_COLOR.NS,
  안정성: DIM_COLOR.HA,
  공감성: DIM_COLOR.RD,
  지속성: DIM_COLOR.PS,
  주도성: DIM_COLOR.SD,
  연결성: DIM_COLOR.CO,
  통찰성: DIM_COLOR.ST,
  유연성: DIM_COLOR.FLEX,
};

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
            <circle
              cx={v.x}
              cy={v.y}
              r={4}
              className={`tcr-dot${deficit ? " def" : ""}`}
              style={deficit ? undefined : { fill: DIM_COLOR[a.key] ?? "var(--el-water)" }}
            />
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
