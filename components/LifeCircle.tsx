import {
  computeBalanceWithDayun,
  type SajuBalanceWithDayun,
} from "@/lib/saju/balance";
import type { SajuResult } from "@/lib/saju/calculator";

/**
 * 생애 사주 — 사주 좌표.
 * 가로축은 음(좌) ↔ 양(우), 세로축은 한(하) ↔ 열(상).
 * 태극 안에 원국(8자) 위치와, 거기에 현재 대운(2자)을 더한 위치를 함께 찍는다.
 *
 * 점수 계산은 lib/saju/balance.ts에 위임 — 동일한 수치를 AI 프롬프트도 함께 쓴다.
 */

type Props = {
  saju: SajuResult;
  birthYear: number;
  currentYear: number;
};

const WUXING_VAR: Record<string, string> = {
  목: "var(--el-wood)",
  화: "var(--el-fire)",
  토: "var(--el-earth)",
  금: "var(--el-metal)",
  수: "var(--el-water)",
};
const WUXING_CLASS: Record<string, string> = {
  목: "wood", 화: "fire", 토: "earth", 금: "metal", 수: "water",
};

// 좌표계: cx=120, cy=120, 태극 r=90. 내부 좌표 음양(-1..+1) → x, 한열(-1..+1) → y(반전).
const R_RING = 90;
const R_PLOT = 74;
function toXY(yy: number, hy: number): [number, number] {
  return [120 + yy * R_PLOT, 120 - hy * R_PLOT];
}

export default function LifeCircle({ saju, birthYear, currentYear }: Props) {
  const balance: SajuBalanceWithDayun = computeBalanceWithDayun(saju, currentYear, birthYear);
  const segs = saju.daewoon.slice(0, 9);
  const N = segs.length;
  const currentAge = Math.max(0, currentYear - birthYear);
  const { dayMaster } = saju;

  const dmColor = WUXING_VAR[dayMaster.wuxing] ?? "var(--el-wood)";
  const dmClass = WUXING_CLASS[dayMaster.wuxing] ?? "wood";

  const [natalX, natalY] = toXY(balance.natal.yinYang, balance.natal.hanYeol);

  // 대운 없음 → 원국 한 점만.
  if (N === 0 || !balance.withDayun || !balance.currentDayun || !balance.withDayunLabels) {
    return (
      <div className="coord">
        <svg viewBox="0 0 240 240" className="taegeuk" role="img" aria-label="사주 좌표 — 음양·한열">
          <TaegeukCore />
          <circle cx="120" cy="120" r={R_RING} className="tg-ring" />
          <AxisCross />
          <circle cx={natalX} cy={natalY} r="12" className="pos-halo" />
          <circle cx={natalX} cy={natalY} r="7" className="pos-dot" />
        </svg>
        <div className="coord-read">
          <div className="row center wrap gap2">
            <span className="chip"><span className={`el-dot ${dmClass}`} />일간 {dayMaster.ko}</span>
            <span className="chip">
              <span className="el-dot el-dot-natal" />
              원국 · {balance.natalLabels.yinYang} · {balance.natalLabels.hanYeol}
            </span>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: "14px 0 0", textAlign: "center" }}>
            가로축 <b style={{ color: "var(--text)" }}>음↔양</b>, 세로축 <b style={{ color: "var(--text)" }}>한↔열</b>. 대운 흐름은 지금 계산할 수 없어 원국만 찍었어요.
          </p>
        </div>
      </div>
    );
  }

  const [dyX, dyY] = toXY(balance.withDayun.yinYang, balance.withDayun.hanYeol);
  const cur = balance.currentDayun;
  const dayunColor = WUXING_VAR[cur.ganWuxing] ?? "var(--el-earth)";
  const dayunClass = WUXING_CLASS[cur.ganWuxing] ?? "earth";

  const seg0 = segs[0].startAge;
  const lifespan = N * 10;
  const ageAt = (frac: number) => Math.round(seg0 + frac * lifespan);
  const nowFrac = Math.min(1, Math.max(0, (currentAge - seg0) / lifespan));

  return (
    <div className="coord">
      <svg viewBox="0 0 240 240" className="taegeuk" role="img" aria-label="사주 좌표 — 음양·한열">
        <TaegeukCore />
        <circle cx="120" cy="120" r={R_RING} className="tg-ring" />
        <AxisCross />

        {/* 원국 → 대운 흐름선 */}
        <line x1={natalX} y1={natalY} x2={dyX} y2={dyY} className="pos-link" />

        {/* 대운 점 (옅게, 바깥부터) */}
        <circle cx={dyX} cy={dyY} r="13" className="pos-halo-du" style={{ fill: dayunColor }} />
        <circle cx={dyX} cy={dyY} r="7.5" className="pos-dot-du" style={{ stroke: dayunColor }} />

        {/* 원국 점 (진하게, 위에) */}
        <circle cx={natalX} cy={natalY} r="12" className="pos-halo" />
        <circle cx={natalX} cy={natalY} r="6.5" className="pos-dot" />
      </svg>

      <div className="coord-read">
        <div className="row center wrap gap2">
          <span className="chip">
            <span className="el-dot el-dot-natal" />
            원국 · {balance.natalLabels.yinYang} · {balance.natalLabels.hanYeol}
          </span>
          <span className="chip">
            <span className={`el-dot ${dayunClass}`} />
            +{cur.ganZhiKo}({cur.ganWuxing}) 대운 · {balance.withDayunLabels.yinYang} · {balance.withDayunLabels.hanYeol}
          </span>
          <span className="chip"><span className={`el-dot ${dmClass}`} />일간 {dayMaster.ko}</span>
        </div>

        <div className="lifeline">
          <div className="ll-track">
            {segs.map((s, i) => (
              <span
                key={i}
                className={WUXING_CLASS[s.gan.wuxing] ?? "earth"}
                title={`${s.startAge}세~ ${s.gan.ko}${s.zhi.ko}`}
              />
            ))}
            <i className="ll-now" data-label={`지금 ${currentAge}세`} style={{ left: `${nowFrac * 100}%` }} />
          </div>
          <div className="ll-ticks">
            <span>탄생</span>
            <span>{ageAt(0.5)}세</span>
            <span>{ageAt(1)}세</span>
          </div>
        </div>

        <p className="muted" style={{ fontSize: 13, margin: "14px 0 0" }}>
          가로 <b style={{ color: "var(--text)" }}>음↔양</b>, 세로 <b style={{ color: "var(--text)" }}>한↔열</b>.
          진한 점은 <b style={{ color: "var(--text)" }}>원국(8자)</b> 자리, 옅은 점은 지금
          <b style={{ color: dmColor }}> {cur.ganWuxing}({cur.ganZhiKo}) 대운</b>까지 더한 자리예요.
        </p>
      </div>
    </div>
  );
}

/** 음양·한열 축 — 점선 십자와 끝점 바깥에 작은 글자 라벨. */
function AxisCross() {
  return (
    <g className="axis-cross">
      <line x1="34" y1="120" x2="206" y2="120" />
      <line x1="120" y1="34" x2="120" y2="206" />
      <text x="14" y="124" className="axis-label" textAnchor="middle">음</text>
      <text x="226" y="124" className="axis-label" textAnchor="middle">양</text>
      <text x="120" y="20" className="axis-label" textAnchor="middle">열</text>
      <text x="120" y="232" className="axis-label" textAnchor="middle">한</text>
    </g>
  );
}

/** 태극 중심부(음양). rotate -90으로 좌(음)·우(양) 배치. r=90으로 확장. */
function TaegeukCore() {
  return (
    <g transform="rotate(-90 120 120)">
      <circle cx="120" cy="120" r="90" className="tg-yin" />
      <path className="tg-yang" d="M120,30 a90,90 0 0 1 0,180 a45,45 0 0 1 0,-90 a45,45 0 0 0 0,-90 z" />
      <circle cx="120" cy="75" r="14" className="tg-eye-y" />
      <circle cx="120" cy="165" r="14" className="tg-eye-m" />
    </g>
  );
}
