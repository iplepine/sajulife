"use client";

import FamilyCircle from "@/components/FamilyCircle";
import type { FamilyCircleMember } from "@/lib/saju/familyCircle";

/**
 * 궁합 풀이의 상단 블록 — 풀이 기준 정보 · 관계 한 문장 · 두 사람 관계도.
 * 인증 페이지(/compat)와 공개 공유 페이지가 공유한다.
 * (AI 하단 섹션 텍스트는 호출부가 ReportView로 따로 렌더.)
 *
 * 가족(FamilyReportBody)과 시각화는 같은 FamilyCircle을 쓰되 ★카피가 다르다★ —
 * 등장인물이 둘뿐이라 "가족 전체의 기운" 같은 집합 서술이 성립하지 않는다.
 * 대신 두 사람의 기운이 ★서로 겹치는지 비는지★를 보여준다.
 */
const ELEMENT_ORDER = ["목", "화", "토", "금", "수"] as const;
type ElementKey = (typeof ELEMENT_ORDER)[number];

const ELEMENT_TONE: Record<ElementKey, string> = {
  목: "뻗어나가는 힘",
  화: "표현하고 데우는 힘",
  토: "붙잡고 안정시키는 힘",
  금: "정리하고 끊는 힘",
  수: "흐르고 받아주는 힘",
};

export default function CompatReportBody({
  circleMembers,
  currentYear,
  title,
  relation,
}: {
  circleMembers: FamilyCircleMember[];
  currentYear: number;
  title?: string;
  /** 연인·배우자·썸·친구·동료 — 헤더에 관계를 명시해 장면을 고정한다. */
  relation?: string;
}) {
  if (circleMembers.length === 0) return null;

  return (
    <section className="family-now-section">
      <CompatDataSummary members={circleMembers} currentYear={currentYear} />

      <div className="family-now-head">
        <p className="h-sec">{relation?.trim() ? `${relation.trim()} · 두 사람의 결` : "두 사람의 결"}</p>
        <div className="hero-identity family-identity">
          <p className="hero-line">{title?.trim() || compatSentence(circleMembers)}</p>
          <p className="hero-keys">{compatElementNote(circleMembers)}</p>
        </div>
      </div>

      <p className="h-sec mt5">두 사람 관계도</p>
      <FamilyCircle members={circleMembers} currentYear={currentYear} />
    </section>
  );
}

function CompatDataSummary({
  members,
  currentYear,
}: {
  members: FamilyCircleMember[];
  currentYear: number;
}) {
  return (
    <section className="data-summary family-data-summary" aria-label="풀이 기준 정보">
      <p className="data-summary-k">풀이 기준 정보</p>
      <div className="family-summary-list">
        {members.map((m, i) => (
          <div className="family-summary-row" key={m.id}>
            <span className="family-summary-no">({i})</span>
            <span className="family-summary-rel">{m.id === "self" ? "나" : m.relation || "상대"}</span>
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

/**
 * 두 사람을 겹쳤을 때 ★같이 많은 기운★과 ★둘 다 비어 있는 기운★을 짚는다.
 * 가족처럼 "제일 센 하나"만 말하면 2인에선 한쪽 사람 설명이 되어버려 관계 정보가 안 된다.
 */
function compatSentence(members: FamilyCircleMember[]): string {
  const totals = elementTotals(members);
  const ranked = ELEMENT_ORDER.map((key) => ({ key, count: totals[key] })).sort((a, b) => b.count - a.count);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  if (top.count === bottom.count) {
    return "둘을 겹치면 다섯 기운이 고르게 퍼져. 크게 쏠리는 데 없이 서로의 속도를 맞춰가는 조합이야.";
  }
  if (bottom.count === 0) {
    return `둘을 겹치면 ${ELEMENT_TONE[top.key]}이 두껍고, ${ELEMENT_TONE[bottom.key]}이 둘 다 비어 있어. 그 자리를 누가 맡을지가 이 관계의 숙제야.`;
  }
  return `둘을 겹치면 ${ELEMENT_TONE[top.key]}이 두껍고, ${ELEMENT_TONE[bottom.key]}은 얇아. 서로 채워주는 지점이 거기서 갈려.`;
}

function compatElementNote(members: FamilyCircleMember[]): string {
  const totals = elementTotals(members);
  return ELEMENT_ORDER.map((key) => `${key} ${totals[key]}`).join(" · ");
}

function elementTotals(members: FamilyCircleMember[]): Record<ElementKey, number> {
  const totals: Record<ElementKey, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const m of members) {
    for (const key of ELEMENT_ORDER) totals[key] += m.saju.wuxingCount[key] ?? 0;
  }
  return totals;
}
