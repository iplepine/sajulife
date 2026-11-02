import styles from "./home.module.css";

/** 설명용 고정 도식. 얼굴에서 추론한 값이나 현재 인물의 실제 명식/점수가 아니다. */
export default function PortraitAnalysis() {
  const pillars = [
    { label: "년", stem: "甲", branch: "子" },
    { label: "월", stem: "丁", branch: "卯" },
    { label: "일", stem: "戊", branch: "午" },
    { label: "시", stem: "庚", branch: "申" },
  ];
  return (
    <svg className={styles.sightlines} viewBox="0 0 600 600" fill="none" aria-hidden="true" focusable="false">
      <g className={styles.sajuSight}>
        <text className={styles.sightlineText} x="24" y="200">사주</text>
        <text className={styles.inputLabel} x="24" y="222">생년월일 · 태어난 시간</text>
        <path d="M34 238H94L116 342M106 331l10 11 5-15" />
        <circle cx="116" cy="342" r="3" />
        <g data-home-saju-example transform="translate(64 356)">
          <rect className={styles.diagramPaper} width="232" height="130" rx="5" />
          <path className={styles.diagramRule} d="M0 28H232M0 79H232M58 0V130M116 0V130M174 0V130" />
          {pillars.map((pillar, index) => <g key={pillar.label} textAnchor="middle">
            <text className={styles.pillarLabel} x={29 + index * 58} y="19">{pillar.label}</text>
            <text className={styles.pillarGlyph} x={29 + index * 58} y="65">{pillar.stem}</text>
            <text className={styles.pillarGlyph} x={29 + index * 58} y="117">{pillar.branch}</text>
          </g>)}
        </g>
      </g>
      <g className={styles.temperamentSight}>
        <text className={styles.sightlineText} x="575" y="170" textAnchor="end">기질</text>
        <text className={styles.inputLabel} x="575" y="192" textAnchor="end">설문 응답</text>
        <path d="M561 208H548L526 365M522 350l4 15 10-12" />
        <circle cx="526" cy="365" r="3" />
        <g data-home-temperament-example>
          <circle className={styles.radarPaper} cx="470" cy="438" r="91" />
          <g className={styles.radarGrid}>
            <path d="M470 374L531 418 508 490 432 490 409 418Z" />
            <path d="M470 395L511 425 495 473 445 473 429 425Z" />
            <path d="M470 416L491 431 483 455 457 455 449 431Z" />
            <path d="M470 438V374M470 438L531 418M470 438L508 490M470 438L432 490M470 438L409 418" />
          </g>
          <path className={styles.radarShape} d="M470 392L518 422 493 470 440 479 429 425Z" />
          {[[470, 392], [518, 422], [493, 470], [440, 479], [429, 425]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />)}
          <g className={styles.radarLabel} textAnchor="middle">
            <text x="470" y="360">새로움</text>
            <text x="554" y="418">신중함</text>
            <text x="516" y="512">관계</text>
            <text x="425" y="512">지속성</text>
            <text x="388" y="418">자율성</text>
          </g>
        </g>
      </g>
    </svg>
  );
}
