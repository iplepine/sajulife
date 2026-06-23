"use client";

import FamilyCircle from "@/components/FamilyCircle";
import type { FamilyCircleMember } from "@/lib/saju/familyCircle";

const ELEMENT_ORDER = ["목", "화", "토", "금", "수"] as const;
type ElementKey = (typeof ELEMENT_ORDER)[number];

const ELEMENT_META: Record<ElementKey, { label: string; tone: string }> = {
  목: { label: "목", tone: "시작과 성장" },
  화: { label: "화", tone: "표현과 확장" },
  토: { label: "토", tone: "안정과 균형" },
  금: { label: "금", tone: "정리와 결정" },
  수: { label: "수", tone: "회복과 유연함" },
};

/**
 * 가족 리포트의 상단 블록 — DATA SUMMARY · 가족 한 문장 · 제노그램.
 * 인증 페이지(/family)와 공개 공유 페이지가 공유한다.
 * (AI 하단 섹션 텍스트는 호출부가 ReportView로 따로 렌더.)
 */
export default function FamilyReportBody({
  circleMembers,
  currentYear,
  title,
}: {
  circleMembers: FamilyCircleMember[];
  currentYear: number;
  title?: string;
}) {
  if (circleMembers.length === 0) return null;

  return (
    <section className="family-now-section">
      <FamilyDataSummary members={circleMembers} currentYear={currentYear} />

      <div className="family-now-head">
        <p className="h-sec">우리 가족, 지금의 결</p>
        <div className="hero-identity family-identity">
          <p className="hero-line">{title?.trim() || familySentence(circleMembers)}</p>
          <p className="hero-keys">{familyElementNote(circleMembers)}</p>
        </div>
      </div>

      <p className="h-sec mt5">가족 제노그램</p>
      <FamilyCircle members={circleMembers} currentYear={currentYear} />
    </section>
  );
}

function FamilyDataSummary({
  members,
  currentYear,
}: {
  members: FamilyCircleMember[];
  currentYear: number;
}) {
  return (
    <section className="data-summary family-data-summary" aria-label="DATA SUMMARY">
      <p className="data-summary-k">DATA SUMMARY</p>
      <div className="family-summary-list">
        {members.map((m, i) => (
          <div className="family-summary-row" key={m.id}>
            <span className="family-summary-no">({i})</span>
            <span className="family-summary-rel">{m.id === "self" ? "본인" : m.relation || "관계"}</span>
            <span className="family-summary-val">{summaryValue(m, currentYear)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function summaryValue(member: FamilyCircleMember, currentYear: number): string {
  const input = member.saju.input;
  const gender = input.gender === "male" ? "남성" : "여성";
  const calendar = input.calendar === "lunar" ? "음력" : "양력";
  const time = input.birthTimeKnown ? input.birthTime : "시각 모름";
  const age = member.birthYear > 0 ? ` · ${Math.max(0, currentYear - member.birthYear)}세 전후` : "";
  const occupation = member.occupation?.trim() ? ` · ${member.occupation.trim()}` : "";
  const stem = `${member.saju.dayMaster.ko}${member.saju.dayMaster.wuxing ? `(${member.saju.dayMaster.wuxing})` : ""}`;
  const zodiac = member.saju.shengXiao.ko ? ` · ${member.saju.shengXiao.ko}띠` : "";
  return `${member.name} · ${gender} · ${input.birthDate} ${time} ${calendar}${age}${occupation} · ${stem}${zodiac}`;
}

function familySentence(members: FamilyCircleMember[]): string {
  const totals = familyTotals(members);
  const strong = sortedElements(totals, "desc")[0];
  const weak = sortedElements(totals, "asc")[0];
  const strongMeta = ELEMENT_META[strong.key];
  const weakMeta = ELEMENT_META[weak.key];
  const countText = `${members.length}인 가족`;
  if (strong.count === weak.count) {
    return `${countText}, 다섯 기운이 비교적 고르게 섞여 서로의 속도를 맞춰가는 결.`;
  }
  return `${countText}, ${strongMeta.label} 기운의 ${strongMeta.tone}이 선명하고 ${weakMeta.label} 기운의 ${weakMeta.tone}을 서로 채워가는 결.`;
}

function familyElementNote(members: FamilyCircleMember[]): string {
  const totals = familyTotals(members);
  return ELEMENT_ORDER.map((key) => `${key} ${totals[key]}`).join(" · ");
}

function familyTotals(members: FamilyCircleMember[]): Record<ElementKey, number> {
  const totals: Record<ElementKey, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const m of members) {
    for (const key of ELEMENT_ORDER) totals[key] += m.saju.wuxingCount[key] ?? 0;
  }
  return totals;
}

function sortedElements(totals: Record<ElementKey, number>, dir: "asc" | "desc") {
  return ELEMENT_ORDER.map((key) => ({ key, count: totals[key] })).sort((a, b) =>
    dir === "asc" ? a.count - b.count : b.count - a.count,
  );
}
