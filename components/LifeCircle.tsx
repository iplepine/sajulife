import type { DaewoonPillar, Pillar, SajuResult } from "@/lib/saju/calculator";

/**
 * 생애 사주 — 사주 좌표.
 * 가로축은 음(좌) ↔ 양(우), 세로축은 한(하) ↔ 열(상).
 * 태극 안에 원국(8자) 위치와, 거기에 현재 대운(2자)을 더한 위치를 함께 찍는다.
 * 생애·대운 흐름은 아래 가로 타임라인이 따로 보여주므로 외곽 링은 두지 않는다.
 */

type Props = {
  pillars: SajuResult["pillars"];
  daewoon: DaewoonPillar[];
  dayMaster: { ko: string; wuxing: string };
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
// 화(熱) +2, 목(溫) +1, 토(中) 0, 금(涼) -1, 수(寒) -2.
const HEAT_WEIGHT: Record<string, number> = {
  화: 2, 목: 1, 토: 0, 금: -1, 수: -2,
};

type Char = { yinyang: "양" | "음"; wuxing: string };

function pillarChars(p: Pillar): Char[] {
  return [
    { yinyang: p.gan.yinyang, wuxing: p.gan.wuxing },
    { yinyang: p.zhi.yinyang, wuxing: p.zhi.wuxing },
  ];
}

function dayunChars(d: DaewoonPillar): Char[] {
  return [
    { yinyang: d.gan.yinyang, wuxing: d.gan.wuxing },
    { yinyang: d.zhi.yinyang, wuxing: d.zhi.wuxing },
  ];
}

function scoreYinYang(chars: Char[]): number {
  if (chars.length === 0) return 0;
  const sum = chars.reduce((s, c) => s + (c.yinyang === "양" ? 1 : -1), 0);
  return sum / chars.length;
}

function scoreHanYeol(chars: Char[]): number {
  if (chars.length === 0) return 0;
  const sum = chars.reduce((s, c) => s + (HEAT_WEIGHT[c.wuxing] ?? 0), 0);
  return Math.max(-1, Math.min(1, sum / (chars.length * 2)));
}

function yyLabel(s: number): string {
  const mag = Math.abs(s);
  if (mag < 0.12) return "음양 균형";
  const word = s > 0 ? "양" : "음";
  if (mag < 0.4) return `약한 ${word}`;
  if (mag < 0.75) return `${word} 우세`;
  return `강한 ${word}`;
}

function hyLabel(s: number): string {
  const mag = Math.abs(s);
  if (mag < 0.12) return "온화";
  if (s > 0) {
    if (mag < 0.4) return "약간 따뜻함";
    if (mag < 0.75) return "따뜻한 편";
    return "뜨거운 편";
  }
  if (mag < 0.4) return "약간 서늘함";
  if (mag < 0.75) return "서늘한 편";
  return "차가운 편";
}

// 좌표계: cx=120, cy=120, 태극 r=90. 내부 좌표 음양(-1..+1) → x, 한열(-1..+1) → y(반전).
const R_RING = 90;
const R_PLOT = 74;
function toXY(yy: number, hy: number): [number, number] {
  return [120 + yy * R_PLOT, 120 - hy * R_PLOT];
}

export default function LifeCircle({ pillars, daewoon, dayMaster, birthYear, currentYear }: Props) {
  const segs = daewoon.slice(0, 9);
  const N = segs.length;
  const currentAge = Math.max(0, currentYear - birthYear);

  const dmColor = WUXING_VAR[dayMaster.wuxing] ?? "var(--el-wood)";
  const dmClass = WUXING_CLASS[dayMaster.wuxing] ?? "wood";

  const natalChars: Char[] = [
    ...pillarChars(pillars.year),
    ...pillarChars(pillars.month),
    ...pillarChars(pillars.day),
    ...(pillars.time ? pillarChars(pillars.time) : []),
  ];
  const natalYY = scoreYinYang(natalChars);
  const natalHY = scoreHanYeol(natalChars);
  const [natalX, natalY] = toXY(natalYY, natalHY);

  // 대운 없음 → 원국 한 점만.
  if (N === 0) {
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
            <span className="chip"><span className="el-dot el-dot-natal" />원국 · {yyLabel(natalYY)} · {hyLabel(natalHY)}</span>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: "14px 0 0", textAlign: "center" }}>
            가로축 <b style={{ color: "var(--text)" }}>음↔양</b>, 세로축 <b style={{ color: "var(--text)" }}>한↔열</b>. 대운 흐름은 지금 계산할 수 없어 원국만 찍었어요.
          </p>
        </div>
      </div>
    );
  }

  // 현재 대운 인덱스 — startAge가 현재 나이를 넘지 않는 마지막 칸.
  let currentIndex = 0;
  for (let i = 0; i < N; i++) {
    if (segs[i].startAge <= currentAge) currentIndex = i;
  }
  const cur = segs[currentIndex];

  const withDayun = [...natalChars, ...dayunChars(cur)];
  const dayunYY = scoreYinYang(withDayun);
  const dayunHY = scoreHanYeol(withDayun);
  const [dyX, dyY] = toXY(dayunYY, dayunHY);

  const dayunColor = WUXING_VAR[cur.gan.wuxing] ?? "var(--el-earth)";
  const dayunClass = WUXING_CLASS[cur.gan.wuxing] ?? "earth";

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
            원국 · {yyLabel(natalYY)} · {hyLabel(natalHY)}
          </span>
          <span className="chip">
            <span className={`el-dot ${dayunClass}`} />
            +{cur.gan.ko}({cur.gan.wuxing}) 대운 · {yyLabel(dayunYY)} · {hyLabel(dayunHY)}
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
          <b style={{ color: dmColor }}> {cur.gan.wuxing}({cur.gan.ko}) 대운</b>까지 더한 자리예요.
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
