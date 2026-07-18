/**
 * 김홍도 시안 — 배너 아래의 리포트 입구를 오행 장터의 표찰로 엮는다.
 * 카드보다 목적지가 먼저 읽히도록, 각 항목을 손에 쥐는 종이 티켓처럼 다룬다.
 */
const REPORTS = [
  {
    tone: "earth",
    title: "내 사주",
    label: "타고난 흐름",
    detail: "나의 바탕 읽기",
    href: "/saju",
    icon: "/yongsin-dragon-assets/sliced/icons/icon-report.png",
  },
  {
    tone: "water",
    title: "내 용신",
    label: "필요한 기운",
    detail: "내게 맞는 방향",
    href: "/saju/yongsin",
    icon: "/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png",
  },
  {
    tone: "fire",
    title: "가족 사주",
    label: "우리 사이의 결",
    detail: "관계의 온도 읽기",
    href: "/family",
    icon: "/yongsin-dragon-assets/sliced/icons/icon-family.png",
  },
  {
    tone: "wood",
    title: "내 기질",
    label: "나의 반응",
    detail: "기질의 이유 찾기",
    href: "/tci",
    icon: "/yongsin-dragon-assets/sliced/icons/icon-profile.png",
  },
] as const;

export default function MarketTiles() {
  return (
    <section className="kh-market-tiles" aria-label="김홍도 시안: 오행 장터 리포트 입구">
      <div className="kh-market-tiles__paper" aria-hidden="true" />
      <header className="kh-market-tiles__masthead">
        <span className="kh-market-tiles__rope" aria-hidden="true" />
        <p>REPORT STALLS · SAJULIFE</p>
        <h2>어느 이야기를<br /><em>먼저 펼쳐볼까</em></h2>
        <span className="kh-market-tiles__notice">표찰을 골라<br />들어가세요 ↘</span>
      </header>

      <div className="kh-market-tiles__grid">
        {REPORTS.map((report) => (
          <a key={report.title} className={`kh-market-ticket kh-market-ticket--${report.tone}`} href={report.href}>
            <span className="kh-market-ticket__pin" aria-hidden="true" />
            <span className="kh-market-ticket__seal" aria-hidden="true" />
            <span className="kh-market-ticket__category">{report.label}</span>
            <strong>{report.title}</strong>
            <span className="kh-market-ticket__detail">{report.detail}</span>
            <img src={report.icon} alt="" draggable={false} aria-hidden="true" />
            <span className="kh-market-ticket__arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>

      <footer className="kh-market-tiles__footer">
        <span>오늘 장터의 네 가지 표찰</span>
        <b>SAJULIFE</b>
      </footer>

      <style>{`
        .kh-market-tiles { --ink:#20231f; --paper:#f6edd9; --wood:#1d9c76; --fire:#de4b38; --earth:#d49b24; --metal:#78aeb8; --water:#285eae; position:relative; isolation:isolate; min-height:100%; overflow:hidden; padding:22px 17px 17px; color:var(--ink); background:#f5ead4; font-family:Arial, Pretendard, sans-serif; }
        .kh-market-tiles * { box-sizing:border-box; }
        .kh-market-tiles__paper { position:absolute; z-index:-2; inset:0; background-image:radial-gradient(rgba(70,42,13,.22) .55px, transparent .75px), repeating-linear-gradient(0deg, transparent 0 4px, rgba(118,77,15,.045) 4px 5px); background-size:5px 5px, 100% 5px; pointer-events:none; }
        .kh-market-tiles__masthead { position:relative; min-height:118px; padding:12px 13px 15px; border:2px solid var(--ink); background:var(--earth); box-shadow:5px 5px 0 var(--ink); transform:rotate(-1deg); }
        .kh-market-tiles__masthead::after { position:absolute; right:-21px; bottom:-17px; width:118px; height:66px; border:2px solid rgba(32,35,31,.74); border-left:0; border-radius:50%; content:""; transform:rotate(-21deg); }
        .kh-market-tiles__rope { position:absolute; top:-13px; left:33px; width:152px; border-top:2px dashed var(--ink); transform:rotate(2deg); }
        .kh-market-tiles__masthead p { display:inline-block; margin:0; padding:4px 6px; color:#f8efdc; background:var(--water); font-size:8px; font-weight:900; letter-spacing:.11em; }
        .kh-market-tiles__masthead h2 { position:relative; z-index:1; margin:9px 0 0; font-family:Georgia, "Noto Serif KR", serif; font-size:29px; font-weight:900; line-height:.93; letter-spacing:-.13em; }
        .kh-market-tiles__masthead h2 em { color:var(--fire); font-style:normal; text-shadow:1px 1px 0 #f9ebca; }
        .kh-market-tiles__notice { position:absolute; z-index:2; right:10px; bottom:10px; display:grid; width:58px; height:58px; place-items:center; color:#f7edd8; border:2px solid var(--ink); border-radius:50%; background:var(--fire); box-shadow:2px 2px 0 var(--ink); font-family:Georgia, "Noto Serif KR", serif; font-size:9px; font-weight:700; line-height:1.18; text-align:center; transform:rotate(8deg); }
        .kh-market-tiles__grid { position:relative; display:grid; grid-template-columns:1fr 1fr; gap:12px 10px; margin-top:25px; }
        .kh-market-ticket { --tone:var(--earth); --wash:#fff7e4; position:relative; display:block; min-height:132px; overflow:hidden; padding:19px 11px 10px; color:var(--ink); border:2px solid var(--ink); background:var(--wash); box-shadow:3px 4px 0 rgba(32,35,31,.88); text-decoration:none; transition:transform .18s ease, box-shadow .18s ease; }
        .kh-market-ticket::before { position:absolute; top:7px; right:9px; width:43px; height:27px; border:1px solid color-mix(in srgb, var(--tone), #fff 37%); border-bottom:0; border-radius:50% 50% 0 0; content:""; transform:rotate(-13deg); }
        .kh-market-ticket::after { position:absolute; right:-22px; bottom:-21px; width:97px; height:77px; border:1px solid color-mix(in srgb, var(--tone), #fff 38%); border-radius:50%; content:""; }
        .kh-market-ticket:hover, .kh-market-ticket:focus-visible { z-index:2; outline:0; box-shadow:6px 7px 0 var(--ink); transform:translate(-2px, -3px) rotate(-1deg); }
        .kh-market-ticket--earth { --tone:var(--earth); --wash:#fff4dc; transform:rotate(-1.4deg); } .kh-market-ticket--water { --tone:var(--water); --wash:#edf3ff; transform:rotate(1deg); } .kh-market-ticket--fire { --tone:var(--fire); --wash:#fff0ea; transform:rotate(.8deg); } .kh-market-ticket--wood { --tone:var(--wood); --wash:#eaf7ee; transform:rotate(-.8deg); }
        .kh-market-ticket__pin { position:absolute; z-index:3; top:-5px; left:50%; width:11px; height:11px; border:2px solid var(--ink); border-radius:50%; background:var(--tone); box-shadow:1px 1px 0 rgba(32,35,31,.5); transform:translateX(-50%); }
        .kh-market-ticket__seal { display:grid; width:33px; height:33px; place-items:center; color:#fff8e8; border-radius:50%; background:var(--tone); box-shadow:2px 2px 0 rgba(32,35,31,.72); font-family:"Noto Serif KR", Georgia, serif; font-size:20px; font-weight:800; line-height:1; }
        .kh-market-ticket__category { display:block; margin-top:11px; color:var(--tone); font-size:8px; font-weight:900; letter-spacing:-.04em; }
        .kh-market-ticket strong { position:relative; z-index:2; display:block; margin-top:2px; font-family:Georgia, "Noto Serif KR", serif; font-size:18px; font-weight:900; letter-spacing:-.11em; }
        .kh-market-ticket__detail { position:relative; z-index:2; display:block; margin-top:4px; color:#5d5548; font-size:9px; font-weight:700; letter-spacing:-.06em; }
        .kh-market-ticket img { position:absolute; z-index:1; right:6px; bottom:9px; width:53px; height:53px; object-fit:contain; opacity:.76; filter:sepia(.15) saturate(.85); transform:rotate(-7deg); }
        .kh-market-ticket--water img { transform:rotate(5deg); } .kh-market-ticket--fire img { transform:rotate(-3deg); } .kh-market-ticket--wood img { transform:rotate(-8deg); }
        .kh-market-ticket__arrow { position:absolute; z-index:3; right:9px; bottom:8px; display:grid; width:25px; height:25px; place-items:center; color:#fff9e7; border:1px solid var(--ink); border-radius:50%; background:var(--tone); font-size:16px; font-weight:900; line-height:1; }
        .kh-market-tiles__footer { display:flex; align-items:center; justify-content:space-between; margin-top:22px; padding-top:10px; border-top:2px solid var(--ink); font-family:Georgia, "Noto Serif KR", serif; }
        .kh-market-tiles__footer span { color:#6f634e; font-size:9px; font-weight:700; letter-spacing:-.04em; } .kh-market-tiles__footer b { color:var(--water); font-size:10px; letter-spacing:.1em; }
        @media (max-width:340px) { .kh-market-tiles { padding-right:14px; padding-left:14px; } .kh-market-ticket { min-height:124px; padding-right:8px; padding-left:8px; } .kh-market-ticket strong { font-size:16px; } .kh-market-ticket img { width:47px; height:47px; } }
        @media (prefers-reduced-motion:reduce) { .kh-market-ticket { transition:none; } }
      `}</style>
    </section>
  );
}
