"use client";

const reports = [
  {
    key: "earth",
    eyebrow: "PERSONAL MAP",
    name: "내 사주",
    note: "타고난 결을 읽다",
    art: "/yongsin-dragon-assets/sliced/icons/icon-report.png",
  },
  {
    key: "water",
    eyebrow: "USEFUL ENERGY",
    name: "내 용신",
    note: "필요한 기운을 찾다",
    art: "/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png",
  },
  {
    key: "fire",
    eyebrow: "OUR RELATION",
    name: "가족 사주",
    note: "서로의 결을 보다",
    art: "/yongsin-dragon-assets/sliced/icons/icon-family.png",
  },
  {
    key: "wood",
    eyebrow: "TEMPERAMENT",
    name: "내 기질",
    note: "반응의 이유를 알다",
    art: "/yongsin-dragon-assets/sliced/icons/icon-profile.png",
  },
] as const;

/**
 * 이중섭 안 — 배너 아래에 이어지는 네 장의 작은 수묵 포스터.
 * Comparison page 안에서 독립적으로 렌더링되는 입구 시안이다.
 */
export default function InkTickets() {
  return (
    <section className="it-screen" aria-label="이중섭의 수묵 리포트 입구 시안">
      <div className="it-paper" aria-hidden="true" />
      <div className="it-grid">
        {reports.map((report, index) => (
          <button key={report.key} type="button" className={`it-ticket it-ticket--${report.key}`}>
            <span className="it-ticket-number" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
            <span className="it-ticket-seal" aria-hidden />
            <span className="it-ticket-rough" aria-hidden />
            <img className="it-ticket-art" src={report.art} alt="" draggable={false} />
            <span className="it-ticket-copy">
              <small>{report.eyebrow}</small>
              <strong>{report.name}</strong>
              <em>{report.note}</em>
            </span>
            <span className="it-ticket-arrow" aria-hidden>↗</span>
          </button>
        ))}
      </div>
      <p className="it-caption">보고 싶은 한 장을 골라, 지금의 흐름을 펼쳐보세요.</p>

      <style jsx>{`
        .it-screen {
          position: relative;
          min-height: 100%;
          overflow: hidden;
          padding: 25px 17px 22px;
          background: #f6efe2;
          color: #211b16;
          font-family: Arial, Pretendard, sans-serif;
          isolation: isolate;
        }

        .it-paper {
          position: absolute;
          z-index: -1;
          inset: 0;
          opacity: .68;
          background-image: url("/yongsin-dragon-assets/sliced/textures/texture-ivory-grain.png"), radial-gradient(rgba(38, 26, 16, .12) .6px, transparent .75px);
          background-size: cover, 4px 4px;
          mix-blend-mode: multiply;
          pointer-events: none;
        }

        .it-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .it-ticket {
          --accent: #cb8c14;
          --wash: #f5dd9d;
          position: relative;
          display: block;
          min-height: 178px;
          overflow: hidden;
          padding: 13px 12px;
          border: 1px solid rgba(31, 23, 16, .82);
          border-radius: 1px;
          background: #f8f1e5;
          color: #1e1915;
          box-shadow: 3px 4px 0 rgba(40, 29, 20, .13);
          text-align: left;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .it-ticket::before,
        .it-ticket::after {
          position: absolute;
          content: "";
          pointer-events: none;
        }

        .it-ticket::before {
          top: -25px;
          right: -28px;
          width: 101px;
          height: 101px;
          border: 1px solid var(--accent);
          border-radius: 50%;
          opacity: .53;
        }

        .it-ticket::after {
          right: -10px;
          bottom: 8px;
          width: 113px;
          height: 31px;
          background: var(--wash);
          opacity: .76;
          transform: rotate(-15deg);
          mix-blend-mode: multiply;
        }

        .it-ticket:hover,
        .it-ticket:focus-visible {
          z-index: 1;
          outline: 0;
          box-shadow: 5px 6px 0 rgba(40, 29, 20, .2);
          transform: translate(-2px, -2px) rotate(-.6deg);
        }

        .it-ticket:focus-visible { box-shadow: 0 0 0 3px #f6efe2, 0 0 0 5px var(--accent), 5px 6px 0 rgba(40, 29, 20, .2); }
        .it-ticket--water { --accent: #245bb8; --wash: #b7cdf3; }
        .it-ticket--fire { --accent: #d94d3d; --wash: #f3bcad; }
        .it-ticket--wood { --accent: #218768; --wash: #b6dfc7; }

        .it-ticket-number {
          position: absolute;
          top: 10px;
          left: 11px;
          color: var(--accent);
          font-family: "Arial Narrow", Arial, sans-serif;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .12em;
        }

        .it-ticket-seal {
          position: absolute;
          z-index: 2;
          top: 28px;
          left: 12px;
          display: grid;
          width: 31px;
          height: 31px;
          place-items: center;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: inset 0 0 0 2px rgba(255, 246, 222, .45);
          color: #fffaf0;
          font-family: Georgia, "Noto Serif KR", serif;
          font-size: 18px;
          font-weight: 500;
          transform: rotate(-8deg);
        }

        .it-ticket-rough {
          position: absolute;
          z-index: 1;
          top: 67px;
          left: 10px;
          width: 72px;
          height: 9px;
          background: #231d18;
          opacity: .8;
          clip-path: polygon(0 38%, 8% 8%, 21% 52%, 34% 0, 48% 48%, 63% 12%, 78% 59%, 91% 13%, 100% 48%, 96% 87%, 75% 75%, 61% 100%, 45% 71%, 32% 93%, 20% 63%, 4% 91%);
          transform: rotate(-5deg);
        }

        .it-ticket-art {
          position: absolute;
          z-index: 1;
          right: 8px;
          bottom: 42px;
          width: 59px;
          height: 59px;
          object-fit: contain;
          filter: sepia(.14) saturate(.9) contrast(1.05);
          opacity: .84;
          pointer-events: none;
        }

        .it-ticket--water .it-ticket-art { transform: rotate(7deg); }
        .it-ticket--fire .it-ticket-art { transform: rotate(-5deg); }
        .it-ticket--wood .it-ticket-art { transform: rotate(9deg); }

        .it-ticket-copy {
          position: absolute;
          z-index: 3;
          right: 10px;
          bottom: 13px;
          left: 12px;
          display: grid;
          gap: 3px;
          text-shadow: 0 1px 0 rgba(249, 243, 232, .82);
        }

        .it-ticket-copy small {
          color: var(--accent);
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .055em;
        }

        .it-ticket-copy strong {
          font-family: Georgia, "Noto Serif KR", serif;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -.08em;
        }

        .it-ticket-copy em { color: #6d6257; font-size: 8px; font-style: normal; font-weight: 600; }

        .it-ticket-arrow {
          position: absolute;
          z-index: 3;
          right: 10px;
          top: 11px;
          color: #211b16;
          font-family: Georgia, serif;
          font-size: 16px;
          transition: transform .2s ease;
        }
        .it-ticket:hover .it-ticket-arrow { color: var(--accent); transform: translate(2px, -2px); }

        .it-caption {
          margin: 18px 1px 0;
          color: #70655b;
          font-family: Georgia, "Noto Serif KR", serif;
          font-size: 10px;
          line-height: 1.5;
          text-align: center;
        }

        @media (max-width: 350px) {
          .it-screen { padding-right: 13px; padding-left: 13px; }
          .it-grid { gap: 8px; }
          .it-ticket { min-height: 164px; }
          .it-ticket-art { width: 53px; height: 53px; }
          .it-ticket-copy strong { font-size: 15px; }
        }
      `}</style>
    </section>
  );
}
