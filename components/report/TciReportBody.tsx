"use client";

import BrandIcon from "@/components/BrandIcon";
import TciRadar, { DIM_COLOR, type RadarAxis } from "@/components/TciRadar";
import type { TciScore, TciSubscaleScore } from "@/lib/tci/scoring";

/**
 * 기질 풀이의 시각화 블록 — 8축 레이더 + 경향별 점수 막대(기질/성격) + 유연성.
 *
 * ★직접 채점한 7축과 보조로 가늠한 유연성을 화면에서 구분해서 보여준다.★ 둘을 나란히
 * 같은 모양으로 두면 여덟 개를 다 잰 것처럼 읽힌다 — 유연성은 대응 문항이 없다.
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
  title,
}: {
  scores: TciScore[];
  flexibility?: number;
  /** AI가 뽑은 최상단 한마디(표제). 개인 사주와 같은 히어로 자리에 그대로 쓴다. 없으면 폴백 문구. */
  title?: string;
}) {
  if (scores.length === 0) return null;

  return (
    <>
      <div className="hero-identity mt4">
        <BrandIcon name="gijil-oppa" className="hero-identity-icon" />
        <div className="hero-identity-copy">
          <p className="hero-guide">기질오빠가 보는 너는</p>
          <p className="hero-line">{title?.trim() || "점수 하나보다, 반복되는 반응 패턴을 같이 볼게."}</p>
        </div>
      </div>

      <p className="h-sec mt5">기질 한눈에</p>
      <p className="muted" style={{ fontSize: 13, marginBottom: 4 }}>
        중앙에 가까울수록 낮고, 바깥으로 돌출될수록 그 기질이 세. 점선은 균형선(50%)이야.
        {typeof flexibility === "number" && " 일곱 축은 네 응답으로 직접 채점한 값이고, 유연성만 그 패턴을 보고 가늠한 값이야."}
      </p>
      <div className="card" style={{ padding: "10px 8px 6px" }}>
        <TciRadar axes={buildRadarAxes(scores, flexibility)} />
      </div>

      <p className="h-sec mt5">차원별 점수</p>
      {/* ★'평균'·'백분위'라고 부르지 않는다★ — 인구집단 규준이 아니라 ★만점 대비 위치★다.
          비교 대상이 없는 수치를 평균이라 부르면 없는 근거를 있는 것처럼 말하게 된다. */}
      <p className="tci-legend">
        <span className="tci-legend-band" aria-hidden /> 가운데 구간(35–65%)
        <span className="sep">·</span>
        <span className="tci-legend-tick" aria-hidden /> 한가운데(50%)
      </p>
      <p className="muted" style={{ fontSize: 12, margin: "2px 0 0", lineHeight: 1.6 }}>
        점수는 그 경향 문항의 만점 대비 위치야. 다른 사람과 비교한 순위나 백분위가 아니야.
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
            <span className="tci-group-sub">설문으로 직접 재지 않은 값 · 보조 1축</span>
          </div>
          <p className="muted" style={{ fontSize: 12, margin: "0 0 8px", lineHeight: 1.6 }}>
            이 축만 설문에 대응하는 문항이 없어. 위 일곱 축의 조합을 보고 기질오빠가 가늠한 값이라
            직접 채점한 점수와 같은 무게로 읽지는 마.
          </p>
          <div className="barrow tci-row">
            <span
              className="lbl"
              title="상황·관점·계획을 얼마나 잘 바꾸고 적응하는가 — 일곱 축 패턴을 보고 가늠한 보조 값"
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
