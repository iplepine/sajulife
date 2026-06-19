"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import LifeCircle from "@/components/LifeCircle";
import ReportView from "@/components/ReportView";
import TciRadar, { type RadarAxis } from "@/components/TciRadar";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";

/**
 * 사주 × 기질 융합 리포트의 본문 — 핵심 카드 + 해설(ReportView) + 레일(레이더·생애 시계).
 * 레이아웃(report-grid/rail)과 핵심 카드가 drift 위험 구간이라 통째로 추출해
 * 인증 페이지(/fusion)와 공개 공유 페이지가 공유한다.
 *
 * - report 있으면 ReportView, 없으면 fallback(로딩 등)을 본문에 렌더.
 * - actions: 본문 하단 소유자 액션(다시 생성·공유·디버그) 슬롯 — 공개 페이지에선 미전달.
 * - showConsultCta: 레일의 "AI 상담으로 이어가기" 카드(인증 앱 내부 링크) 노출 여부.
 */

/** 오행 → 묶이는 기질 축(코드). 부족한 오행의 축을 레이더에서 '움푹'으로 표시한다. */
const WUXING_AXIS: Record<string, string[]> = {
  목: ["NS", "FLEX"],
  화: ["SD", "RD"],
  토: ["HA", "PS"],
  금: ["CO"],
  수: ["ST", "RD"],
};

export default function FusionReportBody({
  scores,
  flexibility,
  saju,
  birthYear,
  currentYear,
  report,
  fallback,
  actions,
  showConsultCta = false,
}: {
  scores: TciScore[];
  flexibility?: number;
  saju: SajuResult | null;
  birthYear: number;
  currentYear: number;
  report?: string;
  fallback?: ReactNode;
  actions?: ReactNode;
  showConsultCta?: boolean;
}) {
  const dm = saju?.dayMaster;

  // 사주 핵심: 일간 + 현재 대운 오행
  let curEl = "";
  if (saju && saju.daewoon.length) {
    const age = currentYear - birthYear;
    let i = 0;
    for (let k = 0; k < saju.daewoon.length; k++) if (saju.daewoon[k].startAge <= age) i = k;
    curEl = saju.daewoon[i].gan.wuxing;
  }
  const sajuCore = dm ? `${dm.ko}${curEl ? ` · ${curEl} 대운` : ""}` : "사주 정보 필요";

  // 기질 핵심: 상위 3개 차원 라벨
  const tciCore = scores.length
    ? [...scores].sort((a, b) => b.percent - a.percent).slice(0, 3).map((s) => s.label).join(" · ")
    : "기질 검사 필요";

  // 레이더(7축 + 유연성) + 부족한 오행과 묶인 축을 '움푹'으로 표시
  const radarAxes: RadarAxis[] = scores.map((s) => ({ key: s.dimension, label: s.label, percent: s.percent }));
  if (typeof flexibility === "number") {
    radarAxes.push({ key: "FLEX", label: "유연성", percent: flexibility });
  }
  const deficitKeys = saju
    ? Object.entries(saju.wuxingCount).flatMap(([el, n]) => (n === 0 ? WUXING_AXIS[el] ?? [] : []))
    : [];

  return (
    <div className="report-grid mt5">
      <div>
        <div className="row gap3" style={{ flexWrap: "nowrap" }}>
          <div className="card" style={{ flex: 1, padding: 12 }}>
            <div className="muted" style={{ fontSize: 11 }}>기질 핵심</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{tciCore}</div>
          </div>
          <div className="card" style={{ flex: 1, padding: 12 }}>
            <div className="muted" style={{ fontSize: 11 }}>사주 핵심</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{sajuCore}</div>
          </div>
        </div>

        {report != null ? <ReportView className="mt4" text={report} /> : fallback}
        {actions}
      </div>

      <aside className="rail">
        {radarAxes.length > 0 && (
          <div className="card" style={{ padding: "14px 10px 8px" }}>
            <div className="ai-tag" style={{ justifyContent: "center" }}>기질 레이더</div>
            <TciRadar axes={radarAxes} deficitKeys={deficitKeys} />
            {deficitKeys.length > 0 && (
              <p className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 4 }}>
                빨강 = 부족한 오행과 묶인 축(채워지면 좋을 자리)
              </p>
            )}
          </div>
        )}
        {saju && (
          <div className="card coord" style={{ padding: 18 }}>
            <div className="ai-tag" style={{ justifyContent: "center" }}>생애 사주</div>
            <LifeCircle saju={saju} birthYear={birthYear} currentYear={currentYear} />
          </div>
        )}
        {showConsultCta && (
          <div className="card card-flat">
            <b style={{ fontSize: 14 }}>이 해석 두고 더 얘기해볼래?</b>
            <Link href="/consult" className="btn btn-primary btn-block mt3" style={{ textDecoration: "none" }}>AI 상담으로 이어가기</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
