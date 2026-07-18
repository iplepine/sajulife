type WashiMoonProps = {
  dragon: string;
};

/**
 * A quiet, editorial dragon home concept intended to sit inside the existing
 * mobile phone frame on the dragon-direction board.
 */
export default function WashiMoon({ dragon }: WashiMoonProps) {
  return (
    <div className="washi-moon-screen">
      <div className="washi-moon-paper" aria-hidden="true" />
      <header className="washi-moon-topbar">
        <span>07.17 · THU</span>
        <b>사주언니</b>
        <span className="washi-moon-menu">···</span>
      </header>

      <section className="washi-moon-hero">
        <p className="washi-moon-kicker">THE QUIET CURRENT</p>
        <h2>
          오늘은 마음을<br />
          <em>낮게 흐르게</em> 해요.
        </h2>
        <p className="washi-moon-intro">
          급하게 답을 정하지 않아도 괜찮아요.<br />
          수룡이 당신의 속도를 고요히 지켜봐요.
        </p>
      </section>

      <div className="washi-moon-scene" aria-hidden="true">
        <i className="washi-moon-disc" />
        <i className="washi-moon-mist washi-moon-mist-one" />
        <i className="washi-moon-mist washi-moon-mist-two" />
        <div className="washi-moon-ripples">
          <i /><i /><i /><i />
        </div>
        <img src={dragon} alt="" draggable={false} />
      </div>

      <article className="washi-moon-note">
        <span><i /> 오늘의 수룡 메모</span>
        <strong>답장하기 전, 한 번만 더<br />마음의 물결을 살펴보세요.</strong>
      </article>

      <button type="button" className="washi-moon-cta">
        <span>오늘의 흐름 읽기</span>
        <b>→</b>
      </button>

      <style>{`
        .washi-moon-screen {
          position: relative;
          isolation: isolate;
          min-height: 100%;
          overflow: hidden;
          color: #262923;
          background: #e6e2d3;
          font-family: Arial, Pretendard, sans-serif;
        }
        .washi-moon-screen * { box-sizing: border-box; }
        .washi-moon-paper {
          position: absolute; inset: 0; z-index: -2; opacity: .72;
          background:
            radial-gradient(ellipse at 20% 10%, rgba(255,255,247,.88) 0 1px, transparent 1.5px) 0 0 / 9px 11px,
            radial-gradient(ellipse at 70% 35%, rgba(80,92,75,.11) 0 .7px, transparent 1.4px) 0 0 / 13px 17px,
            linear-gradient(105deg, transparent 44%, rgba(96,103,81,.055) 45%, transparent 47%) 0 0 / 7px 7px,
            #e5e1d2;
          mix-blend-mode: multiply;
        }
        .washi-moon-topbar {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 27px 20px 0;
          color: #5d6557;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .1em;
        }
        .washi-moon-topbar b { color: #30382e; font-family: Georgia, "Noto Serif KR", serif; font-size: 11px; letter-spacing: -.04em; }
        .washi-moon-menu { justify-self: end; font-size: 13px; letter-spacing: 2px; transform: translateY(-3px); }
        .washi-moon-hero { position: relative; z-index: 2; padding: 38px 24px 0; }
        .washi-moon-kicker { margin: 0 0 9px; color: #697963; font-size: 9px; font-weight: 800; letter-spacing: .16em; }
        .washi-moon-hero h2 { margin: 0; color: #273027; font-family: Georgia, "Noto Serif KR", serif; font-size: clamp(27px, 8vw, 37px); font-weight: 500; letter-spacing: -.095em; line-height: 1.08; }
        .washi-moon-hero h2 em { color: #506d69; font-style: italic; }
        .washi-moon-intro { margin: 13px 0 0; color: #60675b; font-size: 11px; line-height: 1.7; letter-spacing: -.04em; }
        .washi-moon-scene { position: relative; height: 278px; margin-top: -18px; overflow: hidden; }
        .washi-moon-disc {
          position: absolute; top: 29px; left: 50%; width: 176px; aspect-ratio: 1; border-radius: 50%;
          transform: translateX(-50%); background: #f2efdc;
          box-shadow: inset -18px -13px 25px rgba(112,129,104,.12), 0 0 0 7px rgba(241,239,219,.18);
        }
        .washi-moon-disc::after { content: ""; position:absolute; width:38px; height:17px; border-radius:50%; top:35px; right:28px; background:rgba(171,173,145,.16); transform:rotate(-28deg); }
        .washi-moon-scene img { position: absolute; z-index: 2; top: 21px; left: 50%; width: 245px; max-width: 70%; height: 223px; object-fit: contain; transform: translateX(-48%) rotate(-3deg); filter: sepia(.15) saturate(.72) contrast(.94) drop-shadow(0 15px 13px rgba(52,68,55,.16)); mix-blend-mode: multiply; }
        .washi-moon-mist { position: absolute; z-index: 1; width: 260px; height: 55px; border: 1px solid rgba(99,126,117,.19); border-radius: 50%; }
        .washi-moon-mist-one { top: 155px; left: -80px; transform: rotate(8deg); }
        .washi-moon-mist-two { top: 174px; right: -95px; transform: rotate(-9deg); }
        .washi-moon-ripples { position:absolute; z-index:3; right:-20px; bottom:22px; width:255px; height:87px; transform:rotate(-4deg); }
        .washi-moon-ripples i { position:absolute; right:0; width:100%; height:20px; border-top:1px solid rgba(55,97,99,.38); border-radius:50%; }
        .washi-moon-ripples i:nth-child(1) { top:0; width:42%; right:29px; }
        .washi-moon-ripples i:nth-child(2) { top:22px; width:71%; }
        .washi-moon-ripples i:nth-child(3) { top:44px; width:96%; right:-12px; }
        .washi-moon-ripples i:nth-child(4) { top:65px; width:74%; right:30px; border-color:rgba(55,97,99,.23); }
        .washi-moon-note { position: relative; z-index: 4; margin: -2px 19px 0; padding: 14px 15px 13px; border-left: 2px solid #718d86; background: rgba(247,245,232,.67); box-shadow: 0 5px 20px rgba(65,74,57,.06); }
        .washi-moon-note span { display:block; color:#66796e; font-size:9px; font-weight:800; letter-spacing:.1em; }
        .washi-moon-note span i { display:inline-block; width:5px; height:5px; margin:0 5px 1px 0; border-radius:50%; background:#698d82; }
        .washi-moon-note strong { display:block; margin-top:6px; color:#3e483d; font-family: Georgia, "Noto Serif KR", serif; font-size:14px; font-weight:500; line-height:1.37; letter-spacing:-.06em; }
        .washi-moon-cta { position: relative; z-index: 4; display:flex; align-items:center; justify-content:space-between; width:calc(100% - 38px); margin:14px 19px 22px; padding:15px 16px; border:0; border-radius:2px; color:#f3f0df; background:#405b58; box-shadow:0 6px 13px rgba(45,69,65,.16); font-family:Arial, Pretendard, sans-serif; font-size:12px; font-weight:700; letter-spacing:-.03em; cursor:pointer; }
        .washi-moon-cta b { font-family:Georgia, serif; font-size:20px; font-weight:400; line-height:.5; transition:transform .18s ease; }
        .washi-moon-cta:hover b { transform:translateX(4px); }
        @media (prefers-reduced-motion: no-preference) {
          .washi-moon-ripples { animation: washi-moon-swell 5s ease-in-out infinite; }
          .washi-moon-disc { animation: washi-moon-glow 6s ease-in-out infinite; }
        }
        @keyframes washi-moon-swell { 50% { transform:rotate(-4deg) translateX(-7px) translateY(2px); } }
        @keyframes washi-moon-glow { 50% { box-shadow: inset -18px -13px 25px rgba(112,129,104,.12), 0 0 0 12px rgba(241,239,219,.24); } }
      `}</style>
    </div>
  );
}
