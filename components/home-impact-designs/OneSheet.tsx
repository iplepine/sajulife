/**
 * 김홍도 시안 — 장터의 활기와 생활 풍속을 한 장의 판화 포스터로 만든 홈.
 * 수치는 배경으로 물리고, 오늘 할 일을 크게 내거는 행동 중심 화면이다.
 */
export default function OneSheet() {
  return (
    <section className="kh-sheet" aria-label="김홍도 홈 시안: 오늘의 한 장">
      <div className="kh-paper" aria-hidden="true" />
      <div className="kh-radiance" aria-hidden="true">
        {Array.from({ length: 22 }, (_, index) => <i key={index} />)}
      </div>
      <div className="kh-ink-sweep kh-ink-sweep-one" aria-hidden="true" />
      <div className="kh-ink-sweep kh-ink-sweep-two" aria-hidden="true" />

      <header className="kh-topbar">
        <span className="kh-date">2026. 07. 18 · 금요일</span>
        <strong>사주언니 기질오빠</strong>
        <span className="kh-market-no">오행장 01</span>
      </header>

      <main className="kh-main">
        <div className="kh-stall-sign">
          <span className="kh-stall-seal">今日</span>
          <span>오늘의<br /><b>운세 장터</b></span>
          <i aria-hidden="true">↘</i>
        </div>

        <div className="kh-element-stalls" aria-label="오늘 장터의 오행 기운">
          <span className="kh-element-wood"><b>木</b> 비취 · 정리</span>
          <span className="kh-element-fire"><b>火</b> 주홍 · 표현</span>
          <span className="kh-element-earth"><b>土</b> 황토 · 중심</span>
          <span className="kh-element-metal"><b>金</b> 은청 · 기준</span>
          <span className="kh-element-water"><b>水</b> 군청 · 흐름</span>
        </div>

        <div className="kh-poster-heading">
          <p>손에 잡히는 한 가지를 고르는 날</p>
          <h1>오늘은<br /><em>기준</em>을 세워요</h1>
          <span className="kh-edition">ONE DAY · ONE MOVE</span>
        </div>

        <div className="kh-woodcut" aria-hidden="true">
          <span className="kh-woodcut-word">定</span>
          <span className="kh-woodcut-dot" />
          <svg viewBox="0 0 264 264" fill="none">
            <circle cx="132" cy="132" r="91" stroke="currentColor" strokeWidth="2" />
            <circle cx="132" cy="132" r="68" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
            <path d="M46 163c20-55 58-85 111-90M74 205c38-42 88-57 146-41M56 111c29-22 65-34 109-26M106 47c42 8 78 36 100 73" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
            <path d="M45 165c20-56 61-84 113-91M74 206c35-44 91-58 146-42" stroke="#d93627" strokeWidth="3" strokeLinecap="round" />
            <circle cx="132" cy="132" r="12" fill="currentColor" />
          </svg>
        </div>

        <p className="kh-summary">남의 속도에 맞추려 하기보다, 내가 지킬 기준 하나를 먼저 정하면 오후가 편안해져요.</p>

        <section className="kh-action" aria-label="오늘의 우선 행동">
          <div className="kh-action-bill">
            <span>금일</span>
            <b>01</b>
            <small>今日之行</small>
          </div>
          <div className="kh-action-copy">
            <span>오늘의 우선 행동</span>
            <strong>오후 2시 전,<br />미뤄둔 결정 하나 적어두기</strong>
          </div>
          <span className="kh-arrow" aria-hidden="true">→</span>
        </section>

        <div className="kh-signals" aria-label="오늘의 맥락 지표">
          <div className="kh-signal-water"><small><i>水</i> 나의 흐름</small><b>72 <em>↑</em></b><span>마음은 고르게</span></div>
          <div className="kh-signal-fire"><small><i>火</i> 관계 온도</small><b>+4</b><span>말은 또렷하게</span></div>
          <div className="kh-signal-metal"><small><i>金</i> 좋은 시간</small><b>14:00</b><span>결정은 가볍게</span></div>
        </div>
      </main>

      <footer className="kh-footer">
        <span>장터 안쪽에는 오늘의 이유가 더 있어요.</span>
        <a href="/saju/timing">오늘의 사주 보기 <i>→</i></a>
      </footer>

      <style>{`
        .kh-sheet { --kh-wood:#078a70; --kh-fire:#db402e; --kh-earth:#d39a25; --kh-metal:#91bdca; --kh-water:#163d70; --kh-ink:#1d2522; position:relative; isolation:isolate; min-height:100%; overflow:hidden; color:#191714; background:var(--kh-earth); font-family:Arial, Pretendard, sans-serif; }
        .kh-sheet * { box-sizing:border-box; }
        .kh-paper { position:absolute; z-index:-5; inset:0; opacity:.42; background-image:radial-gradient(rgba(47,29,8,.42) .58px, transparent .8px), repeating-linear-gradient(0deg, transparent 0 3px, rgba(122,78,12,.07) 3px 4px); background-size:4px 4px, 100% 4px; mix-blend-mode:multiply; pointer-events:none; }
        .kh-radiance { position:absolute; z-index:-4; top:-18px; right:-101px; width:358px; height:358px; opacity:.96; }
        .kh-radiance i { position:absolute; top:50%; left:50%; display:block; width:8px; height:196px; margin:-196px 0 0 -4px; transform-origin:4px 196px; background:linear-gradient(to top, var(--kh-fire) 0 54%, transparent 55%); }
        .kh-radiance i:nth-child(5n+1) { background:linear-gradient(to top, var(--kh-wood) 0 54%, transparent 55%); } .kh-radiance i:nth-child(5n+2) { background:linear-gradient(to top, var(--kh-fire) 0 54%, transparent 55%); } .kh-radiance i:nth-child(5n+3) { background:linear-gradient(to top, var(--kh-earth) 0 54%, transparent 55%); } .kh-radiance i:nth-child(5n+4) { background:linear-gradient(to top, var(--kh-metal) 0 54%, transparent 55%); } .kh-radiance i:nth-child(5n) { background:linear-gradient(to top, var(--kh-water) 0 54%, transparent 55%); }
        .kh-radiance i:nth-child(1) { transform:rotate(0deg); } .kh-radiance i:nth-child(2) { transform:rotate(16deg); } .kh-radiance i:nth-child(3) { transform:rotate(32deg); } .kh-radiance i:nth-child(4) { transform:rotate(48deg); } .kh-radiance i:nth-child(5) { transform:rotate(64deg); } .kh-radiance i:nth-child(6) { transform:rotate(80deg); } .kh-radiance i:nth-child(7) { transform:rotate(96deg); } .kh-radiance i:nth-child(8) { transform:rotate(112deg); } .kh-radiance i:nth-child(9) { transform:rotate(128deg); } .kh-radiance i:nth-child(10) { transform:rotate(144deg); } .kh-radiance i:nth-child(11) { transform:rotate(160deg); } .kh-radiance i:nth-child(12) { transform:rotate(176deg); } .kh-radiance i:nth-child(13) { transform:rotate(192deg); } .kh-radiance i:nth-child(14) { transform:rotate(208deg); } .kh-radiance i:nth-child(15) { transform:rotate(224deg); } .kh-radiance i:nth-child(16) { transform:rotate(240deg); } .kh-radiance i:nth-child(17) { transform:rotate(256deg); } .kh-radiance i:nth-child(18) { transform:rotate(272deg); } .kh-radiance i:nth-child(19) { transform:rotate(288deg); } .kh-radiance i:nth-child(20) { transform:rotate(304deg); } .kh-radiance i:nth-child(21) { transform:rotate(320deg); } .kh-radiance i:nth-child(22) { transform:rotate(336deg); }
        .kh-ink-sweep { position:absolute; z-index:-3; height:17px; background:var(--kh-water); border-radius:70% 20% 60% 15%; opacity:.94; transform:rotate(-18deg); filter:drop-shadow(4px 4px 0 rgba(25,23,20,.16)); }
        .kh-ink-sweep-one { top:206px; right:-47px; width:237px; } .kh-ink-sweep-two { top:222px; right:-21px; width:173px; height:7px; transform:rotate(-24deg); }
        .kh-topbar { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; padding:17px 18px 0; color:#1a1915; font-size:8px; font-weight:900; letter-spacing:.045em; }
        .kh-topbar strong { padding:5px 8px; color:#f9e8b5; background:var(--kh-water); font-family:Georgia, 'Noto Serif KR', serif; font-size:12px; font-weight:500; letter-spacing:-.09em; box-shadow:3px 3px 0 var(--kh-fire); }
        .kh-market-no { justify-self:end; color:var(--kh-water); font-size:8px; text-transform:uppercase; }
        .kh-main { position:relative; padding:25px 18px 16px; }
        .kh-stall-sign { position:relative; z-index:2; display:flex; align-items:center; width:164px; gap:7px; padding:7px 8px 7px 6px; color:#f8e7b8; background:var(--kh-fire); border:2px solid var(--kh-ink); box-shadow:5px 5px 0 var(--kh-ink); font-family:Georgia, 'Noto Serif KR', serif; font-size:11px; line-height:1.02; letter-spacing:-.07em; transform:rotate(-2deg); }
        .kh-stall-sign b { font-size:15px; font-weight:700; } .kh-stall-sign i { margin-left:auto; color:var(--kh-earth); font-family:Arial, sans-serif; font-size:19px; font-style:normal; }
        .kh-stall-seal { display:grid; width:30px; height:30px; flex:none; place-items:center; color:var(--kh-water); background:var(--kh-metal); border:1px solid var(--kh-water); font-family:'Noto Serif KR', Georgia, serif; font-size:13px; font-weight:900; transform:rotate(-7deg); }
        .kh-element-stalls { position:relative; z-index:2; display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); width:100%; margin:16px 0 -3px; border:1px solid rgba(29,37,34,.68); background:rgba(248,232,183,.63); transform:rotate(-.6deg); }
        .kh-element-stalls span { min-width:0; padding:4px 2px 3px; border-top:4px solid currentColor; color:var(--kh-ink); font-size:6px; font-weight:800; line-height:1.12; letter-spacing:-.07em; text-align:center; white-space:nowrap; } .kh-element-stalls span + span { border-left:1px solid rgba(29,37,34,.35); } .kh-element-stalls b { display:block; margin-bottom:1px; font-family:'Noto Serif KR', Georgia, serif; font-size:12px; line-height:1; }
        .kh-element-stalls .kh-element-wood { color:var(--kh-wood); } .kh-element-stalls .kh-element-fire { color:var(--kh-fire); } .kh-element-stalls .kh-element-earth { color:#785314; } .kh-element-stalls .kh-element-metal { color:#467c8c; } .kh-element-stalls .kh-element-water { color:var(--kh-water); }
        .kh-poster-heading { position:relative; z-index:2; margin-top:24px; }
        .kh-poster-heading p { display:inline-block; margin:0 0 7px; padding:3px 5px; color:var(--kh-water); background:var(--kh-metal); font-size:8px; font-weight:900; letter-spacing:-.03em; transform:rotate(1.2deg); }
        .kh-poster-heading h1 { margin:0; color:#191714; font-family:Georgia, 'Noto Serif KR', serif; font-size:clamp(42px, 11vw, 51px); font-weight:800; line-height:.91; letter-spacing:-.15em; text-shadow:2px 2px 0 #f4d770; }
        .kh-poster-heading h1 em { position:relative; color:var(--kh-metal); font-style:normal; text-shadow:2px 2px 0 var(--kh-water); } .kh-poster-heading h1 em::after { position:absolute; right:-3px; bottom:-5px; left:3px; height:5px; background:var(--kh-water); content:''; transform:rotate(-3deg); }
        .kh-edition { display:block; margin:11px 0 0 4px; color:var(--kh-water); font-size:8px; font-weight:900; letter-spacing:.15em; }
        .kh-woodcut { position:absolute; z-index:1; top:121px; right:-48px; width:225px; height:225px; color:var(--kh-water); transform:rotate(-8deg); }
        .kh-woodcut svg { position:absolute; inset:0; width:100%; height:100%; opacity:.91; }
        .kh-woodcut-word { position:absolute; z-index:1; top:77px; left:81px; display:grid; width:68px; height:68px; place-items:center; color:var(--kh-water); border:3px solid var(--kh-fire); background:var(--kh-metal); font-family:'Noto Serif KR', Georgia, serif; font-size:45px; font-weight:900; line-height:1; transform:rotate(8deg); }
        .kh-woodcut-dot { position:absolute; z-index:1; top:160px; right:33px; width:15px; height:15px; background:var(--kh-wood); border:3px solid var(--kh-water); border-radius:50%; }
        .kh-summary { position:relative; z-index:2; width:185px; margin:23px 0 0; padding-left:10px; color:#3b2f1b; border-left:3px solid var(--kh-wood); font-size:10px; font-weight:700; line-height:1.55; letter-spacing:-.06em; }
        .kh-action { position:relative; z-index:3; display:grid; grid-template-columns:46px 1fr auto; gap:10px; align-items:center; margin-top:21px; padding:9px 10px 9px 0; color:#f7e3ad; background:var(--kh-water); border:2px solid var(--kh-ink); box-shadow:6px 6px 0 var(--kh-fire); text-decoration:none; }
        .kh-action::before { position:absolute; top:-7px; right:17px; width:46px; height:10px; background:var(--kh-metal); content:''; transform:rotate(-3deg); }
        .kh-action-bill { align-self:stretch; display:flex; flex-direction:column; align-items:center; justify-content:center; border-right:1px solid rgba(247,227,173,.45); color:var(--kh-metal); font-family:'Noto Serif KR', Georgia, serif; line-height:1; }
        .kh-action-bill span { font-size:9px; } .kh-action-bill b { margin:2px 0; font-family:Georgia, serif; font-size:22px; font-style:italic; } .kh-action-bill small { color:#d8b65a; font-size:7px; }
        .kh-action-copy span { display:block; color:var(--kh-metal); font-size:9px; font-weight:900; letter-spacing:-.02em; } .kh-action-copy strong { display:block; margin-top:4px; font-family:Georgia, 'Noto Serif KR', serif; font-size:15px; font-weight:500; line-height:1.13; letter-spacing:-.08em; }
        .kh-arrow { display:grid; width:29px; height:29px; place-items:center; color:var(--kh-water); background:var(--kh-metal); border-radius:50%; font-size:18px; font-weight:900; }
        .kh-signals { position:relative; z-index:2; display:grid; grid-template-columns:repeat(3, 1fr); margin-top:24px; border-top:2px solid #1d2522; border-bottom:2px solid #1d2522; }
        .kh-signals div { min-width:0; padding:9px 7px 8px 0; } .kh-signals div + div { padding-left:8px; border-left:1px solid rgba(29,37,34,.45); }
        .kh-signals small, .kh-signals span { display:block; overflow:hidden; color:#59421b; font-size:8px; font-weight:800; letter-spacing:-.06em; text-overflow:ellipsis; white-space:nowrap; }
        .kh-signals b { display:block; margin:4px 0 2px; color:#1d2522; font-family:Georgia, 'Noto Serif KR', serif; font-size:17px; letter-spacing:-.07em; } .kh-signals b em { color:var(--kh-water); font-size:12px; font-style:normal; }
        .kh-signals small i { display:inline-grid; width:13px; height:13px; place-items:center; margin-right:2px; color:#f9e8b5; border-radius:50%; font-family:'Noto Serif KR', Georgia, serif; font-size:8px; font-style:normal; line-height:1; } .kh-signal-water small { color:var(--kh-water); } .kh-signal-fire small { color:var(--kh-fire); } .kh-signal-metal small { color:#467c8c; } .kh-signal-water small i { background:var(--kh-water); } .kh-signal-fire small i { background:var(--kh-fire); } .kh-signal-metal small i { background:#467c8c; } .kh-signal-water b { color:var(--kh-water); } .kh-signal-fire b { color:var(--kh-fire); } .kh-signal-metal b { color:#467c8c; }
        .kh-footer { position:relative; z-index:3; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 18px calc(14px + env(safe-area-inset-bottom)); color:#f6e3b1; background:var(--kh-fire); border-top:2px solid var(--kh-ink); }
        .kh-footer span { max-width:136px; font-family:'Noto Serif KR', Georgia, serif; font-size:9px; font-weight:700; line-height:1.4; letter-spacing:-.05em; }
        .kh-footer a { flex:none; padding:9px 9px; color:var(--kh-water); background:var(--kh-metal); border:2px solid var(--kh-ink); box-shadow:3px 3px 0 var(--kh-ink); font-size:10px; font-weight:900; letter-spacing:-.06em; text-decoration:none; } .kh-footer a i { padding-left:3px; font-size:13px; font-style:normal; }
        @media (max-width:360px) { .kh-topbar, .kh-main, .kh-footer { padding-left:15px; padding-right:15px; } .kh-poster-heading h1 { font-size:40px; } .kh-woodcut { right:-61px; } .kh-summary { margin-top:18px; } .kh-action-copy strong { font-size:14px; } }
      `}</style>
    </section>
  );
}
