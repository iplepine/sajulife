"use client";

import type { SajuResult } from "@/lib/saju/calculator";
import type { TciScore } from "@/lib/tci/scoring";
import styles from "./ReportVisualSummary.module.css";

const DIMENSIONS = [
  { title: "기질", dimensions: [["NS", "자극추구"], ["HA", "위험회피"], ["RD", "사회적민감성"], ["PS", "인내력"]] },
  { title: "성격", dimensions: [["SD", "자율성"], ["CO", "연대감"], ["ST", "자기초월"]] },
] as const;
type Dimension = (typeof DIMENSIONS)[number]["dimensions"][number][0];
const KEYS = new Set<string>(DIMENSIONS.flatMap(group => group.dimensions.map(([key]) => key)));

/** Read saved percentages as-is. Missing, duplicated or invalid scores are not zeroes. */
function savedPercentages(scores: TciScore[]): Map<Dimension, number> {
  const counts = new Map<string, number>();
  const values = new Map<Dimension, number>();
  for (const score of scores) {
    if (!score || !KEYS.has(score.dimension)) continue;
    const key = score.dimension as Dimension;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (typeof score.percent === "number" && Number.isFinite(score.percent) && score.percent >= 0 && score.percent <= 100) {
      values.set(key, score.percent);
    }
  }
  for (const [key, count] of counts) if (count !== 1) values.delete(key as Dimension);
  return values;
}

/** Two independent input views, not an element-to-temperament causal map. */
export default function ReportVisualSummary({ saju, scores }: { saju: SajuResult | null; scores?: TciScore[] }) {
  const hasResponses = scores !== undefined;
  const percentages = savedPercentages(Array.isArray(scores) ? scores : []);
  const pillars = saju ? [
    { label: "년주", sub: "태어난 해", pillar: saju.pillars.year, day: false },
    { label: "월주", sub: "태어난 달", pillar: saju.pillars.month, day: false },
    { label: "일주", sub: "태어난 날", pillar: saju.pillars.day, day: true },
    { label: "시주", sub: "태어난 시각", pillar: saju.input.birthTimeKnown ? saju.pillars.time : null, day: false },
  ] : [];

  return <section className={styles.summary} aria-label={hasResponses ? "사주와 검사 응답 한눈에 보기" : "사주 명식 한눈에 보기"}>
    <div className={styles.head}><h3>{hasResponses ? "두 관점의 바탕, 한눈에" : "사주의 구조, 한눈에"}</h3><p>{hasResponses ? "해석에 사용한 자료를 나란히 살펴봅니다" : "생년월일과 출생 시각으로 계산한 명식입니다"}</p></div>
    <div className={`${styles.columns}${hasResponses ? "" : ` ${styles.personal}`}`}>
      <section className={styles.chart} aria-label="사주 명식">
        <p className={styles.eyebrow}>SAJU <span>태어난 순간의 구조</span></p>
        {saju ? <>
          <dl className={styles.pillars}>
            {pillars.map(({ label, sub, pillar, day }) => <div key={label} className={`${styles.pillar}${day ? ` ${styles.day}` : ""}`}>
              <dt>{label}<span>{sub}</span></dt>
              <dd>{pillar ? <>
                <div className={styles.character}><span lang="zh-Hant">{pillar.gan.hanja}</span><small>{pillar.gan.ko}{day && <em>· 일간</em>}</small></div>
                <div className={styles.character}><span lang="zh-Hant">{pillar.zhi.hanja}</span><small>{pillar.zhi.ko}</small></div>
              </> : <div className={styles.unknown}><span aria-hidden="true">—</span><small>시각 미상</small></div>}</dd>
            </div>)}
          </dl>
          <div className={styles.dayMaster}><span>나를 읽는 기준 · 일간</span><strong><span lang="zh-Hant">{saju.dayMaster.hanja}</span> {saju.dayMaster.ko} · {saju.dayMaster.wuxing}</strong></div>
          <p className={styles.caption}>일간은 일주의 윗글자로, 사주를 읽는 기준입니다. 시각을 모르면 시주는 표시하지 않습니다.</p>
        </> : <p className={styles.empty}>명식 자료를 불러오지 못했어요. 저장된 풀이 본문은 그대로 읽을 수 있습니다.</p>}
      </section>

      {hasResponses && <section className={styles.responses} aria-label="저장된 검사 응답 경향">
        <p className={styles.eyebrow}>TEMPERAMENT <span>검사 응답에 나타난 경향</span></p>
        {percentages.size ? <div className={styles.groups}>{DIMENSIONS.map(group => <section key={group.title} className={styles.group} aria-label={group.title}>
          <h4>{group.title}<small>{group.dimensions.length}개 차원</small></h4>
          <ul>{group.dimensions.map(([key, label]) => {
            const percent = percentages.get(key);
            return <li key={key} data-dimension={key} className={styles.scoreRow}>
              <span className={styles.dimension}>{label}</span>
              {percent != null ? <>
                <div className={styles.track} role="meter" aria-label={`${label} 응답 환산 비율`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percent}% · 응답 환산 비율, 백분위 아님`}><span style={{ width: `${percent}%` }} /></div>
                <span className={styles.value}>{percent}<small>%</small></span>
              </> : <span className={styles.missing}>저장된 응답 없음</span>}
            </li>;
          })}</ul>
        </section>)}</div> : <p className={styles.empty}>이 저장본에서 확인할 수 있는 검사 점수가 없습니다. 새 점수를 추정하지 않고 풀이 본문만 보여드립니다.</p>}
        <p className={styles.caption}>막대는 저장된 점수를 0–100으로 환산한 응답 비율입니다. 다른 사람과 비교한 백분위나 검증 규준이 아니며, 높다고 더 좋다는 뜻은 아닙니다.</p>
      </section>}
    </div>
  </section>;
}
