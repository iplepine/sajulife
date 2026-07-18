/**
 * 신윤복안 — 배너 아래의 입구를 달빛 두루마리와 관계의 산책로로 잇는다.
 * 각 리포트는 독립 카드가 아니라, 한 권의 기록을 따라 만나는 네 장면이다.
 */
const entrances = [
  {
    name: "내 사주 리포트",
    copy: "타고난 흐름을 읽는 첫 장",
    href: "/saju",
    tone: "earth",
    icon: "/yongsin-dragon-assets/sliced/icons/icon-report.png",
  },
  {
    name: "내 용신 리포트",
    copy: "내게 필요한 기운 찾기",
    href: "/saju/yongsin",
    tone: "water",
    icon: "/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png",
  },
  {
    name: "가족 사주",
    copy: "우리 사이의 온도 살피기",
    href: "/family",
    tone: "fire",
    icon: "/yongsin-dragon-assets/sliced/icons/icon-family.png",
  },
  {
    name: "내 기질 리포트",
    copy: "내 반응의 결 알아보기",
    href: "/tci",
    tone: "wood",
    icon: "/yongsin-dragon-assets/sliced/icons/icon-profile.png",
  },
] as const;

export default function MoonScroll() {
  return (
    <section className="sy-scroll" aria-label="신윤복 시안: 달빛 두루마리 리포트 입구">
      <div className="sy-scroll-grain" aria-hidden="true" />
      <div className="sy-scroll-moon" aria-hidden="true"><i /><b /></div>
      <div className="sy-scroll-calligraphy" aria-hidden="true">月<br />路</div>
      <header className="sy-scroll-header">
        <span>SAJULIFE · MOON WALK</span>
        <span>四篇 · 四景</span>
      </header>

      <div className="sy-scroll-intro">
        <p>달빛 아래, 나를 읽는 네 갈래 길</p>
        <h2>오늘은 어느<br /><em>장면</em>부터 걸어볼까요?</h2>
      </div>

      <svg className="sy-scroll-path" viewBox="0 0 360 530" fill="none" aria-hidden="true">
        <path d="M-23 76C78 29 190 71 177 151c-11 65-117 40-98 116 17 69 151 32 167 113 12 61-69 86-2 154 34 34 91 32 139 16" stroke="#A47D46" strokeWidth="1.25" strokeDasharray="2 7" opacity=".9" />
        <path d="M-22 83C82 38 180 80 169 151c-10 63-112 44-94 113 15 61 145 35 160 111 12 60-69 87-5 151 37 37 94 37 150 17" stroke="#253B39" strokeWidth="3" strokeLinecap="round" opacity=".88" />
        <path d="M-8 89C91 47 164 87 158 153c-5 52-89 48-76 106 11 52 123 42 143 107" stroke="#E3C27A" strokeWidth="1.2" opacity=".86" />
        <circle cx="35" cy="64" r="5" fill="#D6A12E" /><circle cx="118" cy="214" r="5" fill="#315EB4" /><circle cx="208" cy="357" r="5" fill="#E36A48" /><circle cx="288" cy="483" r="5" fill="#78AD86" />
      </svg>

      <div className="sy-scroll-entrances">
        {entrances.map((entry, index) => (
          <a key={entry.name} className={`sy-scroll-entry sy-scroll-${entry.tone} sy-scroll-entry-${index + 1}`} href={entry.href}>
            <span className="sy-scroll-text"><small>달빛 산책로 · {String(index + 1).padStart(2, "0")}</small><strong>{entry.name}</strong><em>{entry.copy}</em></span>
            <span className="sy-scroll-art" aria-hidden="true"><img className="sy-scroll-icon" src={entry.icon} alt="" /></span>
            <b className="sy-scroll-arrow" aria-hidden="true">↗</b>
          </a>
        ))}
      </div>

      <footer className="sy-scroll-footer"><span>달의 결을 따라, 내 안의 길을 찾습니다.</span><i>月下散策</i></footer>

      <style>{`
        .sy-scroll { --ink:#2d2923; --paper:#f7f0df; --moon:#e9d494; position:relative; min-height:100%; overflow:hidden; isolation:isolate; padding:18px 17px 18px; color:var(--ink); background:#efe4ca; font-family:Arial, Pretendard, "Noto Sans KR", sans-serif; }
        .sy-scroll * { box-sizing:border-box; }.sy-scroll-grain { position:absolute; z-index:-4; inset:0; opacity:.5; background-image:radial-gradient(rgba(58,43,24,.25) .56px, transparent .78px), repeating-linear-gradient(0deg, transparent 0 5px, rgba(115,90,50,.035) 5px 6px); background-size:4px 4px, 100% 6px; }
        .sy-scroll::before { position:absolute; z-index:-3; inset:12px 10px; border:1px solid rgba(74,59,38,.38); content:""; pointer-events:none; }.sy-scroll::after { position:absolute; z-index:-3; inset:17px 15px; border:1px solid rgba(255,252,240,.9); content:""; pointer-events:none; }
        .sy-scroll-moon { position:absolute; z-index:-2; top:33px; right:-39px; width:178px; height:178px; border:1px solid rgba(113,94,54,.46); border-radius:50%; }.sy-scroll-moon::before { position:absolute; inset:16px; border:1px dashed rgba(113,94,54,.42); border-radius:50%; content:""; }.sy-scroll-moon i { position:absolute; top:36px; left:37px; width:88px; height:88px; border-radius:50%; background:radial-gradient(circle at 38% 35%, #fff9d9 0 3%, #f5e7b6 50%, #d7b462 100%); box-shadow:0 0 24px rgba(220,182,92,.34); }.sy-scroll-moon b { position:absolute; right:15px; bottom:7px; width:50px; height:16px; border-top:3px solid rgba(45,41,35,.82); border-radius:50%; transform:rotate(-15deg); }
        .sy-scroll-calligraphy { position:absolute; z-index:-1; top:55px; right:20px; color:rgba(65,53,37,.15); font:700 60px/.73 Georgia, "Noto Serif KR", serif; letter-spacing:-.22em; transform:rotate(7deg); }
        .sy-scroll-header { position:relative; z-index:2; display:flex; justify-content:space-between; padding:0 3px; color:#7b6038; font-size:7px; font-weight:900; letter-spacing:.14em; }.sy-scroll-header span:last-child { color:#a08356; }
        .sy-scroll-intro { position:relative; z-index:2; margin:26px 10px 0; }.sy-scroll-intro p { margin:0 0 7px; color:#967442; font-size:8px; font-weight:800; letter-spacing:.05em; }.sy-scroll-intro h2 { margin:0; color:#2a2721; font:400 26px/.99 Georgia, "Noto Serif KR", serif; letter-spacing:-.13em; }.sy-scroll-intro h2 em { color:#a76c2f; font-style:normal; }
        .sy-scroll-path { position:absolute; z-index:-1; top:136px; left:0; width:100%; height:530px; overflow:visible; }.sy-scroll-entrances { position:relative; z-index:2; display:grid; gap:10px; margin-top:31px; }
        .sy-scroll-entry { --accent:#d6a12e; position:relative; display:grid; grid-template-columns:minmax(0,1fr) 45px 19px; align-items:center; min-height:76px; overflow:hidden; padding:10px 9px 10px 14px; color:var(--ink); border:1px solid color-mix(in srgb, var(--accent) 62%, #69553a); background:linear-gradient(107deg, rgba(255,252,242,.97) 0 63%, rgba(247,238,218,.87) 63%); box-shadow:3px 4px 0 rgba(73,60,40,.14); text-decoration:none; transition:transform .2s ease, box-shadow .2s ease; }.sy-scroll-entry::before { position:absolute; top:0; bottom:0; left:0; width:4px; background:var(--accent); content:""; }.sy-scroll-entry::after { position:absolute; right:-20px; bottom:-31px; width:75px; height:75px; border:1px solid color-mix(in srgb, var(--accent) 50%, transparent); border-radius:50%; content:""; }.sy-scroll-entry:hover { transform:translate(-2px,-2px); box-shadow:6px 7px 0 rgba(73,60,40,.16); }.sy-scroll-entry:focus-visible { outline:3px solid #315eb4; outline-offset:3px; }
        .sy-scroll-entry-1 { margin-right:26px; }.sy-scroll-entry-2 { margin-left:23px; }.sy-scroll-entry-3 { margin-right:11px; }.sy-scroll-entry-4 { margin-left:29px; }.sy-scroll-earth { --accent:#d29b24; }.sy-scroll-water { --accent:#315eb4; }.sy-scroll-fire { --accent:#df6046; }.sy-scroll-wood { --accent:#4c9b72; }
        .sy-scroll-text { display:block; min-width:0; padding-left:1px; }.sy-scroll-text small { display:block; margin-bottom:4px; color:color-mix(in srgb, var(--accent) 68%, #4f4333); font-size:6px; font-weight:900; letter-spacing:.055em; }.sy-scroll-text strong { display:block; overflow:hidden; font-size:13px; letter-spacing:-.08em; text-overflow:ellipsis; white-space:nowrap; }.sy-scroll-text em { display:block; overflow:hidden; margin-top:4px; color:#756854; font-size:8px; font-style:normal; letter-spacing:-.055em; text-overflow:ellipsis; white-space:nowrap; }
        .sy-scroll-art { position:relative; z-index:1; display:block; width:45px; height:45px; }.sy-scroll-icon { position:absolute; inset:0; width:45px; height:45px; object-fit:contain; filter:sepia(.25) saturate(.75) contrast(.96); }
        .sy-scroll-arrow { position:relative; z-index:3; align-self:end; padding-bottom:3px; color:var(--accent); font-family:Georgia, serif; font-size:18px; line-height:1; font-weight:400; transition:transform .2s ease; }.sy-scroll-entry:hover .sy-scroll-arrow { transform:translate(2px,-2px); }
        .sy-scroll-footer { position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; margin:19px 4px 0; padding:9px 2px 0; border-top:1px solid rgba(72,57,37,.55); color:#7c694c; font:9px/1.4 Georgia, "Noto Serif KR", serif; letter-spacing:-.04em; }.sy-scroll-footer i { color:#a35c3f; font-size:11px; font-style:normal; letter-spacing:.16em; }
        @media (max-width:340px) { .sy-scroll { padding-right:14px; padding-left:14px; }.sy-scroll-entry { grid-template-columns:minmax(0,1fr) 43px 17px; }.sy-scroll-entry-2 { margin-left:15px; }.sy-scroll-entry-4 { margin-left:20px; }.sy-scroll-text strong { font-size:12px; }.sy-scroll-art { transform:scale(.9); transform-origin:center right; } }
        @media (prefers-reduced-motion: reduce) { .sy-scroll-entry,.sy-scroll-arrow { transition:none; } }
      `}</style>
    </section>
  );
}
