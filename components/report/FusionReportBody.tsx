"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ReportView from "@/components/ReportView";
import TciRadar, { DIM_COLOR, type RadarAxis } from "@/components/TciRadar";
import { formatKoreanTimeCorrection } from "@/lib/saju/koreanTime";
import { seasonOfBranch, stemMeta } from "@/lib/saju/seasonClock";
import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";

/**
 * 사주 × 기질 리포트 상단 시각화.
 * DATA SUMMARY → 정체성 한 문장 → 8축 구성표 → 사주×기질 연결 지도 → 팔각형 레이더 → AI 해설 순서로 고정한다.
 */

const WUXING_AXIS: Record<string, string[]> = {
  목: ["NS", "FLEX"],
  화: ["SD", "RD"],
  토: ["HA", "PS"],
  금: ["CO"],
  수: ["ST", "RD"],
};

const AXIS_COPY: Record<string, { label: string; meaning: string; group: "temperament" | "environment" }> = {
  NS: { label: "추진성", meaning: "시작하고 움직이는 힘", group: "temperament" },
  HA: { label: "안정성", meaning: "예측·위험관리", group: "temperament" },
  RD: { label: "공감성", meaning: "타인 정서 감응", group: "temperament" },
  PS: { label: "지속성", meaning: "버티고 완수", group: "temperament" },
  SD: { label: "주도성", meaning: "선택·결정·책임", group: "environment" },
  CO: { label: "연결성", meaning: "협력·소속·신뢰", group: "environment" },
  ST: { label: "통찰성", meaning: "의미·직관·성찰", group: "environment" },
  FLEX: { label: "유연성", meaning: "통합·개방", group: "environment" },
};

const AXIS_ORDER = ["NS", "HA", "RD", "PS", "SD", "CO", "ST", "FLEX"];
const EL_ORDER = ["목", "화", "토", "금", "수"] as const;
const EL_CLASS: Record<string, string> = { 목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water" };

export default function FusionReportBody({
  scores,
  flexibility,
  previousScores,
  previousFlexibility,
  saju,
  birthYear,
  currentYear,
  currentAge,
  name,
  gender,
  occupation,
  report,
  fallback,
  actions,
  showConsultCta = false,
}: {
  scores: TciScore[];
  flexibility?: number;
  previousScores?: TciScore[];
  previousFlexibility?: number;
  saju: SajuResult | null;
  birthYear: number;
  currentYear: number;
  currentAge?: number;
  name?: string;
  gender?: string;
  occupation?: string;
  report?: string;
  fallback?: ReactNode;
  actions?: ReactNode;
  showConsultCta?: boolean;
}) {
  const age = currentAge ?? (birthYear ? Math.max(0, currentYear - birthYear) : undefined);
  const radarAxes = buildRadarAxes(scores, flexibility);
  const previousAxes = buildRadarAxes(previousScores ?? [], previousFlexibility);
  const deficitKeys = saju
    ? Object.entries(saju.wuxingCount).flatMap(([el, n]) => (n === 0 ? WUXING_AXIS[el] ?? [] : []))
    : [];

  return (
    <div className="fusion-report mt5">
      {saju && (
        <>
          <DataSummary
            saju={saju}
            name={name}
            gender={gender}
            currentAge={age}
            occupation={occupation}
          />
          <FusionHero saju={saju} scores={scores} />
        </>
      )}

      {scores.length > 0 && (
        <>
          <p className="h-sec mt5">기질 8축 구성표</p>
          <TemperamentGrid scores={scores} flexibility={flexibility} />
        </>
      )}

      {saju && radarAxes.length > 0 && (
        <>
          <p className="h-sec mt5">사주 × 기질 연결 지도</p>
          <ElementTemperamentMap saju={saju} axes={radarAxes} />
        </>
      )}

      {radarAxes.length > 0 && (
        <>
          <p className="h-sec mt5">기질 팔각형</p>
          <div className="fusion-radar-card">
            <TciRadar
              axes={radarAxes}
              deficitKeys={deficitKeys}
              compareAxes={previousAxes.length > 0 ? previousAxes : undefined}
            />
            <div className="fusion-radar-legend">
              <span><i className="cur" />현재 검사</span>
              {previousAxes.length > 0 ? <span><i className="prev" />이전 검사</span> : <span>이전 검사 데이터 없음</span>}
              {deficitKeys.length > 0 && <span><i className="def" />부족 오행과 연결된 축</span>}
            </div>
          </div>
        </>
      )}

      {report != null ? <ReportView className="mt5" text={report} currentAge={age} /> : fallback}
      {actions}

      {showConsultCta && (
        <div className="card card-flat mt4">
          <b style={{ fontSize: 14 }}>이 해석 두고 더 얘기해볼래?</b>
          <Link href="/consult" className="btn btn-primary btn-block mt3" style={{ textDecoration: "none" }}>
            AI 상담으로 이어가기
          </Link>
        </div>
      )}
    </div>
  );
}

function buildRadarAxes(scores: TciScore[], flexibility?: number): RadarAxis[] {
  const byKey = new Map(scores.map((s) => [s.dimension, s]));
  return AXIS_ORDER.flatMap((key) => {
    if (key === "FLEX") {
      return typeof flexibility === "number" ? [{ key, label: AXIS_COPY[key].label, percent: flexibility }] : [];
    }
    const score = byKey.get(key as TciScore["dimension"]);
    return score ? [{ key, label: AXIS_COPY[key].label, percent: score.percent }] : [];
  });
}

function DataSummary({
  saju,
  name,
  gender,
  currentAge,
  occupation,
}: {
  saju: SajuResult;
  name?: string;
  gender?: string;
  currentAge?: number;
  occupation?: string;
}) {
  const birthTime = saju.input.birthTimeKnown ? saju.input.birthTime : "시각 모름";
  const calendar = saju.input.calendar === "lunar" ? "음력" : "양력";
  const correctionNote = formatKoreanTimeCorrection(saju.input.koreanTimeCorrection);
  const rows = [
    ["성함", name || "미입력"],
    ["성별", gender || "미입력"],
    ["생년월일시", `${saju.input.birthDate} ${birthTime} · ${calendar}`],
    ["나이", currentAge != null ? `만 ${currentAge}세` : "미입력"],
    ["직업", occupation || "미입력"],
  ];
  return (
    <section className="data-summary" aria-label="DATA SUMMARY">
      <p className="data-summary-k">DATA SUMMARY</p>
      <dl className="data-summary-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {correctionNote && (
        <p className="muted mt2" style={{ fontSize: 12 }}>
          한국 시간 보정: {correctionNote}
        </p>
      )}
    </section>
  );
}

function FusionHero({ saju, scores }: { saju: SajuResult; scores: TciScore[] }) {
  const stem = stemMeta(saju.dayMaster.hanja);
  const monthSeason = seasonOfBranch(saju.pillars.month.zhi.hanja);
  const top = scores.length ? [...scores].sort((a, b) => b.percent - a.percent)[0] : null;
  return (
    <div className="hero-identity mt4">
      <p className="hero-line">
        {monthSeason.phrase}에 뿌리내린{" "}
        <span className="hero-stem">{stem.emoji} {stem.short}</span>
        {top ? ` 위로 ${top.label}이 선명하게 올라온 ` : " 위에 기질의 결이 겹친 "}
        <span className="hero-zodiac">{saju.shengXiao.ko}띠</span>
      </p>
      {top && <p className="hero-keys">{top.label} · {top.description}</p>}
    </div>
  );
}

function TemperamentGrid({ scores, flexibility }: { scores: TciScore[]; flexibility?: number }) {
  const byKey = new Map(scores.map((s) => [s.dimension, s]));
  return (
    <div className="fusion-axis-grid">
      {AXIS_ORDER.map((key) => {
        const copy = AXIS_COPY[key];
        const score = key === "FLEX"
          ? (typeof flexibility === "number" ? { percent: flexibility } : null)
          : byKey.get(key as TciScore["dimension"]) ?? null;
        return (
          <div className={`fusion-axis-cell ${copy.group}`} key={key}>
            <span className="fusion-axis-group">{copy.group === "temperament" ? "타고난 성향" : "환경(변화 가능)"}</span>
            <strong style={{ color: DIM_COLOR[key] }}>{copy.label}</strong>
            <em>{copy.meaning}</em>
            <span className="fusion-axis-score">{score ? `${score.percent}%` : "대기"}</span>
          </div>
        );
      })}
    </div>
  );
}

function ElementTemperamentMap({ saju, axes }: { saju: SajuResult; axes: RadarAxis[] }) {
  const maxCount = Math.max(1, ...Object.values(saju.wuxingCount));
  const axisByKey = new Map(axes.map((a) => [a.key, a]));
  return (
    <div className="fusion-map">
      {EL_ORDER.map((el) => {
        const axisKeys = WUXING_AXIS[el] ?? [];
        const linked = axisKeys.map((key) => axisByKey.get(key)).filter(Boolean) as RadarAxis[];
        const avg = linked.length ? Math.round(linked.reduce((sum, a) => sum + a.percent, 0) / linked.length) : 0;
        const count = saju.wuxingCount[el];
        const status = relationStatus(count, avg);
        return (
          <div className="fusion-map-row" key={el}>
            <div className="fusion-map-head">
              <span className={`el-dot ${EL_CLASS[el]}`} />
              <b>{el}</b>
              <span>{status}</span>
            </div>
            <div className="fusion-map-bars">
              <div>
                <span className="fusion-map-label">사주</span>
                <span className="fusion-map-track">
                  <i className={EL_CLASS[el]} style={{ width: `${Math.max(8, (count / maxCount) * 100)}%` }} />
                </span>
              </div>
              <div>
                <span className="fusion-map-label">기질</span>
                <span className="fusion-map-track">
                  <i style={{ width: `${Math.max(8, avg)}%` }} />
                </span>
              </div>
            </div>
            <p>{linked.map((a) => `${a.label} ${a.percent}%`).join(" · ") || "연결 축 없음"}</p>
          </div>
        );
      })}
    </div>
  );
}

function relationStatus(count: number, axisAvg: number): string {
  if (count === 0 && axisAvg >= 60) return "기질이 채움";
  if (count === 0) return "보완 필요";
  if (count >= 2 && axisAvg >= 60) return "같은 방향";
  if (count >= 2 && axisAvg < 40) return "속도 차";
  return "조율 지점";
}
