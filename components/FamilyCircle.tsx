import type { FamilyCircleMember } from "@/lib/saju/familyCircle";

/**
 * 가족 오행 흐름 그래프.
 *
 * 긴 인생 그래프 대신, 가족 안에서 각자 부족한 오행을
 * 누가 어느 방향으로 전해주는지 한 장의 SVG로 보여준다.
 */

export type { FamilyCircleMember };

type Props = {
  members: FamilyCircleMember[];
  currentYear: number;
};

type Wuxing = keyof FamilyCircleMember["saju"]["wuxingCount"];

type MemberSummary = FamilyCircleMember & {
  age: number;
  weak: Wuxing[];
  strong: Wuxing[];
  needs: ElementNeed[];
  primaryNeed: ElementNeed;
  primaryWeak: Wuxing;
  primaryStrong: Wuxing;
};

type PositionedMember = MemberSummary & {
  x: number;
  y: number;
};

type FamilyCircleLayout = {
  viewW: number;
  viewH: number;
  cx: number;
  cy: number;
  nodeR: number;
  ribbonY: number;
  legendStartX: number;
};

type NeedRole = "비겁" | "식상" | "재성" | "관성" | "인성";

type ElementNeed = {
  element: Wuxing;
  role: NeedRole;
  score: number;
  count: number;
};

type SupportLink = {
  from: PositionedMember;
  to: PositionedMember;
  element: Wuxing;
  role: NeedRole;
  index: number;
  pairSlot: -1 | 0 | 1;
  score: number;
};

type LinkCandidate = Omit<SupportLink, "index" | "pairSlot">;

const BASE_VIEW_W = 920;
const BASE_VIEW_H = 600;
const BASE_NODE_R = 56;

const ELEMENTS: Wuxing[] = ["목", "화", "토", "금", "수"];

const ELEMENT_META: Record<Wuxing, { className: string; label: string; desc: string }> = {
  목: { className: "wood", label: "시작", desc: "성장" },
  화: { className: "fire", label: "표현", desc: "확장" },
  토: { className: "earth", label: "안정", desc: "균형" },
  금: { className: "metal", label: "정리", desc: "결정" },
  수: { className: "water", label: "회복", desc: "유연함" },
};

const GENERATES: Record<Wuxing, Wuxing> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<Wuxing, Wuxing> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

const ROLE_WEIGHT: Record<NeedRole, number> = {
  인성: 3,
  관성: 2.5,
  식상: 2,
  재성: 1.6,
  비겁: 1.2,
};

export default function FamilyCircle({ members, currentYear }: Props) {
  const summaries = members.map((m) => summarizeMember(m, currentYear));
  const layout = layoutForCount(summaries.length);
  const positioned = positionMembers(summaries, layout);
  const links = buildSupportLinks(positioned);
  const headline = buildHeadline(links);

  return (
    <div className="fc-picture" data-map="wuxing-support" data-member-count={summaries.length}>
      <svg viewBox={`0 0 ${layout.viewW} ${layout.viewH}`} className="fc-picture-svg" role="img" aria-label="우리 가족 오행 흐름 그래프">
        <defs>
          {ELEMENTS.map((el) => (
            <marker
              key={el}
              id={`fc-arrow-${ELEMENT_META[el].className}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 Z" className={`fc-arrow-head ${ELEMENT_META[el].className}`} />
            </marker>
          ))}
        </defs>
        <rect x="1" y="1" width={layout.viewW - 2} height={layout.viewH - 2} rx="24" className="fc-bg" />

        <g className="fc-summary">
          <text x="44" y="52" className="fc-summary-eyebrow">우리 가족 오행 흐름 지도</text>
          <text x="44" y="88" className="fc-summary-title">
            각자 필요한 기운과 지원 흐름
          </text>
          <text x="44" y="118" className="fc-summary-sub">
            {headline}
          </text>
        </g>

        <g className="fc-element-legend" aria-hidden="true">
          <text x={layout.legendStartX} y="42" className="fc-el-title">오행 뜻</text>
          {ELEMENTS.map((el, i) => (
            <g key={el} transform={`translate(${layout.legendStartX} ${62 + i * 20})`}>
              <circle cx="0" cy="-4" r="5.5" className={`fc-el-dot ${ELEMENT_META[el].className}`} />
              <text x="14" y="0" className="fc-el-label">
                {el} · {ELEMENT_META[el].label} · {ELEMENT_META[el].desc}
              </text>
            </g>
          ))}
        </g>

        <g className="fc-links">
          {links.map((link) => {
            const path = linkPath(link, layout);
            const elClass = ELEMENT_META[link.element].className;
            return (
              <path
                key={`path-${link.from.id}-${link.to.id}-${link.element}`}
                d={path}
                className={`fc-support-link ${elClass}`}
                data-from={link.from.id}
                data-to={link.to.id}
                aria-label={linkDescription(link)}
                markerEnd={`url(#fc-arrow-${elClass})`}
              >
                <title>{linkDescription(link)}</title>
              </path>
            );
          })}
        </g>

        {links.length === 0 && (
          <text x={layout.cx} y={layout.cy + 96} textAnchor="middle" className="fc-empty-note">
            지금은 특정한 한 사람보다, 가족 전체가 필요한 기운을 같이 채우면 좋아.
          </text>
        )}

        {positioned.map((m) => (
          <g key={`node-${m.id}`} className="fc-member-node">
            <circle cx={m.x} cy={m.y} r={layout.nodeR + 9} className={`fc-node-halo ${ELEMENT_META[dayElementOf(m)].className}`} />
            <circle cx={m.x} cy={m.y} r={layout.nodeR} className={`fc-node-disc ${ELEMENT_META[dayElementOf(m)].className}`} />
            <text x={m.x} y={m.y - 26} textAnchor="middle" className="fc-node-role">
              {m.relation} · {dayMasterLabel(m)}
            </text>
            <text x={m.x} y={m.y + 1} textAnchor="middle" className="fc-node-name">
              {short(m.name, 8)}
            </text>
            <text x={m.x} y={m.y + 27} textAnchor="middle" className="fc-node-flow">
              필요: {needLabel(m)}
            </text>
            <g transform={`translate(${m.x - chipWidth(strongLabel(m)) / 2} ${m.y + 44})`}>
              <rect width={chipWidth(strongLabel(m))} height="26" rx="13" className={`fc-node-chip ${ELEMENT_META[m.primaryStrong].className}`} />
              <text x={chipWidth(strongLabel(m)) / 2} y="18" textAnchor="middle" className="fc-node-chip-text">
                많음: {strongLabel(m)}
              </text>
            </g>
          </g>
        ))}

        <g className="fc-bottom-ribbon">
          <rect x="44" y={layout.ribbonY} width={layout.viewW - 88} height="46" rx="18" className="fc-ribbon-bg" />
          <text x="66" y={layout.ribbonY + 29} className="fc-ribbon-title">오늘 읽는 법</text>
          <text x="178" y={layout.ribbonY + 29} className="fc-ribbon-text">
            {short(ribbonText(links), 62)}
          </text>
        </g>
      </svg>
    </div>
  );
}

function summarizeMember(m: FamilyCircleMember, currentYear: number): MemberSummary {
  const age = Math.max(0, currentYear - m.birthYear);
  const entries = ELEMENTS.map((el) => ({ el, count: m.saju.wuxingCount[el] }));
  const min = Math.min(...entries.map((x) => x.count));
  const max = Math.max(...entries.map((x) => x.count));
  const total = entries.reduce((sum, x) => sum + x.count, 0);
  const avg = total / ELEMENTS.length;
  const weak = min === max ? [] : entries.filter((x) => x.count === min).map((x) => x.el);
  const strong = min === max ? [] : entries.filter((x) => x.count === max).map((x) => x.el);
  const needs = buildElementNeeds(m, entries, min, avg);
  const fallbackNeed = needs[0] ?? {
    element: weak[0] ?? entries.slice().sort((a, b) => a.count - b.count)[0].el,
    role: elementRole(dayElementOf(m), weak[0] ?? entries.slice().sort((a, b) => a.count - b.count)[0].el),
    score: 0,
    count: min,
  };
  return {
    ...m,
    age,
    weak,
    strong,
    needs,
    primaryNeed: fallbackNeed,
    primaryWeak: weak[0] ?? entries.sort((a, b) => a.count - b.count)[0].el,
    primaryStrong: strong[0] ?? entries.sort((a, b) => b.count - a.count)[0].el,
  };
}

function layoutForCount(count: number): FamilyCircleLayout {
  const viewW = count >= 6 ? 1040 : count >= 5 ? 980 : BASE_VIEW_W;
  const viewH = count >= 6 ? 860 : count >= 5 ? 790 : count === 4 ? 710 : BASE_VIEW_H;
  const cx = Math.round(viewW / 2);
  const cy = count >= 6 ? 430 : count >= 5 ? 420 : count === 4 ? 365 : 314;
  return {
    viewW,
    viewH,
    cx,
    cy,
    nodeR: BASE_NODE_R,
    ribbonY: viewH - 74,
    legendStartX: viewW - 230,
  };
}

function positionMembers(members: MemberSummary[], layout: FamilyCircleLayout): PositionedMember[] {
  const positions = memberPositions(members.length, layout);
  return members.map((m, i) => ({ ...m, ...positions[i] }));
}

function memberPositions(count: number, layout: FamilyCircleLayout): Array<{ x: number; y: number }> {
  const { cx, cy } = layout;
  if (count <= 0) return [];
  if (count === 1) return [{ x: cx, y: 250 }];
  if (count === 2) return [{ x: cx - 174, y: cy + 1 }, { x: cx + 174, y: cy + 1 }];
  if (count === 3) return [{ x: cx, y: 190 }, { x: cx - 202, y: 386 }, { x: cx + 202, y: 386 }];
  if (count === 4) return [{ x: cx, y: 210 }, { x: cx - 224, y: 370 }, { x: cx + 224, y: 370 }, { x: cx, y: 530 }];
  if (count === 5) {
    return [
      { x: cx, y: 205 },
      { x: cx + 230, y: 330 },
      { x: cx + 185, y: 565 },
      { x: cx - 185, y: 565 },
      { x: cx - 230, y: 330 },
    ];
  }
  if (count === 6) {
    return [
      { x: cx, y: 205 },
      { x: cx + 255, y: 315 },
      { x: cx + 255, y: 555 },
      { x: cx, y: 655 },
      { x: cx - 255, y: 555 },
      { x: cx - 255, y: 315 },
    ];
  }
  const r = Math.min(300, Math.max(230, count * 38));
  return Array.from({ length: count }, (_, i) => {
    const angle = -90 + (360 / count) * i;
    return ringPoint(cx, cy, r, angle);
  });
}

function buildSupportLinks(members: PositionedMember[]): SupportLink[] {
  const candidates: LinkCandidate[] = [];
  for (const receiver of members) {
    for (const need of receiver.needs) {
      for (const donor of members) {
        if (donor.id === receiver.id) continue;
        const potential = donorPotential(donor, need.element);
        const receiverCount = receiver.saju.wuxingCount[need.element];
        if (potential <= receiverCount) continue;
        candidates.push({
          from: donor,
          to: receiver,
          element: need.element,
          role: need.role,
          score: need.score * 10 + potential * 2,
        });
      }
    }
  }
  const sorted = candidates.sort((a, b) => b.score - a.score);
  const selected: LinkCandidate[] = [];
  const selectedPairs = new Set<string>();
  const self = members.find((m) => m.id === "self") ?? members.find((m) => m.relation === "나");

  if (self) {
    for (const other of members.filter((m) => m.id !== self.id)) {
      const best = sorted.find((c) => unorderedPairKey(c.from, c.to) === unorderedPairKey(self, other));
      if (best) {
        selected.push(best);
        selectedPairs.add(unorderedPairKey(best.from, best.to));
      }
    }
  }

  const maxLinks = Math.max(3, Math.min(6, members.length));
  for (const candidate of sorted) {
    if (selected.length >= maxLinks) break;
    const key = unorderedPairKey(candidate.from, candidate.to);
    if (selectedPairs.has(key)) continue;
    selected.push(candidate);
    selectedPairs.add(key);
  }

  return assignPairSlots(
    selected
      .sort((a, b) => b.score - a.score)
      .slice(0, maxLinks)
      .map((link, index) => ({ ...link, index, pairSlot: 0 as const })),
  );
}

function assignPairSlots(links: SupportLink[]): SupportLink[] {
  const pairCounts = new Map<string, number>();
  for (const link of links) {
    pairCounts.set(pairKey(link), (pairCounts.get(pairKey(link)) ?? 0) + 1);
  }
  return links.map((link) => {
    const count = pairCounts.get(pairKey(link)) ?? 0;
    if (count < 2) return link;
    return {
      ...link,
      pairSlot: link.from.id < link.to.id ? -1 : 1,
    };
  });
}

function pairKey(link: Pick<SupportLink, "from" | "to">): string {
  return [link.from.id, link.to.id].sort().join("::");
}

function unorderedPairKey(a: Pick<PositionedMember, "id">, b: Pick<PositionedMember, "id">): string {
  return [a.id, b.id].sort().join("::");
}

function buildHeadline(links: SupportLink[]): string {
  const first = links[0];
  if (!first) return "노드는 각자의 일간과 필요한 오행을, 화살표는 서로 더해주는 흐름을 보여줘.";
  return `먼저 보는 흐름은 ${first.from.name}${subjectParticle(first.from.name)} ${first.to.name}에게 ${first.element} 기운을 더해주는 관계야.`;
}

function weakLabel(m: MemberSummary): string {
  if (m.weak.length === 0) return "고른 편";
  return m.weak.slice(0, 2).join("·");
}

function needLabel(m: MemberSummary): string {
  return m.primaryNeed.element;
}

function strongLabel(m: MemberSummary): string {
  if (m.strong.length === 0) return "고른 편";
  const label = m.strong.slice(0, 2).join("·");
  return m.strong.length > 2 ? `${label}+` : label;
}

function chipWidth(label: string): number {
  return Math.max(92, Math.min(118, label.length * 15 + 50));
}

function ribbonText(links: SupportLink[]): string {
  if (links.length === 0) {
    return "필요한 기운을 한 사람에게 맡기기보다 가족 루틴으로 같이 채우면 좋아.";
  }
  const first = links[0];
  return `${first.from.name} → ${first.to.name}: ${first.element} 기운을 더해줘.`;
}

function linkDescription(link: Pick<SupportLink, "from" | "to" | "element">): string {
  return `${link.from.name}${subjectParticle(link.from.name)} ${link.to.name}에게 ${link.element} 기운을 더해주는 흐름`;
}

function buildElementNeeds(
  member: FamilyCircleMember,
  entries: Array<{ el: Wuxing; count: number }>,
  min: number,
  avg: number,
): ElementNeed[] {
  const dayElement = dayElementOf(member);
  return entries
    .map(({ el, count }) => {
      const missing = count === 0;
      const isWeakest = count === min;
      const scarcity = Math.max(0, avg - count);
      const role = elementRole(dayElement, el);
      const score = (missing ? 6 : 0) + (isWeakest ? 3 : 0) + scarcity * 2 + ROLE_WEIGHT[role];
      return { element: el, role, score, count };
    })
    .filter((need) => need.count === 0 || need.count === min || need.score >= ROLE_WEIGHT[need.role] + 2.2)
    .sort((a, b) => b.score - a.score);
}

function donorPotential(donor: PositionedMember, element: Wuxing): number {
  const dayBonus = dayElementOf(donor) === element ? 1.5 : 0;
  const strongBonus = donor.strong.includes(element) ? 1 : 0;
  return donor.saju.wuxingCount[element] + dayBonus + strongBonus;
}

function dayElementOf(member: Pick<FamilyCircleMember, "saju">): Wuxing {
  const wx = member.saju.dayMaster.wuxing;
  return ELEMENTS.includes(wx as Wuxing) ? (wx as Wuxing) : "목";
}

function dayMasterLabel(member: Pick<FamilyCircleMember, "saju">): string {
  return `${member.saju.dayMaster.ko}${member.saju.dayMaster.wuxing}`;
}

function subjectParticle(text: string): "이" | "가" {
  const last = text.trim().charCodeAt(text.trim().length - 1);
  if (last < 0xac00 || last > 0xd7a3) return "가";
  return (last - 0xac00) % 28 === 0 ? "가" : "이";
}

function elementRole(dayElement: Wuxing, element: Wuxing): NeedRole {
  if (element === dayElement) return "비겁";
  if (GENERATES[element] === dayElement) return "인성";
  if (GENERATES[dayElement] === element) return "식상";
  if (CONTROLS[dayElement] === element) return "재성";
  return "관성";
}

function linkPath(link: SupportLink, layout: FamilyCircleLayout): string {
  const g = linkGeometry(link, layout);
  return `M ${g.start.x} ${g.start.y} L ${g.end.x} ${g.end.y}`;
}

function linkGeometry(link: SupportLink, layout: FamilyCircleLayout): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  const baseStart = edgePoint(link.from, link.to, layout.nodeR + 10);
  const baseEnd = edgePoint(link.to, link.from, layout.nodeR + 14);
  if (link.pairSlot === 0) {
    return { start: baseStart, end: baseEnd };
  }

  const offset = parallelOffset(baseStart, baseEnd, link.pairSlot * 10);
  return {
    start: offsetPoint(baseStart, offset),
    end: offsetPoint(baseEnd, offset),
  };
}

function parallelOffset(
  start: { x: number; y: number },
  end: { x: number; y: number },
  distance: number,
): { x: number; y: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return {
    x: Math.round((-dy / len) * distance),
    y: Math.round((dx / len) * distance),
  };
}

function offsetPoint(point: { x: number; y: number }, offset: { x: number; y: number }): { x: number; y: number } {
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

function edgePoint(from: { x: number; y: number }, to: { x: number; y: number }, radius: number): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return {
    x: Math.round(from.x + (dx / len) * radius),
    y: Math.round(from.y + (dy / len) * radius),
  };
}

function ringPoint(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.round(cx + Math.cos(a) * r), y: Math.round(cy + Math.sin(a) * r) };
}

function short(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
