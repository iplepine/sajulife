"use client";

import { useEffect, useState } from "react";

type Direction = {
  id: string;
  number: string;
  guest: string;
  discipline: string;
  title: string;
  thesis: string;
  tradeoff: string;
  dragon: string;
  element: string;
};

const DIRECTIONS: Direction[] = [
  {
    id: "signal",
    number: "01",
    guest: "Mara Voss",
    discipline: "Berlin · kinetic type / moving-image artist",
    title: "Signal Dragon",
    thesis: "검은 화면 한가운데서 용신이 신호를 보내는, 가장 강한 첫 장면.",
    tradeoff: "브랜드 충격은 크지만 정보량은 의도적으로 적습니다.",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-five-elements.png",
    element: "오행의 용",
  },
  {
    id: "portal",
    number: "02",
    guest: "Leo Aranda",
    discipline: "Mexico City · contemporary poster artist",
    title: "Cobalt Portal",
    thesis: "용의 궤도를 질문의 입구로 쓰는, 대담한 아트 포스터형 홈.",
    tradeoff: "처음 보는 사람에게는 다소 낯설 수 있지만 공유 장면이 강합니다.",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-water.png",
    element: "수룡의 문",
  },
  {
    id: "relic",
    number: "03",
    guest: "Aiko Suda",
    discipline: "Tokyo · digital material / installation artist",
    title: "Soft Relic",
    thesis: "조용한 빛과 촉감 속에서 내게 필요한 기운을 ‘물건’처럼 발견하는 홈.",
    tradeoff: "차분한 대신 즉각적인 상담 CTA의 존재감은 상대적으로 낮습니다.",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-fire.png",
    element: "화룡의 온기",
  },
  {
    id: "garden",
    number: "04",
    guest: "Nia Okafor",
    discipline: "London · data collage / graphic artist",
    title: "Living Constellation",
    thesis: "오행과 오늘의 상태를 살아 있는 점·선의 생태계로 보여주는 재방문 홈.",
    tradeoff: "기능 신호가 많아 첫 방문 랜딩보다는 로그인 후 홈에 더 어울립니다.",
    dragon: "/yongsin-dragon-assets/sliced/dragons/dragon-wood.png",
    element: "목룡의 결",
  },
];

const CHOICE_KEY = "home-dragon-design-choice";

function ElementPills() {
  return (
    <div className="dhd-elements" aria-label="오행">
      <span>木</span><span>火</span><span>土</span><span>金</span><span>水</span>
    </div>
  );
}

function SignalDragon({ dragon }: Pick<Direction, "dragon">) {
  return (
    <div className="dhd-phone-screen dhd-signal">
      <div className="dhd-signal-noise" />
      <header><span>SAJULIFE / 26</span><b>용신 탐지</b></header>
      <p className="dhd-signal-index">01 / PERSONAL ENERGY</p>
      <div className="dhd-signal-art" aria-hidden="true">
        <i className="dhd-orbit dhd-orbit-one" /><i className="dhd-orbit dhd-orbit-two" />
        <span className="dhd-signal-burst">✦</span>
        <img src={dragon} alt="" draggable={false} />
      </div>
      <div className="dhd-signal-copy">
        <p>지금 너를<br /><em>깨우는 용</em>을 찾아.</p>
        <span>사주 속 균형이 필요한 지점에서<br />오늘의 선택 기준을 꺼내요.</span>
      </div>
      <button type="button" className="dhd-signal-cta">내 용 깨우기 <b>↗</b></button>
      <ElementPills />
    </div>
  );
}

function CobaltPortal({ dragon }: Pick<Direction, "dragon">) {
  return (
    <div className="dhd-phone-screen dhd-portal">
      <div className="dhd-portal-grid" />
      <header><b>SAJU / LIFE</b><span>MENU +</span></header>
      <p className="dhd-portal-label">TODAY&apos;S PORTAL — 07.16</p>
      <h2>ASK<br />THE<br /><em>DRAGON</em></h2>
      <div className="dhd-portal-art" aria-hidden="true">
        <span>水</span><i /><img src={dragon} alt="" draggable={false} />
      </div>
      <button type="button" className="dhd-portal-question">
        <small>오늘의 질문을 열어보세요</small>
        <strong>이 선택, 지금 밀어도 될까? <b>→</b></strong>
      </button>
      <div className="dhd-portal-meta"><span>사주</span><span>기질</span><span>오늘 흐름</span></div>
    </div>
  );
}

function SoftRelic({ dragon }: Pick<Direction, "dragon">) {
  return (
    <div className="dhd-phone-screen dhd-relic">
      <header><span>07 : 16</span><b>나의 보약 기운</b><span>•••</span></header>
      <div className="dhd-relic-art" aria-hidden="true">
        <i className="dhd-relic-halo" /><i className="dhd-relic-halo dhd-relic-halo-two" />
        <img src={dragon} alt="" draggable={false} />
      </div>
      <p className="dhd-relic-overline">YOUR ELEMENTAL RELIC</p>
      <h2>뜨거워진 마음에<br /><em>온도를 더해줄</em> 화룡.</h2>
      <p className="dhd-relic-desc">정답을 서두르기보다, 오늘은 마음이 가는 쪽을 한 번 더 살펴보세요.</p>
      <article className="dhd-relic-card">
        <span>오늘 이 기운을 쓰는 법</span>
        <strong>미뤄둔 사람에게 먼저 안부 묻기</strong>
        <b>열기 →</b>
      </article>
    </div>
  );
}

function LivingConstellation({ dragon }: Pick<Direction, "dragon">) {
  const nodes = ["일", "돈", "관계", "회복", "선택"];
  return (
    <div className="dhd-phone-screen dhd-garden">
      <header><span>GOOD MORNING, JIHO</span><b>☼</b></header>
      <p className="dhd-garden-overline">YOUR ENERGY GARDEN</p>
      <h2>오늘, 어디에<br /><em>힘을 줄까?</em></h2>
      <div className="dhd-garden-map" aria-hidden="true">
        <i className="dhd-garden-line dhd-garden-line-a" /><i className="dhd-garden-line dhd-garden-line-b" />
        {nodes.map((node, index) => <span key={node} className={`dhd-garden-node dhd-garden-node-${index}`}>{node}</span>)}
        <img src={dragon} alt="" draggable={false} />
      </div>
      <article className="dhd-garden-now">
        <span><i /> TODAY&apos;S SIGNAL</span>
        <strong>목룡이 <em>일의 흐름</em>을 밀어줘요.</strong>
        <p>지금 가장 신경 쓰이는 한 가지를 골라보세요.</p>
      </article>
      <button type="button" className="dhd-garden-cta">오늘의 흐름 보기 <b>→</b></button>
    </div>
  );
}

function VariantScreen({ direction }: { direction: Direction }) {
  if (direction.id === "signal") return <SignalDragon dragon={direction.dragon} />;
  if (direction.id === "portal") return <CobaltPortal dragon={direction.dragon} />;
  if (direction.id === "relic") return <SoftRelic dragon={direction.dragon} />;
  return <LivingConstellation dragon={direction.dragon} />;
}

export default function HomeDragonDesignsPage() {
  const [selected, setSelected] = useState(DIRECTIONS[0].id);
  const [chosen, setChosen] = useState<string | null>(null);
  const active = DIRECTIONS.find((item) => item.id === selected) ?? DIRECTIONS[0];

  useEffect(() => {
    const saved = window.localStorage.getItem(CHOICE_KEY);
    if (saved && DIRECTIONS.some((item) => item.id === saved)) {
      setChosen(saved);
      setSelected(saved);
    }
  }, []);

  function choose() {
    setChosen(active.id);
    window.localStorage.setItem(CHOICE_KEY, active.id);
  }

  return (
    <main className="dhd-page">
      <header className="dhd-head">
        <div>
          <p>SAJULIFE × INTERNATIONAL CONTEMPORARY GUEST STUDIO</p>
          <h1>용신을 <em>드래곤</em>으로<br />다시 그린 메인 홈</h1>
        </div>
        <div className="dhd-brief">
          <span>DESIGN BRIEF</span>
          <strong>내 사주에서 지금 필요한<br />원소를 ‘깨우는 용’으로 경험한다.</strong>
        </div>
      </header>

      <nav className="dhd-rail" aria-label="용신 드래곤 시안 선택">
        {DIRECTIONS.map((direction) => (
          <button
            type="button"
            key={direction.id}
            className={`${selected === direction.id ? "is-active" : ""}${chosen === direction.id ? " is-chosen" : ""}`}
            onClick={() => setSelected(direction.id)}
          >
            <span>{direction.number}</span><strong>{direction.title}</strong>
            {chosen === direction.id && <i>선택</i>}
          </button>
        ))}
      </nav>

      <section className="dhd-stage">
        <div className="dhd-phone-wrap">
          <div className="dhd-phone">
            <span className="dhd-speaker" aria-hidden="true" />
            <VariantScreen direction={active} />
          </div>
          <p>{active.number} · {active.element}</p>
        </div>

        <aside className="dhd-note">
          <span className="dhd-note-number">{active.number}</span>
          <p className="dhd-guest">GUEST ARTIST</p>
          <h2>{active.guest}</h2>
          <p className="dhd-discipline">{active.discipline}</p>
          <hr />
          <h3>{active.title}</h3>
          <p>{active.thesis}</p>
          <dl><dt>트레이드오프</dt><dd>{active.tradeoff}</dd></dl>
          <button type="button" className="dhd-choose" onClick={choose}>
            {chosen === active.id ? "✓ 이 방향으로 선택됨" : "이 방향을 확장하기"}
          </button>
          {chosen && chosen !== active.id && <p className="dhd-choice-hint">현재 선택: {DIRECTIONS.find((item) => item.id === chosen)?.title}</p>}
        </aside>
      </section>

      <footer className="dhd-footer">
        <span>4개의 독립 시안 · 실제 제품의 ‘용신 보기’ 진입을 공통 CTA로 유지</span>
        <span>← → 또는 위 시안 카드를 눌러 비교</span>
      </footer>

      <style>{`
        .dhd-page { min-height: 100vh; padding: 38px max(24px, env(safe-area-inset-right)) 32px max(24px, env(safe-area-inset-left)); background: #ebe8de; color: #161616; font-family: Arial, Pretendard, sans-serif; }
        .dhd-head, .dhd-rail, .dhd-stage, .dhd-footer { max-width: 1160px; margin-left: auto; margin-right: auto; }
        .dhd-head { display:flex; justify-content:space-between; align-items:flex-end; gap:32px; margin-bottom:30px; }
        .dhd-head > div > p, .dhd-brief span, .dhd-guest, .dhd-note-number { margin:0; letter-spacing:.1em; font-size:10px; font-weight:800; }
        .dhd-head h1 { margin:9px 0 0; font-family: Georgia, "Noto Serif KR", serif; font-size:clamp(34px, 5vw, 59px); line-height:.98; letter-spacing:-.07em; font-weight:500; }
        .dhd-head h1 em { color:#2c55ff; font-style:italic; }
        .dhd-brief { width:276px; padding:15px 0 3px 17px; border-left:2px solid #161616; }
        .dhd-brief strong { display:block; margin-top:8px; font-size:13px; line-height:1.55; }
        .dhd-rail { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-bottom:25px; }
        .dhd-rail button { min-height:67px; padding:11px 12px; border:1px solid #b9b6ad; background:transparent; color:#161616; text-align:left; cursor:pointer; display:grid; grid-template-columns:25px 1fr; align-items:center; column-gap:8px; transition:.16s ease; }
        .dhd-rail button:hover, .dhd-rail button.is-active { background:#161616; color:#f3f0e8; border-color:#161616; transform:translateY(-2px); }
        .dhd-rail button span { font-size:11px; font-weight:800; align-self:start; }
        .dhd-rail button strong { font-family:Georgia, serif; font-size:17px; line-height:1; font-weight:500; }
        .dhd-rail button i { grid-column:2; font-size:10px; font-style:normal; color:#9ec5ff; }
        .dhd-stage { display:grid; grid-template-columns:minmax(340px, 430px) minmax(260px, 370px); gap:clamp(32px, 7vw, 110px); align-items:center; justify-content:center; }
        .dhd-phone-wrap { text-align:center; }
        .dhd-phone { position:relative; width:min(100%, 392px); aspect-ratio: .49; margin:auto; padding:9px; border-radius:40px; background:#111; box-shadow: 0 22px 46px rgba(25,25,20,.26), inset 0 0 0 1px #565656; }
        .dhd-speaker { position:absolute; z-index:4; width:88px; height:22px; border-radius:0 0 14px 14px; background:#111; left:50%; top:9px; transform:translateX(-50%); }
        .dhd-phone-screen { position:relative; min-height:100%; overflow:hidden; border-radius:32px; text-align:left; }
        .dhd-phone-screen * { box-sizing:border-box; }
        .dhd-phone-screen header { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; padding:24px 19px 0; font-size:10px; font-weight:700; letter-spacing:.055em; }
        .dhd-phone-wrap > p { margin:10px 0 0; font-size:11px; font-weight:700; letter-spacing:.07em; }
        .dhd-note { max-width:360px; }
        .dhd-note-number { display:block; color:#2c55ff; }
        .dhd-guest { margin-top:17px; color:#6b6962; }
        .dhd-note h2 { margin:5px 0 0; font-family:Georgia, serif; font-size:31px; font-weight:500; letter-spacing:-.05em; }
        .dhd-discipline { margin:7px 0 0; color:#55524c; font-size:12px; line-height:1.4; }
        .dhd-note hr { border:0; height:1px; background:#b9b6ad; margin:24px 0; }
        .dhd-note h3 { margin:0; font-size:16px; letter-spacing:-.03em; }
        .dhd-note > p:not(.dhd-guest):not(.dhd-discipline):not(.dhd-choice-hint) { font-size:14px; line-height:1.65; margin:9px 0 0; }
        .dhd-note dl { margin:22px 0; padding:13px 0; border-top:1px solid #c9c6bd; border-bottom:1px solid #c9c6bd; }
        .dhd-note dt { font-size:10px; font-weight:800; letter-spacing:.09em; color:#69655e; }
        .dhd-note dd { margin:6px 0 0; font-size:12px; line-height:1.5; }
        .dhd-choose { width:100%; border:0; background:#161616; color:#fff; min-height:50px; font-weight:700; cursor:pointer; font-size:14px; }
        .dhd-choice-hint { margin:11px 0 0; font-size:11px; color:#2c55ff; font-weight:700; }
        .dhd-footer { display:flex; justify-content:space-between; gap:20px; padding-top:34px; margin-top:34px; border-top:1px solid #c9c6bd; font-size:11px; color:#615e57; }

        .dhd-signal { background:#141414; color:#f1eee8; padding:0 19px 17px; }
        .dhd-signal header { color:#a2ff76; }
        .dhd-signal-noise { position:absolute; inset:0; opacity:.25; background-image:linear-gradient(90deg, transparent 49%, rgba(162,255,118,.18) 50%, transparent 51%), repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,.04) 3px 4px); background-size:29px 100%, 100% 4px; }
        .dhd-signal-index { position:relative; z-index:2; margin:29px 0 0; font-size:9px; letter-spacing:.12em; color:#9e9e96; }
        .dhd-signal-art { position:relative; z-index:1; height:270px; margin:4px -10px 0; }
        .dhd-signal-art img { position:absolute; z-index:2; width:93%; left:6%; top:16px; filter:contrast(1.12) grayscale(.15); animation:dhd-float 4s ease-in-out infinite; }
        .dhd-orbit { position:absolute; left:50%; top:50%; width:213px; height:213px; transform:translate(-50%, -50%) rotate(-14deg); border:1px solid rgba(162,255,118,.65); border-radius:50%; }
        .dhd-orbit-two { width:145px; height:275px; border-color:rgba(126,144,255,.7); transform:translate(-50%, -50%) rotate(35deg); }
        .dhd-signal-burst { position:absolute; z-index:3; top:44px; right:21px; color:#a2ff76; font-size:30px; animation:dhd-pulse 1.8s ease-in-out infinite; }
        .dhd-signal-copy { position:relative; z-index:2; }
        .dhd-signal-copy p { margin:0; font-family:Georgia, "Noto Serif KR", serif; font-size:29px; line-height:.98; letter-spacing:-.07em; }
        .dhd-signal-copy em { color:#a2ff76; font-style:italic; }
        .dhd-signal-copy span { display:block; margin-top:13px; font-size:11px; line-height:1.55; color:#b4b2aa; }
        .dhd-signal-cta { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; width:100%; min-height:48px; margin-top:18px; border:0; border-radius:24px; padding:0 17px; background:#a2ff76; color:#111; font-size:13px; font-weight:800; cursor:pointer; }
        .dhd-signal-cta b { font-size:18px; }
        .dhd-elements { position:relative; z-index:2; display:flex; justify-content:space-between; margin-top:17px; }
        .dhd-elements span { display:grid; place-items:center; width:24px; height:24px; border:1px solid #4d4d49; border-radius:50%; font-size:10px; color:#a4a49c; }

        .dhd-portal { background:#2c55ff; color:#f9f4e7; padding:0 19px 17px; }
        .dhd-portal-grid { position:absolute; inset:0; opacity:.4; background:linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px); background-size:25px 25px; mask-image:linear-gradient(to bottom, #000 0 48%, transparent 76%); }
        .dhd-portal-label { position:relative; z-index:2; margin:32px 0 0; font-size:9px; letter-spacing:.1em; }
        .dhd-portal h2 { position:relative; z-index:2; margin:9px 0 0; font-size:52px; line-height:.76; letter-spacing:-.1em; }
        .dhd-portal h2 em { color:#ff6938; font-family:Georgia, serif; font-weight:400; }
        .dhd-portal-art { position:relative; z-index:1; height:261px; margin:-17px -20px 0; overflow:hidden; }
        .dhd-portal-art i { position:absolute; border:20px solid #ff6938; width:230px; height:230px; border-radius:50%; left:52px; top:21px; }
        .dhd-portal-art span { position:absolute; z-index:3; top:9px; left:35px; font:116px Georgia,serif; color:#f8efde; }
        .dhd-portal-art img { position:absolute; z-index:2; width:113%; bottom:-8px; left:1px; transform:rotate(-5deg); filter:contrast(1.08); animation:dhd-sway 4.4s ease-in-out infinite; }
        .dhd-portal-question { position:relative; z-index:3; display:block; width:100%; padding:13px 15px; border:1px solid #f9f4e7; background:#f9f4e7; color:#191919; text-align:left; cursor:pointer; }
        .dhd-portal-question small { display:block; font-size:9px; color:#6f6b64; margin-bottom:5px; }
        .dhd-portal-question strong { display:flex; justify-content:space-between; font-size:13px; }
        .dhd-portal-question b { color:#2c55ff; font-size:18px; }
        .dhd-portal-meta { position:relative; z-index:2; display:flex; gap:12px; margin-top:15px; font-size:9px; font-weight:700; }
        .dhd-portal-meta span::before { content:"✦"; margin-right:4px; color:#ff6938; }

        .dhd-relic { background:#f5c6b8; color:#45261f; padding:0 19px 20px; }
        .dhd-relic header { color:#8e4f42; }
        .dhd-relic-art { position:relative; height:282px; margin:0 -19px; overflow:hidden; }
        .dhd-relic-art img { position:absolute; z-index:3; width:95%; top:15px; left:5%; filter:sepia(.2) contrast(.92); animation:dhd-float 5s ease-in-out infinite reverse; }
        .dhd-relic-halo { position:absolute; width:288px; height:288px; border-radius:45% 55% 52% 48%; left:54px; top:-2px; background:#ef6e52; opacity:.62; transform:rotate(24deg); }
        .dhd-relic-halo-two { width:190px; height:190px; top:75px; left:-43px; background:#ffe4b6; opacity:.85; }
        .dhd-relic-overline { margin:0; font-size:9px; letter-spacing:.1em; color:#a45b4b; font-weight:800; }
        .dhd-relic h2 { margin:8px 0 0; font-family:Georgia, "Noto Serif KR", serif; font-size:26px; line-height:1.08; letter-spacing:-.065em; font-weight:500; }
        .dhd-relic h2 em { font-style:italic; color:#ce4934; }
        .dhd-relic-desc { margin:10px 0 0; font-size:11px; line-height:1.55; color:#714135; }
        .dhd-relic-card { position:relative; margin-top:15px; padding:14px; background:rgba(255,245,230,.72); border-radius:16px; }
        .dhd-relic-card span { display:block; color:#a45b4b; font-size:9px; font-weight:800; }
        .dhd-relic-card strong { display:block; margin-top:5px; font-size:13px; }
        .dhd-relic-card b { position:absolute; right:13px; bottom:13px; font-size:11px; color:#ce4934; }

        .dhd-garden { background:#d7e6d0; color:#193c2e; padding:0 19px 17px; }
        .dhd-garden header { color:#386c54; }
        .dhd-garden-overline { margin:32px 0 0; font-size:9px; letter-spacing:.1em; font-weight:800; color:#5c896e; }
        .dhd-garden h2 { margin:8px 0 0; font-family:Georgia, "Noto Serif KR", serif; font-size:31px; line-height:.95; letter-spacing:-.07em; font-weight:500; }
        .dhd-garden h2 em { font-style:italic; color:#d6573c; }
        .dhd-garden-map { position:relative; height:258px; margin:0 -19px; overflow:hidden; background:radial-gradient(circle at 54% 55%, #f6eead 0 13%, transparent 14%), radial-gradient(circle at 62% 37%, rgba(50,105,80,.25) 0 2px, transparent 3px); }
        .dhd-garden-map img { position:absolute; width:76%; z-index:2; right:-10px; top:19px; transform:rotate(5deg); filter:contrast(1.02); animation:dhd-sway 5s ease-in-out infinite; }
        .dhd-garden-line { position:absolute; width:220px; height:1px; background:#509274; transform-origin:left; left:28px; top:134px; }
        .dhd-garden-line-a { transform:rotate(-29deg); }.dhd-garden-line-b { transform:rotate(23deg); width:260px; }
        .dhd-garden-node { position:absolute; z-index:3; display:grid; place-items:center; width:42px; height:42px; border-radius:50%; border:1px solid #509274; background:#e9efd9; font-size:10px; font-weight:800; }
        .dhd-garden-node-0 { left:23px; top:104px; }.dhd-garden-node-1 { left:82px; top:43px; }.dhd-garden-node-2 { left:176px; top:39px; }.dhd-garden-node-3 { left:56px; top:185px; }.dhd-garden-node-4 { right:25px; bottom:36px; background:#d6573c; color:#fff; border-color:#d6573c; }
        .dhd-garden-now { padding:12px 0 10px; border-top:1px solid rgba(25,60,46,.3); }
        .dhd-garden-now span { font-size:9px; letter-spacing:.08em; font-weight:800; color:#5c896e; }.dhd-garden-now span i { display:inline-block; width:6px; height:6px; margin-right:5px; border-radius:50%; background:#d6573c; }
        .dhd-garden-now strong { display:block; margin-top:7px; font-size:14px; }.dhd-garden-now strong em { color:#d6573c; font-style:normal; }.dhd-garden-now p { margin:5px 0 0; font-size:10px; color:#52715f; }
        .dhd-garden-cta { display:flex; justify-content:space-between; align-items:center; width:100%; min-height:45px; padding:0 15px; border:0; border-radius:3px; background:#193c2e; color:#eff4e5; font-size:12px; font-weight:800; cursor:pointer; }.dhd-garden-cta b { font-size:17px; }
        @keyframes dhd-float { 50% { transform:translateY(-8px) rotate(1.5deg); } } @keyframes dhd-sway { 50% { transform:rotate(-3deg) translateY(-5px); } } @keyframes dhd-pulse { 50% { transform:scale(1.3) rotate(25deg); } }
        @media (prefers-reduced-motion: reduce) { .dhd-phone-screen img, .dhd-signal-burst { animation:none !important; } }
        @media (max-width: 720px) { .dhd-page { padding-top:25px; }.dhd-head { display:block; }.dhd-head h1 { font-size:38px; }.dhd-brief { width:auto; margin-top:24px; }.dhd-rail { grid-template-columns:repeat(2, 1fr); }.dhd-stage { grid-template-columns:1fr; gap:28px; }.dhd-note { width:min(100%,392px); margin:auto; }.dhd-footer { display:block; line-height:1.7; }.dhd-footer span { display:block; }.dhd-footer span + span { margin-top:4px; } }
      `}</style>
    </main>
  );
}
