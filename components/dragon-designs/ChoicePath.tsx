type ChoicePathProps = {
  dragon: string;
};

/**
 * 김홍도 시안 — 용신의 기운을 "오늘의 선택"으로 번역한 홈 화면.
 * 한 가지 행동을 빠르게 고르게 하고, 용신 신호는 그 선택의 근거로 남긴다.
 */
export default function ChoicePath({ dragon }: ChoicePathProps) {
  return (
    <section className="cp-screen" aria-label="오늘의 선택 시안">
      <div className="cp-paper-grain" aria-hidden="true" />
      <header className="cp-topbar">
        <span>07.17 · FRI</span>
        <strong>사주라이프</strong>
        <span aria-hidden="true">☰</span>
      </header>

      <main className="cp-main">
        <div className="cp-signal">
          <span className="cp-signal-dot" />
          <span>오늘의 용신</span>
          <strong>水 · 흐름을 회복할 때</strong>
        </div>

        <div className="cp-heading">
          <p>TODAY&apos;S WAYFINDER</p>
          <h1>오늘은, 결정 대신<br /><em>방향을</em> 고르세요.</h1>
        </div>

        <div className="cp-dragon-stage" aria-hidden="true">
          <i className="cp-wash cp-wash-one" />
          <i className="cp-wash cp-wash-two" />
          <i className="cp-orbit cp-orbit-one" />
          <i className="cp-orbit cp-orbit-two" />
          <span className="cp-character">水</span>
          <img src={dragon} alt="" draggable={false} />
        </div>

        <div className="cp-choice-copy">
          <span>당신의 수룡이 말해요</span>
          <strong>밀어붙이기보다<br />흐름을 먼저 만들어요.</strong>
        </div>

        <div className="cp-choices" aria-label="오늘의 선택">
          <a className="cp-choice cp-choice-active" href="/saju/timing">
            <span className="cp-choice-number">01</span>
            <span className="cp-choice-icon">↗</span>
            <strong>일의 물꼬를 터요</strong>
            <small>미뤄둔 한 가지를 시작하기</small>
          </a>
          <a className="cp-choice" href="/family">
            <span className="cp-choice-number">02</span>
            <span className="cp-choice-icon">∞</span>
            <strong>관계를 가볍게 해요</strong>
            <small>먼저 안부 한 줄 건네기</small>
          </a>
          <a className="cp-choice" href="/saju/yongsin">
            <span className="cp-choice-number">03</span>
            <span className="cp-choice-icon">◌</span>
            <strong>내 기운을 채워요</strong>
            <small>용신이 필요한 이유 보기</small>
          </a>
        </div>
      </main>

      <footer className="cp-footer">
        <span>오늘의 흐름은 오후 6시에 다시 읽어드려요.</span>
        <a href="/dashboard">오늘의 선택 이어가기 <b>→</b></a>
      </footer>

      <style>{`
        .cp-screen { position:relative; isolation:isolate; overflow:hidden; min-height:100%; color:#1c292d; background:#e9e3d6; font-family:Arial, Pretendard, sans-serif; }
        .cp-screen * { box-sizing:border-box; }
        .cp-paper-grain { position:absolute; z-index:-1; inset:0; opacity:.42; background-image:radial-gradient(rgba(31,52,51,.2) .55px, transparent .75px), linear-gradient(114deg, rgba(255,255,255,.4), transparent 35%, rgba(99,128,128,.13)); background-size:6px 6px, 100% 100%; mix-blend-mode:multiply; pointer-events:none; }
        .cp-topbar { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:23px 20px 0; font-size:9px; font-weight:800; letter-spacing:.1em; }
        .cp-topbar strong { font-family:Georgia, 'Noto Serif KR', serif; font-size:13px; font-weight:500; letter-spacing:-.06em; }
        .cp-topbar span:last-child { text-align:right; font-size:14px; letter-spacing:0; }
        .cp-main { position:relative; padding:28px 20px 21px; }
        .cp-signal { display:inline-flex; align-items:center; gap:6px; padding:7px 9px 7px 7px; border:1px solid rgba(28,41,45,.25); border-radius:99px; background:rgba(248,246,239,.56); font-size:9px; font-weight:700; letter-spacing:.025em; }
        .cp-signal strong { padding-left:5px; border-left:1px solid rgba(28,41,45,.22); color:#315f68; font-weight:800; }
        .cp-signal-dot { width:6px; height:6px; border-radius:50%; background:#277987; box-shadow:0 0 0 3px rgba(39,121,135,.15); }
        .cp-heading { position:relative; z-index:2; margin-top:22px; }
        .cp-heading p { margin:0 0 6px; color:#5d706e; font-size:8px; font-weight:800; letter-spacing:.13em; }
        .cp-heading h1 { margin:0; font-family:Georgia, 'Noto Serif KR', serif; font-size:clamp(29px, 7.9vw, 39px); font-weight:500; line-height:1.05; letter-spacing:-.085em; }
        .cp-heading em { color:#37717a; font-style:italic; }
        .cp-dragon-stage { position:absolute; z-index:1; top:60px; right:-47px; width:260px; height:263px; pointer-events:none; }
        .cp-dragon-stage img { position:absolute; z-index:2; width:244px; right:-13px; top:15px; transform:rotate(-9deg); filter:drop-shadow(5px 9px 5px rgba(19,48,50,.17)); }
        .cp-character { position:absolute; top:20px; right:109px; z-index:0; color:rgba(42,104,112,.16); font-family:Georgia, serif; font-size:140px; line-height:1; }
        .cp-wash { position:absolute; z-index:-1; display:block; border-radius:50%; background:#8eb9ba; filter:blur(1px); opacity:.35; }
        .cp-wash-one { width:178px; height:116px; top:44px; right:25px; transform:rotate(-22deg); border-radius:48% 52% 44% 56% / 42% 48% 52% 58%; }
        .cp-wash-two { width:121px; height:145px; top:71px; right:-16px; background:#6e9da1; opacity:.26; transform:rotate(21deg); }
        .cp-orbit { position:absolute; border:1px solid rgba(38,97,104,.42); border-radius:50%; transform:rotate(-30deg); }
        .cp-orbit-one { width:246px; height:109px; top:85px; right:-9px; }
        .cp-orbit-two { width:206px; height:82px; top:100px; right:7px; border-color:rgba(38,97,104,.23); }
        .cp-choice-copy { position:relative; z-index:3; width:172px; min-height:151px; padding-top:43px; }
        .cp-choice-copy span { display:block; color:#526664; font-size:9px; font-weight:800; letter-spacing:.05em; }
        .cp-choice-copy strong { display:block; margin-top:7px; font-family:Georgia, 'Noto Serif KR', serif; font-size:18px; line-height:1.2; letter-spacing:-.07em; font-weight:500; }
        .cp-choices { position:relative; z-index:4; display:grid; gap:7px; margin-top:15px; }
        .cp-choice { position:relative; display:grid; grid-template-columns:25px 22px 1fr; grid-template-rows:auto auto; gap:1px 8px; min-height:57px; padding:10px 12px; color:inherit; border:1px solid rgba(28,41,45,.21); background:rgba(251,249,243,.64); text-decoration:none; transition:transform .18s ease, box-shadow .18s ease, background .18s ease; }
        .cp-choice:hover { transform:translateX(4px); background:#faf8f1; box-shadow:-4px 5px 0 rgba(45,104,109,.18); }
        .cp-choice-active { border-color:#236773; background:#2f6d74; color:#f7f1e5; box-shadow:-4px 5px 0 #c89062; }
        .cp-choice-number { grid-row:1 / 3; padding-top:2px; font-family:Georgia, serif; font-size:14px; font-style:italic; }
        .cp-choice-icon { grid-row:1 / 3; display:grid; place-items:center; width:20px; height:20px; border:1px solid currentColor; border-radius:50%; font-size:11px; }
        .cp-choice strong { align-self:end; font-size:12px; letter-spacing:-.04em; line-height:1.1; }
        .cp-choice small { grid-column:3; color:#657371; font-size:9px; line-height:1.1; }
        .cp-choice-active small { color:#dce8e6; }
        .cp-footer { position:relative; z-index:5; display:flex; align-items:flex-end; justify-content:space-between; gap:15px; padding:13px 20px calc(17px + env(safe-area-inset-bottom)); border-top:1px solid rgba(28,41,45,.2); background:rgba(232,225,212,.75); }
        .cp-footer > span { max-width:156px; color:#6b716b; font-size:8px; line-height:1.35; }
        .cp-footer a { padding:10px 11px; color:#f9f4ea; background:#1b3439; font-size:10px; font-weight:800; letter-spacing:-.02em; text-decoration:none; box-shadow:3px 3px 0 #ca9365; }
        .cp-footer b { padding-left:5px; font-size:13px; }
        @media (max-width:360px) { .cp-main { padding-left:16px; padding-right:16px; } .cp-topbar, .cp-footer { padding-left:16px; padding-right:16px; } .cp-choice-copy { min-height:140px; } .cp-dragon-stage { right:-61px; transform:scale(.9); transform-origin:top right; } }
      `}</style>
    </section>
  );
}
