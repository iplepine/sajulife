"use client";

import Link from "next/link";
import ReportFolio from "./ReportFolio";
import ReportVisualSummary from "./ReportVisualSummary";
import ShareButton from "@/components/ShareButton";
import MyeongriFold from "./MyeongriFold";
import PersonalReportBody from "./PersonalReportBody";
import SajuSheetReport from "./SajuSheetReport";
import type { SajuResult } from "@/lib/saju/calculator";
import { parsePersonalReport } from "@/lib/report/types";
import { isOldJudgment } from "@/lib/saju/judgmentVersion";

export type PersonalReading = { report: string; generatedAt: string; judgment?: number };

/**
 * Reuse the saju renderer without mounting /saju's generation and navigation effects.
 * 구조화 저장본은 작성 시기와 관계없이 명식 표부터 읽는 한 장 보고서로 보여준다.
 * 파싱할 수 없는 옛 텍스트만 기존 본문 렌더러로 보존한다.
 */
export default function SavedPersonalReading({ saved, saju, currentAge, currentYear, name, gender, occupation }: {
  saved: PersonalReading;
  saju: SajuResult | null;
  currentAge?: number;
  currentYear: number;
  name?: string;
  gender?: string;
  occupation?: string;
}) {
  const parsed = parsePersonalReport(saved.report);
  if (parsed) {
    return <SajuSheetReport report={parsed} saju={saju} generatedAt={saved.generatedAt} currentYear={currentYear} oldJudgment={isOldJudgment(saved)} />;
  }
  const title = "저장된 사주 풀이";
  return <ReportFolio kind="personal" text={saved.report} headline={title} name={name} generatedAt={saved.generatedAt} currentAge={currentAge} persistKey={`personal:${saved.generatedAt}`}
    visual={<ReportVisualSummary saju={saju} />}
    evidence={<>
      {saju ? <>
        <MyeongriFold saju={saju} currentAge={currentAge} currentYear={currentYear} oldJudgment={isOldJudgment(saved)} />
        <details className="saju-chart-fold mt4"><summary>내 사주표 다시 보기</summary>
          <PersonalReportBody saju={saju} name={name} gender={gender} occupation={occupation} currentAge={currentAge} currentYear={currentYear} identityTitle={title} hideIdentity />
        </details>
      </> : <p className="muted">명식 자료를 불러오지 못했지만 저장된 풀이 본문은 읽을 수 있어요.</p>}
    </>}
    actions={<div className="row gap2"><ShareButton kind="personal" /><Link href="/saju" className="btn btn-ghost btn-sm">사주 풀이 관리</Link></div>} />;
}
