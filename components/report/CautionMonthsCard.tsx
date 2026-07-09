"use client";

import type { CautionMonth, CautionRelation } from "@/lib/saju/cautionMonths";

/** 관계 → 카드용 짧은 자연어 라벨(한자·명리어 비노출). */
const CAUTION_LABEL: Record<CautionRelation, string> = {
  충: "급한 변화·이동 조심",
  삼형: "부딪침·시비 조심",
  상형: "엇갈림·자존심 마찰",
  자형: "혼자 끌어안다 과부하",
  파: "계획 틀어짐 조심",
  해: "소모·잔병·구설 조심",
};

/**
 * 주의가 필요한 시기 — 그 해 월운이 원국과 부딪치는 달을 '속도 줄이기 권장도' 별점으로.
 * 결정론 계산값(cautionMonths)만으로 그린다. AI 서술은 같은 '주의가 필요한 시기' 섹션
 * 본문이 이 카드 아래로 이어 렌더한다(ReportView). 접히는 섹션 안에 들어가므로 자체
 * 제목은 두지 않는다. currentMonth가 들어오면 이미 지난 달은 흐리게(겪고 지나간 신호) 표시.
 */
export default function CautionMonthsCard({
  months,
  currentMonth,
}: {
  months?: CautionMonth[];
  currentMonth?: number;
}) {
  if (!months || months.length === 0) return null;
  const notable = months
    .filter((m) => m.level >= 3)
    .sort((a, b) => b.level - a.level || a.month - b.month);
  if (notable.length === 0) return null;
  const topLabel = (m: CautionMonth): string =>
    m.hits.length === 0 ? "" : CAUTION_LABEL[m.hits[0].relation] ?? "";
  return (
    <div className="caution-block">
      <p className="muted caution-note">
        「조심」은 템포 살짝 늦추면 좋은 달, 「전환」은 묵은 거 흘려보내는 달이야. 겁먹을 건 없어 — 미리 알고 가라는 거니까.
        {currentMonth != null && " 이미 지난 달은 흐리게 표시했어."}
      </p>
      <div className="caution-list">
        {notable.map((m) => {
          const turn = m.direction === "정리·전환";
          const past = currentMonth != null && m.month < currentMonth;
          return (
            <div className={`caution-row${past ? " past" : ""}`} key={m.month}>
              <span className="caution-month">
                {m.month}월{past && <span className="caution-past"> · 지남</span>}
              </span>
              <span className={`caution-tag${turn ? " turn" : ""}`}>{turn ? "전환" : "조심"}</span>
              <span className="caution-label">{topLabel(m)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
