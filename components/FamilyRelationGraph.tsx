import type { FamilyCircleMember } from "@/lib/saju/familyCircle";
import {
  isWuxingKo,
  relateWuxing,
  weakestElement,
  WUXING_META,
  type WuxingKo,
} from "@/lib/saju/wuxingGraph";

/**
 * 가족 관계·기운 그래프 — 지금 우리 가족을 한 장에 함축한다(일생 풀이 아님).
 *
 * 노드 = 구성원(일간 오행, 색으로 결을 신호). 본인(나)은 아래에 두고 먹색 테로 강조.
 * 화살표 = 누가 누구에게 기운을 나눠주나(생). 같은 결은 공명(비화), 다른 결은 조율(극).
 * 가운데 점선 = 가족 전체에서 비어 있는 기운.
 * 계산은 lib/saju/wuxingGraph.ts와 공유.
 */

const VB = 360;
const CX = 180;
const CY = 178;
const R_RING = 112;
const R_NODE = 33;
const R_GHOST = 25;
const R_SELF_RING = 38;
const DEG = Math.PI / 180;

type Props = { members: FamilyCircleMember[] };

type Node = {
  id: string;
  name: string;
  relation: string;
  wx: WuxingKo;
  el: string;
  nature: string;
  isSelf: boolean;
  x: number;
  y: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/** a에서 b로 가는 선분을 양끝 노드 가장자리에 맞춰 자른다(받는 쪽은 화살표 자리만큼 더 띄움). */
function trim(a: Node, b: Node, padB = 3) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  return {
    sx: r2(a.x + ux * (R_NODE + 2)),
    sy: r2(a.y + uy * (R_NODE + 2)),
    ex: r2(b.x - ux * (R_NODE + padB)),
    ey: r2(b.y - uy * (R_NODE + padB)),
  };
}

export default function FamilyRelationGraph({ members }: Props) {
  // 일간 오행이 유효한 멤버만. 본인(self)이 맨 앞이라 아래(6시)에 놓인다.
  const nodes: Node[] = members
    .filter((m) => isWuxingKo(m.saju.dayMaster.wuxing))
    .map((m, i, arr) => {
      const wx = m.saju.dayMaster.wuxing as WuxingKo;
      const meta = WUXING_META[wx];
      const ang = (90 + (i * 360) / arr.length) * DEG;
      return {
        id: m.id,
        name: m.name,
        relation: m.relation,
        wx,
        el: meta.el,
        nature: meta.nature,
        isSelf: m.id === "self",
        x: r2(CX + R_RING * Math.cos(ang)),
        y: r2(CY + R_RING * Math.sin(ang)),
      };
    });

  if (nodes.length < 2) return null;

  // 모든 쌍의 관계(생·극·비화).
  type Edge = { a: Node; b: Node; rel: ReturnType<typeof relateWuxing>; key: string };
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const rel = relateWuxing(nodes[i].wx, nodes[j].wx);
      edges.push({ a: nodes[i], b: nodes[j], rel, key: `${nodes[i].id}-${nodes[j].id}` });
    }
  }

  const weak = weakestElement(members.map((m) => m.saju.wuxingCount));
  const showGhost = weak.low || weak.absent;
  const ghostMeta = WUXING_META[weak.element];

  return (
    <div className="frg-wrap">
      <svg viewBox={`0 0 ${VB} ${VB}`} className="frg-svg" role="img" aria-label="우리 가족 관계·기운 그래프">
        <defs>
          <marker id="frg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" className="frg-arrow-head" />
          </marker>
        </defs>

        {/* 엣지 — 먼저 깔아서 노드·빈자리 점선이 위에 오게 한다 */}
        {edges.map(({ a, b, rel, key }) => {
          if (rel.kind === "생") {
            const giver = rel.from === 0 ? a : b;
            const taker = rel.from === 0 ? b : a;
            const t = trim(giver, taker);
            return <line key={key} className="frg-gen" x1={t.sx} y1={t.sy} x2={t.ex} y2={t.ey} markerEnd="url(#frg-arrow)" />;
          }
          const t = trim(a, b, 2);
          return (
            <line
              key={key}
              className={rel.kind === "비화" ? "frg-reso" : "frg-ctrl"}
              x1={t.sx}
              y1={t.sy}
              x2={t.ex}
              y2={t.ey}
            />
          );
        })}

        {/* 빈자리 — 가족 전체에서 가장 약한 기운 */}
        {showGhost && (
          <g>
            <circle cx={CX} cy={CY} r={R_GHOST} className="frg-ghost-ring" style={{ stroke: `var(--el-${ghostMeta.el})` }} />
            <text x={CX} y={CY - 3} textAnchor="middle" className="frg-ghost-label" style={{ fill: `var(--el-${ghostMeta.el})` }}>
              {ghostMeta.nature}
            </text>
            <text x={CX} y={CY + 11} textAnchor="middle" className="frg-ghost-sub">
              {weak.absent ? "비어 있음" : "약한 결"}
            </text>
          </g>
        )}

        {/* 노드 */}
        {nodes.map((n) => (
          <g key={n.id}>
            {n.isSelf && <circle cx={n.x} cy={n.y} r={R_SELF_RING} className="frg-node-self-ring" />}
            <circle
              cx={n.x}
              cy={n.y}
              r={R_NODE}
              className="frg-node-bg"
              style={{ fill: `var(--el-${n.el}-bg)`, stroke: `var(--el-${n.el})` }}
            />
            <text x={n.x} y={n.y - 2} textAnchor="middle" className="frg-node-name">
              {n.name}
            </text>
            <text x={n.x} y={n.y + 12} textAnchor="middle" className="frg-node-sub" style={{ fill: `var(--el-${n.el})` }}>
              {n.isSelf ? `나 · ${n.nature}` : n.nature}
            </text>
          </g>
        ))}
      </svg>

      {/* 구성원 색 범례 */}
      <div className="fc-legend">
        {nodes.map((n) => (
          <span key={`leg-${n.id}`}>
            <span className="fc-swatch" style={{ background: `var(--el-${n.el})` }} />
            <b>{n.name}</b>
            <span className="muted">· {n.relation} · {n.nature}</span>
          </span>
        ))}
      </div>

      {/* 기호 설명 */}
      <p className="fc-caption">
        <span className="frg-mk gen" /> 기운을 나눠줘 &nbsp;·&nbsp;
        <span className="frg-mk reso" /> 같은 결·공명 &nbsp;·&nbsp;
        <span className="frg-mk ctrl" /> 결이 달라 조율
        {showGhost && (
          <>
            &nbsp;·&nbsp;<span className="frg-mk ghost" /> 비어 있는 기운
          </>
        )}
      </p>
    </div>
  );
}
