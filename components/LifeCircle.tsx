import type { DaewoonPillar } from "@/lib/saju/calculator";

/**
 * 생애 사주 — circle of life.
 * 중심은 음양(태극), 둘레는 10년 단위 대운(大運)의 오행, 점은 '지금'의 자리.
 * 모든 값은 props로 받은 대운 데이터에서 계산하므로 라이트/다크·모바일/PC 어디서나 동일.
 */

type Props = {
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

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [
    Math.round((cx + r * Math.cos(a)) * 100) / 100,
    Math.round((cy + r * Math.sin(a)) * 100) / 100,
  ];
}

export default function LifeCircle({ daewoon, dayMaster, birthYear, currentYear }: Props) {
  // 너무 많으면 9칸까지만 (노년 이후는 생략).
  const segs = daewoon.slice(0, 9);
  const N = segs.length;
  const currentAge = Math.max(0, currentYear - birthYear);

  const dmColor = WUXING_VAR[dayMaster.wuxing] ?? "var(--el-wood)";
  const dmClass = WUXING_CLASS[dayMaster.wuxing] ?? "wood";

  // 대운 데이터가 없으면 태극 + 일간만 보여주는 단순형으로 graceful degrade.
  if (N === 0) {
    return (
      <div className="coord">
        <Taegeuk />
        <div className="coord-read">
          <div className="row center wrap gap2">
            <span className="chip"><span className={`el-dot ${dmClass}`} />일간 {dayMaster.ko}</span>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: "14px 0 0", textAlign: "center" }}>
            원은 한 생애를 뜻합니다. 대운(大運) 흐름은 현재 계산할 수 없어 일간만 표시했어요.
          </p>
        </div>
      </div>
    );
  }

  const step = 360 / N;
  const large = step > 180 ? 1 : 0;

  // 현재 대운 인덱스 — startAge가 현재 나이를 넘지 않는 마지막 칸.
  let currentIndex = 0;
  for (let i = 0; i < N; i++) {
    if (segs[i].startAge <= currentAge) currentIndex = i;
  }
  const cur = segs[currentIndex];

  const seg0 = segs[0].startAge;
  const lifespan = N * 10;
  const ageAt = (frac: number) => Math.round(seg0 + frac * lifespan);

  // 현재 칸 중앙 각도(12시 시작, 시계방향) → 포인터 + 점 위치.
  const midDeg = -90 + (currentIndex + 0.5) * step;
  const [dotX, dotY] = polar(120, 120, 90, midDeg);
  const [p0x, p0y] = polar(120, 120, 72, midDeg);
  const [p1x, p1y] = polar(120, 120, 88, midDeg);

  // 가로 생애 타임라인의 '지금' 위치(0~1).
  const nowFrac = Math.min(1, Math.max(0, (currentAge - seg0) / lifespan));

  return (
    <div className="coord">
      <svg viewBox="0 0 240 252" className="taegeuk" role="img" aria-label="생애 사주, 인생의 원">
        <circle cx="120" cy="120" r="90" className="du-track" />
        {segs.map((s, i) => {
          const a0 = -90 + i * step;
          const a1 = -90 + (i + 1) * step;
          const [x0, y0] = polar(120, 120, 90, a0);
          const [x1, y1] = polar(120, 120, 90, a1);
          return (
            <path
              key={i}
              className={`du-seg${i === currentIndex ? " now" : ""}`}
              stroke={WUXING_VAR[s.gan.wuxing] ?? "var(--el-earth)"}
              d={`M${x0},${y0} A90,90 0 ${large} 1 ${x1},${y1}`}
            />
          );
        })}
        <TaegeukCore />
        <circle cx="120" cy="120" r="56" className="tg-ring" />
        <line x1={p0x} y1={p0y} x2={p1x} y2={p1y} className="now-pointer" />
        <circle cx={dotX} cy={dotY} r="11" className="pos-halo" />
        <circle cx={dotX} cy={dotY} r="6" className="pos-dot" />
        <text x="120" y="13" className="age-tick" textAnchor="middle">탄생</text>
        <text x="228" y="124" className="age-tick" textAnchor="end">{ageAt(0.25)}세</text>
        <text x="120" y="240" className="age-tick" textAnchor="middle">{ageAt(0.5)}세</text>
        <text x="12" y="124" className="age-tick" textAnchor="start">{ageAt(0.75)}세</text>
      </svg>

      <div className="coord-read">
        <div className="row center wrap gap2">
          <span className="chip">
            <span className={`el-dot ${WUXING_CLASS[cur.gan.wuxing] ?? "earth"}`} />
            지금 · {cur.gan.wuxing}({cur.gan.ko}) 대운
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
          원은 한 생애, 색은 10년 단위 <b style={{ color: "var(--text)" }}>대운(大運)</b>의 오행입니다.
          지금은 <b style={{ color: dmColor }}>{cur.gan.wuxing}({cur.gan.ko}) 대운</b> — 일간 {dayMaster.ko}({dayMaster.wuxing})에
          이 기운이 더해지는 흐름이에요.
        </p>
      </div>
    </div>
  );
}

/** 태극 중심부(음양). rotate -90으로 위아래 음양 배치. */
function TaegeukCore() {
  return (
    <g transform="rotate(-90 120 120)">
      <circle cx="120" cy="120" r="56" className="tg-yin" />
      <path className="tg-yang" d="M120,64 a56,56 0 0 1 0,112 a28,28 0 0 1 0,-56 a28,28 0 0 0 0,-56 z" />
      <circle cx="120" cy="92" r="9" className="tg-eye-y" />
      <circle cx="120" cy="148" r="9" className="tg-eye-m" />
    </g>
  );
}

/** 대운이 없을 때 쓰는 단독 태극(둘레 트랙 + 중심 + 링). */
function Taegeuk() {
  return (
    <svg viewBox="0 0 240 252" className="taegeuk" role="img" aria-label="생애 사주, 인생의 원">
      <circle cx="120" cy="120" r="90" className="du-track" />
      <TaegeukCore />
      <circle cx="120" cy="120" r="56" className="tg-ring" />
    </svg>
  );
}
