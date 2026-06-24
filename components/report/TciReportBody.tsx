"use client";

import BrandIcon from "@/components/BrandIcon";
import TciRadar, { DIM_COLOR, type RadarAxis } from "@/components/TciRadar";
import type { TciScore, TciSubscaleScore } from "@/lib/tci/scoring";

/**
 * 기질 리포트의 시각화 블록 — 8축 레이더 + 차원별 점수 막대(기질/성격) + 유연성.
 * `scores`/`flexibility`만으로 그려지는 부분(AI 해설 텍스트는 호출부가 ReportView로 따로 렌더).
 * 인증 페이지(/tci/report)와 공개 공유 페이지가 동일 마크업을 공유한다.
 */

const TEMPERAMENT = new Set(["NS", "HA", "RD", "PS"]);

/** 7차원 점수 + 유연성(AI)을 레이더 8축으로. 유연성 없으면 7축. */
function buildRadarAxes(scores: TciScore[], flexibility?: number): RadarAxis[] {
  const axes: RadarAxis[] = scores.map((s) => ({ key: s.dimension, label: s.label, percent: s.percent }));
  if (typeof flexibility === "number") {
    axes.push({ key: "FLEX", label: "유연성", percent: flexibility });
  }
  return axes;
}

function levelLabel(p: number): string {
  if (p < 20) return "매우 낮음";
  if (p < 40) return "낮음";
  if (p < 65) return "보통";
  if (p < 85) return "높음";
  return "매우 높음";
}

export default function TciReportBody({
  scores,
  flexibility,
}: {
  scores: TciScore[];
  flexibility?: number;
}) {
  if (scores.length === 0) return null;

  return (
    <>
      <div className="report-guide report-guide--tci mt4">
        <BrandIcon name="gijil-oppa" className="report-guide-icon" />
        <div>
          <p className="report-guide-k">기질오빠가 먼저 정리한 관점</p>
          <p className="report-guide-t">점수 하나보다, 반복되는 반응 패턴을 같이 볼게요.</p>
        </div>
      </div>

      <p className="h-sec mt5">기질 한눈에</p>
      <p className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
        중앙에 가까울수록 낮고, 바깥으로 돌출될수록 그 기질이 세. 점선은 균형선(50%)이야.
      </p>
      <div className="card" style={{ padding: "10px 8px 6px" }}>
        <TciRadar axes={buildRadarAxes(scores, flexibility)} />
      </div>

      <p className="h-sec mt5">차원별 점수</p>
      <p className="tci-legend">
        <span className="tci-legend-band" aria-hidden /> 보통 범위(35–65%)
        <span className="sep">·</span>
        <span className="tci-legend-tick" aria-hidden /> 평균선(50%)
      </p>

      {(["기질", "성격"] as const).map((groupKey) => {
        const rows = scores.filter((s) =>
          groupKey === "기질" ? TEMPERAMENT.has(s.dimension) : !TEMPERAMENT.has(s.dimension),
        );
        if (rows.length === 0) return null;
        const sub = groupKey === "기질" ? "타고난 반응 성향 · 4축" : "스스로 가꿔온 영역 · 3축";
        return (
          <div className="tci-group mt3" key={groupKey}>
            <div className="tci-group-head">
              <span className="tci-group-title">{groupKey}</span>
              <span className="tci-group-sub">{sub}</span>
            </div>
            {rows.map((s) => (
              <div key={s.dimension}>
                <div className="barrow tci-row">
                  <span className="lbl" title={s.description}>{s.label}</span>
                  <div className="track tci-track">
                    <span style={{ width: `${s.percent}%`, background: DIM_COLOR[s.dimension] }} />
                  </div>
                  <span className="val tci-val">
                    {s.percent}
                    <span className="lvl">{levelLabel(s.percent)}</span>
                  </span>
                </div>
                {s.subscales && s.subscales.length > 0 && (
                  <div className="subbars">
                    {s.subscales.map((sub: TciSubscaleScore) => (
                      <div className="subbar tci-subrow" key={sub.code} title={sub.description}>
                        <span className="lbl">{sub.label}</span>
                        <div className="track tci-track">
                          <span style={{ width: `${sub.percent}%`, background: DIM_COLOR[s.dimension] }} />
                        </div>
                        <span className="val">{sub.percent}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {typeof flexibility === "number" && (
        <div className="tci-group mt3">
          <div className="tci-group-head">
            <span className="tci-group-title">유연성</span>
            <span className="tci-group-sub">상황 적응력 · AI 추정 1축</span>
          </div>
          <div className="barrow tci-row">
            <span
              className="lbl"
              title="상황·관점·계획을 얼마나 잘 바꾸고 적응하는가 — 7차원 패턴으로 AI가 추정"
            >
              유연성
            </span>
            <div className="track tci-track">
              <span style={{ width: `${flexibility}%`, background: DIM_COLOR.FLEX }} />
            </div>
            <span className="val tci-val">
              {flexibility}
              <span className="lvl">{levelLabel(flexibility)}</span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
