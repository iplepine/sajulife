"use client";

import FamilyCircle from "@/components/FamilyCircle";
import type { FamilyCircleMember } from "@/lib/saju/familyCircle";

/**
 * 가족 리포트의 시각화 블록 — "우리 가족, 지금의 결".
 * 인증 페이지(/family)와 공개 공유 페이지가 공유한다.
 * (AI 관계 풀이 텍스트는 호출부가 ReportView로 따로 렌더.)
 */
export default function FamilyReportBody({
  circleMembers,
  currentYear,
}: {
  circleMembers: FamilyCircleMember[];
  currentYear: number;
}) {
  if (circleMembers.length === 0) return null;
  const hasSelf = circleMembers.some((m) => m.id === "self");
  return (
    <section className="family-now-section">
      <div className="family-now-head">
        <p className="h-sec">우리 가족, 지금의 결</p>
        <p>
          {hasSelf ? "너를 포함해" : "가족 구성원별로"} 각자 부족한 오행과 강한 오행을 정리했어. 화살표는 어떤 기운이 누구에게 향하는지 보여줘.
        </p>
      </div>
      <FamilyCircle members={circleMembers} currentYear={currentYear} />
    </section>
  );
}
