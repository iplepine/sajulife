"use client";

/**
 * 이중섭 시안 — 한 장의 수묵 포스터
 * 먹 위로 오행의 색판이 용의 몸을 따라 순환하는 거친 판화 포스터입니다.
 */
export default function InkPoster() {
  return (
    <section className="ink-poster" aria-label="이중섭 시안: 한 장의 수묵 포스터">
      <style>{`
        .ink-poster {
          --ink: #10100f;
          --paper: #eee4cf;
          --wood: #2f9d78;
          --fire: #e25132;
          --earth: #c88b27;
          --metal: #91adc0;
          --water: #183f78;
          position: relative;
          isolation: isolate;
          min-height: clamp(610px, 80vh, 740px);
          overflow: hidden;
          color: var(--ink);
          background:
            linear-gradient(90deg, transparent 0 73%, rgba(16,16,15,.055) 73% 73.45%, transparent 73.45%),
            repeating-linear-gradient(-5deg, rgba(16,16,15,.045) 0 1px, transparent 1px 5px),
            var(--paper);
          box-shadow: 0 22px 48px rgba(29, 21, 12, .23);
          font-family: var(--font-geist-sans, ui-sans-serif), sans-serif;
        }
        .ink-poster::before {
          content: "";
          position: absolute;
          z-index: -1;
          top: -44px;
          right: -55px;
          width: 57%;
          height: 49%;
          background: var(--fire);
          clip-path: polygon(13% 0, 100% 0, 100% 88%, 32% 100%, 0 71%);
          box-shadow: -10px 11px 0 rgba(16,16,15,.92);
        }
        .ink-poster::after {
          content: "";
          position: absolute;
          inset: 10px;
          border: 2px solid var(--ink);
          pointer-events: none;
          z-index: 7;
        }
        .ink-poster__masthead {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 25px 28px 0;
          color: var(--ink);
          letter-spacing: .13em;
          font-size: 10px;
          font-weight: 900;
          z-index: 8;
        }
        .ink-poster__masthead span:last-child { color: #fff4dd; }
        .ink-poster__number {
          position: absolute;
          top: 54px;
          left: 18px;
          color: var(--fire);
          font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
          font-size: clamp(118px, 21vw, 192px);
          font-weight: 900;
          line-height: .72;
          letter-spacing: -.1em;
          transform: rotate(-4deg);
          z-index: 0;
        }
        .ink-poster__blue-disc {
          position: absolute;
          top: 112px;
          right: 20px;
          width: clamp(72px, 16vw, 118px);
          aspect-ratio: 1;
          border: 8px solid var(--ink);
          border-radius: 50%;
          background: var(--water);
          box-shadow: 7px 7px 0 #fff1d8, 12px 12px 0 var(--ink);
          z-index: 3;
        }
        .ink-poster__plates {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
        }
        .ink-poster__plate {
          position: absolute;
          display: block;
          box-shadow: 5px 5px 0 var(--ink);
          mix-blend-mode: multiply;
        }
        .ink-poster__plate--wood {
          top: 137px; left: 9%; width: 105px; height: 43px;
          background: var(--wood); clip-path: polygon(0 25%, 90% 0, 100% 72%, 12% 100%);
          transform: rotate(-11deg);
        }
        .ink-poster__plate--fire {
          top: 83px; right: 17%; width: 86px; height: 54px;
          background: var(--fire); clip-path: polygon(0 10%, 100% 0, 82% 100%, 15% 76%);
          transform: rotate(13deg);
        }
        .ink-poster__plate--earth {
          top: 258px; left: 31%; width: 85px; height: 45px;
          background: var(--earth); clip-path: polygon(0 23%, 78% 0, 100% 77%, 18% 100%);
          transform: rotate(-5deg);
        }
        .ink-poster__plate--metal {
          top: 205px; right: 5%; width: 82px; height: 39px;
          background: var(--metal); clip-path: polygon(0 12%, 93% 0, 100% 71%, 10% 100%);
          transform: rotate(20deg);
        }
        .ink-poster__plate--water {
          top: 317px; right: 28%; width: 98px; height: 46px;
          background: var(--water); clip-path: polygon(0 0, 100% 23%, 86% 100%, 11% 79%);
          transform: rotate(-14deg);
        }
        .ink-poster__blue-disc::before {
          content: "";
          position: absolute;
          inset: 22%;
          border: 3px solid #fff4dd;
          border-radius: 50%;
        }
        .ink-poster__blue-disc::after {
          content: "";
          position: absolute;
          width: 14px;
          height: 14px;
          top: 13px;
          left: 16px;
          border-radius: 50%;
          background: #fff9e9;
        }
        .ink-poster__dragon {
          position: absolute;
          top: 66px;
          left: -29%;
          width: min(144%, 820px);
          height: auto;
          transform: rotate(-8deg);
          z-index: 2;
          pointer-events: none;
        }
        .ink-poster__copy {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          min-height: 290px;
          padding: 31px 29px 31px;
          color: #fff4dc;
          background: var(--ink);
          clip-path: polygon(0 13%, 11% 0, 100% 8%, 100% 100%, 0 100%);
          z-index: 6;
        }
        .ink-poster__kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 13px;
          color: var(--fire);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .16em;
        }
        .ink-poster__kicker::before { content: "●"; color: var(--wood); font-size: 9px; }
        .ink-poster h2 {
          max-width: 12ch;
          margin: 0;
          font-family: Georgia, 'Times New Roman', 'Noto Serif KR', serif;
          font-size: clamp(31px, 6.2vw, 49px);
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -.08em;
          text-wrap: balance;
        }
        .ink-poster__rule {
          width: 68px;
          height: 7px;
          margin: 18px 0 13px;
          background: var(--fire);
          box-shadow: 76px -7px 0 var(--water), 126px 2px 0 var(--earth);
          transform: rotate(-2deg);
        }
        .ink-poster__summary {
          max-width: 31ch;
          margin: 0 0 21px;
          color: rgba(255,244,220,.72);
          font-size: 13px;
          font-weight: 650;
          line-height: 1.5;
        }
        .ink-poster__cta {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          gap: 11px;
          border: 0;
          padding: 0;
          color: #fff4dc;
          background: transparent;
          font: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }
        .ink-poster__cta span {
          display: grid;
          width: 29px;
          height: 29px;
          place-items: center;
          border: 2px solid #fff4dc;
          border-radius: 50%;
          color: var(--ink);
          background: var(--water);
          transition: transform .2s ease, background .2s ease;
        }
        .ink-poster__cta:hover span { transform: translateX(5px) rotate(-18deg); background: var(--fire); }
        .ink-poster__cycle {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 17px 0 0;
          color: rgba(255,244,220,.7);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .04em;
        }
        .ink-poster__cycle i {
          display: inline-grid;
          width: 17px;
          height: 17px;
          place-items: center;
          border: 1px solid rgba(255,244,220,.45);
          border-radius: 50%;
          color: var(--ink);
          font-style: normal;
          font-size: 8px;
        }
        .ink-poster__cycle i:nth-of-type(1) { background: var(--wood); }
        .ink-poster__cycle i:nth-of-type(2) { background: var(--fire); }
        .ink-poster__cycle i:nth-of-type(3) { background: var(--earth); }
        .ink-poster__cycle i:nth-of-type(4) { background: var(--metal); }
        .ink-poster__cycle i:nth-of-type(5) { background: var(--water); color: #fff4dc; }
        .ink-poster__cycle b { color: #fff4dc; font-size: 9px; }
        .ink-poster__seal {
          position: absolute;
          right: 28px;
          bottom: 28px;
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          border: 2px solid var(--fire);
          color: var(--fire);
          background: #fff4dc;
          font-family: Georgia, 'Noto Serif KR', serif;
          font-size: 20px;
          transform: rotate(-8deg);
          z-index: 8;
        }
        .ink-poster__seal::before { content: ""; position: absolute; inset: 3px; border: 1px solid var(--fire); }
        .ink-poster__index {
          position: absolute;
          right: 27px;
          top: 48%;
          color: var(--ink);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
          writing-mode: vertical-rl;
          z-index: 5;
        }
        .ink-poster__index b { color: var(--fire); font-size: 14px; }
        @media (max-width: 420px) {
          .ink-poster { min-height: 610px; }
          .ink-poster::before { right: -66px; width: 63%; height: 45%; }
          .ink-poster__masthead { padding: 23px 23px 0; }
          .ink-poster__masthead span:last-child { font-size: 9px; }
          .ink-poster__number { top: 57px; left: 15px; }
          .ink-poster__blue-disc { top: 112px; right: 17px; }
          .ink-poster__dragon { top: 74px; left: -47%; width: 164%; }
          .ink-poster__copy { min-height: 290px; padding: 30px 23px 23px; }
          .ink-poster__cycle { margin-top: 13px; gap: 5px; }
          .ink-poster__plate--wood { left: 3%; }
          .ink-poster__plate--metal { right: -4%; }
          .ink-poster__seal { right: 22px; bottom: 24px; }
          .ink-poster__index { display: none; }
        }
      `}</style>

      <div className="ink-poster__masthead">
        <span>GIJILAI · TODAY&apos;S JUDGEMENT</span>
        <span>2026. 07. 18</span>
      </div>
      <span className="ink-poster__number" aria-hidden="true">01</span>
      <span className="ink-poster__blue-disc" aria-hidden="true" />
      <div className="ink-poster__plates" aria-hidden="true">
        <i className="ink-poster__plate ink-poster__plate--wood" />
        <i className="ink-poster__plate ink-poster__plate--fire" />
        <i className="ink-poster__plate ink-poster__plate--earth" />
        <i className="ink-poster__plate ink-poster__plate--metal" />
        <i className="ink-poster__plate ink-poster__plate--water" />
      </div>

      <svg className="ink-poster__dragon" viewBox="0 0 820 510" aria-hidden="true">
        <defs>
          <filter id="poster-grain" x="-15%" y="-20%" width="130%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="19" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g fill="none" stroke="#10100f" strokeLinecap="square" filter="url(#poster-grain)">
          <path d="M 762 48 C 652 5 518 17 432 77 C 322 153 344 246 465 235 C 577 225 632 136 568 90 C 505 44 395 93 313 194 C 238 286 178 335 54 439" strokeWidth="55" />
          <path d="M 795 72 C 664 21 535 31 452 91 C 366 153 386 219 476 204 C 549 190 584 139 548 112 C 497 72 411 117 339 210 C 256 316 170 368 30 465" stroke="#25231e" strokeWidth="15" />
          <path d="M 767 104 C 649 86 562 114 505 154 C 452 192 479 214 535 187 C 589 161 613 124 588 102" stroke="#10100f" strokeWidth="11" />
          <path d="M 555 105 C 521 67 488 48 447 38 M 535 122 C 494 91 449 81 407 83 M 519 144 C 472 119 429 117 381 132" strokeWidth="8" />
          <path d="M 320 205 C 272 230 233 251 184 253 M 302 239 C 248 265 201 279 150 273 M 281 278 C 228 304 183 321 125 324" strokeWidth="11" />
          <path d="M 190 344 C 159 394 121 423 66 453 M 165 365 C 131 413 91 443 36 467 M 143 394 C 107 432 70 457 22 478" strokeWidth="8" />
        </g>
        <g fill="#10100f">
          <path d="M553 96 l18 -27 3 29 20 -18 -7 31" />
          <circle cx="565" cy="117" r="8" fill="var(--water)" />
          <circle cx="566" cy="116" r="2.5" fill="#fff4dc" />
        </g>
        <g fill="none" stroke="var(--fire)" strokeLinecap="square" strokeWidth="4">
          <path d="M 719 34 L 644 11 M 728 46 L 648 27 M 742 59 L 664 42" />
        </g>
        <g fill="none" strokeLinecap="square" strokeWidth="10">
          <path d="M 678 46 L 624 30" stroke="var(--wood)" />
          <path d="M 547 101 C 519 83 493 80 467 89" stroke="var(--fire)" />
          <path d="M 435 135 C 418 148 408 161 404 177" stroke="var(--earth)" />
          <path d="M 351 219 C 334 242 318 260 300 279" stroke="var(--metal)" />
          <path d="M 226 321 C 203 350 180 373 150 396" stroke="var(--water)" />
        </g>
        <g fill="none" stroke="#10100f" strokeLinecap="square" strokeWidth="2" opacity=".78">
          <path d="M 674 35 L 625 20 M 671 57 L 618 41 M 545 90 L 495 77 M 538 114 L 486 101 M 432 126 L 392 146 M 425 153 L 386 177 M 346 211 L 315 239 M 333 238 L 299 270 M 221 313 L 188 346 M 207 337 L 170 373" />
        </g>
      </svg>

      <div className="ink-poster__copy">
        <p className="ink-poster__kicker">오늘의 한 장</p>
        <h2>오늘은 속도보다<br />기준을 세울 때예요.</h2>
        <div className="ink-poster__rule" />
        <p className="ink-poster__summary">급하게 답을 내리기보다, 내 기준 한 줄을 먼저 적어보세요.</p>
        <button className="ink-poster__cta" type="button">
          오늘의 판단 읽기 <span aria-hidden="true">→</span>
        </button>
        <div className="ink-poster__cycle" aria-label="목, 화, 토, 금, 수 오행 순환">
          <i>木</i><b>→</b><i>火</i><b>→</b><i>土</i><b>→</b><i>金</i><b>→</b><i>水</i>
        </div>
      </div>
      <div className="ink-poster__index"><b>01</b> / 03</div>
      <div className="ink-poster__seal" aria-hidden="true">氣</div>
    </section>
  );
}
