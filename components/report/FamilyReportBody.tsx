"use client";

import FamilyCircle from "@/components/FamilyCircle";
import FamilyRelationGraph from "@/components/FamilyRelationGraph";
import type { FamilyCircleMember } from "@/lib/saju/familyCircle";

/**
 * 가족 리포트의 시각화 블록 — "가족 인생 흐름" 캡션 + 겹쳐 그린 FamilyCircle.
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
    <>
      <p className="h-sec mt5">우리 가족, 지금의 결</p>
      <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
        누가 누구에게 기운을 나눠주고 어디가 비었는지 한눈에 보라고 그렸어. 화살표는 북돋워주는 흐름이야.
      </p>
      <div className="card" style={{ padding: "18px 14px" }}>
        <FamilyRelationGraph members={circleMembers} />
      </div>

      <p className="h-sec mt5">가족 인생 흐름</p>
      <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
        {hasSelf ? "너 포함해 가족 모두의" : "가족 모두의"} 타고난 결과 인생 흐름을 한 시계 위에 색으로 겹쳐봤어.
      </p>
      <div className="card" style={{ padding: "16px 14px 18px" }}>
        <FamilyCircle members={circleMembers} currentYear={currentYear} />
      </div>
    </>
  );
}
