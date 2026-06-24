"use client";

import ReportView from "@/components/ReportView";
import FamilyReportBody from "@/components/report/FamilyReportBody";
import FusionReportBody from "@/components/report/FusionReportBody";
import PersonalReportBody from "@/components/report/PersonalReportBody";
import TciReportBody from "@/components/report/TciReportBody";
import { parseFamilyReport } from "@/lib/report/types";
import type { ShareSnapshot } from "@/lib/store/shares";

/**
 * 공개 공유 스냅샷을 종류별 본문으로 렌더한다.
 * 인증 페이지와 같은 *ReportBody + ReportView를 재사용 — 시각화가 어긋나지 않는다.
 */
export default function ShareReportRenderer({ snap }: { snap: ShareSnapshot }) {
  switch (snap.kind) {
    case "personal": {
      const currentAge = snap.currentAge ?? (snap.birthYear ? Math.max(0, snap.currentYear - snap.birthYear) : undefined);
      return (
        <>
          <PersonalReportBody
            saju={snap.saju}
            name={snap.ownerName}
            gender={snap.gender}
            currentAge={currentAge}
            currentYear={snap.currentYear}
            occupation={snap.occupation}
          />
          <ReportView text={snap.report} currentAge={currentAge} />
        </>
      );
    }
    case "tci":
      return (
        <>
          <TciReportBody scores={snap.scores} flexibility={snap.flexibility} />
          <ReportView className="mt5" text={snap.report} />
        </>
      );
    case "fusion":
      return (
        <FusionReportBody
          scores={snap.scores}
          flexibility={snap.flexibility}
          saju={snap.saju}
          birthYear={snap.birthYear}
          currentYear={snap.currentYear}
          currentAge={snap.currentAge}
          name={snap.ownerName}
          gender={snap.gender}
          occupation={snap.occupation}
          report={snap.report}
        />
      );
    case "family":
      return (
        <>
          <FamilyReportBody
            circleMembers={snap.circleMembers}
            currentYear={snap.currentYear}
            title={parseFamilyReport(snap.report)?.title}
          />
          <ReportView text={snap.report} />
        </>
      );
  }
}
