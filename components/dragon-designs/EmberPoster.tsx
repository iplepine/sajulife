"use client";

type EmberPosterProps = {
  dragon: string;
};

/**
 * A single-screen, tarot-poster direction for the dragon-home comparison.
 * It is designed to sit inside the existing comparison page's mobile frame.
 */
export default function EmberPoster({ dragon }: EmberPosterProps) {
  return (
    <section className="ep-screen" aria-label="Ember Poster 드래곤 홈 시안">
      <div className="ep-paper" aria-hidden="true" />
      <header className="ep-topline">
        <span>SAJULIFE / ARCANA 05</span>
        <b>오늘의 불씨</b>
      </header>

      <div className="ep-headline" aria-hidden="true">
        <span>THE</span>
        <strong>EMBER</strong>
        <span>DRAGON</span>
      </div>

      <div className="ep-card-art" aria-hidden="true">
        <span className="ep-card-number">V</span>
        <i className="ep-sun ep-sun-left" />
        <i className="ep-sun ep-sun-right" />
        <div className="ep-arch ep-arch-outer" />
        <div className="ep-arch ep-arch-inner" />
        <span className="ep-star ep-star-one">✦</span>
        <span className="ep-star ep-star-two">✦</span>
        <span className="ep-star ep-star-three">·</span>
        <img src={dragon} alt="" draggable={false} />
        <span className="ep-card-suit">火</span>
      </div>

      <div className="ep-message">
        <p>오늘의 용신 카드</p>
        <h2>
          멈춰 있던 마음에<br />
          <em>불을 붙일 시간.</em>
        </h2>
        <span>화룡은 당신의 망설임을 행동으로 바꿔줘요.</span>
      </div>

      <button type="button" className="ep-cta">
        오늘의 불씨 읽기 <b>↗</b>
      </button>

      <div className="ep-footer" aria-hidden="true">
        <span>FIRE / ACTION / COURAGE</span>
        <b>05</b>
      </div>

      <style jsx>{`
        .ep-screen {
          --ember: #ff604e;
          position: relative;
          min-height: 100%;
          overflow: hidden;
          isolation: isolate;
          padding: 0 20px 17px;
          background: #f6f0e6;
          color: #151311;
          font-family: Arial, Pretendard, sans-serif;
        }

        .ep-paper {
          position: absolute;
          z-index: -2;
          inset: 0;
          opacity: .58;
          background-image: radial-gradient(rgba(26, 20, 17, .12) .55px, transparent .7px), linear-gradient(115deg, rgba(255, 255, 255, .8), transparent 42%);
          background-position: 0 0, 0 0;
          background-size: 4px 4px, 100% 100%;
          mix-blend-mode: multiply;
        }

        .ep-topline {
          display: flex;
          position: relative;
          z-index: 2;
          align-items: center;
          justify-content: space-between;
          padding-top: 25px;
          color: #2d2925;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .085em;
        }

        .ep-topline b { color: var(--ember); }

        .ep-headline {
          position: absolute;
          z-index: 0;
          top: 49px;
          left: 50%;
          display: flex;
          width: 100%;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%);
          font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
          font-size: clamp(37px, 10.7vw, 47px);
          font-weight: 900;
          line-height: .75;
          letter-spacing: -.055em;
          pointer-events: none;
        }

        .ep-headline span:first-child { align-self: flex-start; margin-left: 28px; color: var(--ember); font-size: .42em; letter-spacing: .06em; }
        .ep-headline strong { color: #171411; font-weight: 900; }
        .ep-headline span:last-child { align-self: flex-end; margin: 2px 20px 0 0; color: var(--ember); font-size: .48em; letter-spacing: .045em; }

        .ep-card-art {
          position: relative;
          z-index: 1;
          height: 316px;
          margin: 22px -9px 0;
        }

        .ep-card-art::before,
        .ep-card-art::after {
          position: absolute;
          inset: 30px 22px 17px;
          content: "";
          border: 1px solid #211c18;
        }

        .ep-card-art::after { inset: 35px 27px 22px; border-color: var(--ember); }

        .ep-card-number, .ep-card-suit {
          position: absolute;
          z-index: 2;
          font-family: Georgia, "Noto Serif KR", serif;
          font-size: 19px;
          font-weight: 700;
          line-height: 1;
        }

        .ep-card-number { top: 40px; left: 32px; color: var(--ember); }
        .ep-card-suit { right: 32px; bottom: 29px; color: #191512; }

        .ep-card-art img {
          position: absolute;
          z-index: 1;
          top: 45px;
          left: 50%;
          width: 238px;
          max-width: 75%;
          height: 235px;
          object-fit: contain;
          transform: translateX(-50%) rotate(-8deg);
          filter: sepia(1) saturate(8) hue-rotate(320deg) contrast(1.2) brightness(.98);
          mix-blend-mode: multiply;
        }

        .ep-arch { position: absolute; z-index: 0; left: 50%; border: 1px solid var(--ember); border-bottom: 0; transform: translateX(-50%); }
        .ep-arch-outer { top: 52px; width: 174px; height: 228px; border-radius: 106px 106px 0 0; }
        .ep-arch-inner { top: 68px; width: 130px; height: 190px; border-color: #171411; border-radius: 80px 80px 0 0; }

        .ep-sun { position: absolute; z-index: 0; top: 160px; width: 42px; height: 42px; border: 1px solid #171411; border-radius: 50%; }
        .ep-sun::before, .ep-sun::after { position: absolute; top: 50%; left: 50%; width: 58px; height: 1px; content: ""; background: var(--ember); transform: translate(-50%, -50%) rotate(45deg); }
        .ep-sun::after { transform: translate(-50%, -50%) rotate(-45deg); }
        .ep-sun-left { left: 31px; }
        .ep-sun-right { right: 31px; }

        .ep-star { position: absolute; z-index: 2; color: var(--ember); font-family: Georgia, serif; }
        .ep-star-one { top: 75px; right: 40px; font-size: 20px; }
        .ep-star-two { bottom: 47px; left: 43px; font-size: 15px; color: #1b1713; }
        .ep-star-three { top: 128px; right: 59px; font-size: 33px; line-height: .4; }

        .ep-message { position: relative; z-index: 2; margin-top: -1px; }
        .ep-message p { margin: 0 0 8px; color: var(--ember); font-size: 9px; font-weight: 800; letter-spacing: .14em; }
        .ep-message h2 { margin: 0; font-family: Georgia, "Noto Serif KR", serif; font-size: 22px; font-weight: 500; line-height: 1.23; letter-spacing: -.07em; }
        .ep-message h2 em { font-style: italic; color: var(--ember); }
        .ep-message > span { display: block; margin-top: 10px; color: #625b53; font-size: 10px; line-height: 1.5; }

        .ep-cta {
          position: relative;
          z-index: 2;
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          min-height: 43px;
          margin-top: 17px;
          padding: 0 13px;
          border: 0;
          background: var(--ember);
          color: #16110f;
          font-size: 11px;
          font-weight: 800;
          text-align: left;
        }

        .ep-cta b { font-size: 18px; font-weight: 500; }
        .ep-footer { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; margin-top: 11px; color: #7a7067; font-size: 7px; font-weight: 700; letter-spacing: .07em; }
        .ep-footer b { color: var(--ember); font-size: 11px; }

        @media (max-width: 360px) {
          .ep-card-art { height: 291px; }
          .ep-card-art img { height: 215px; }
          .ep-message h2 { font-size: 20px; }
        }
      `}</style>
    </section>
  );
}
