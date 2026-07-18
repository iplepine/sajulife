"use client";

import { useState } from "react";

/** 신윤복안: 청록 밤과 주홍 인장으로 여는 '오늘의 한 줄 처방' 홈. */
export default function Prescription() {
  const [opened, setOpened] = useState(false);

  return (
    <section className="sy-prescription" aria-label="신윤복 홈 시안: 오늘의 한 줄 처방">
      <div className="sy-night-scene" aria-hidden="true">
        <div className="sy-moon" />
        <div className="sy-halo sy-halo-one" />
        <div className="sy-halo sy-halo-two" />
        <svg className="sy-garden" viewBox="0 0 380 330" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-22 192C28 158 75 199 126 183C176 167 178 123 232 131C286 139 321 199 402 152V355H-22V192Z" fill="#0A4C4F" />
          <path d="M-13 221C43 183 74 231 127 210C178 190 193 164 237 174C281 184 324 228 393 185" stroke="#69A5A0" strokeWidth="2" opacity=".75" />
          <path d="M-13 243C35 209 77 250 129 232C179 214 188 191 237 201C286 211 320 251 393 212" stroke="#C9DBC2" strokeWidth="1" opacity=".68" />
          <path d="M14 330C22 243 18 172 68 90M50 330C65 239 86 171 136 115M298 330C284 241 314 180 350 103M328 330C328 244 354 180 388 143" stroke="#142E31" strokeWidth="4" strokeLinecap="round" />
          <path d="M16 234C48 222 63 202 70 173M48 213C81 201 106 168 120 135M295 220C327 206 344 178 350 150M326 235C354 221 373 202 384 173" stroke="#D7DEBD" strokeWidth="1.2" opacity=".78" />
          <path d="M16 249C46 242 70 238 96 244M286 250C318 242 351 244 388 259" stroke="#E4DAB8" strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
          <g fill="#B84A38"><circle cx="50" cy="201" r="4" /><circle cx="70" cy="173" r="3" /><circle cx="110" cy="158" r="4" /><circle cx="326" cy="201" r="4" /><circle cx="352" cy="166" r="3" /></g>
          <path d="M-10 270C55 235 104 282 162 255C218 229 229 198 288 214C330 225 358 240 397 215" stroke="#4EC2C0" strokeWidth="3" opacity=".9" />
          <path d="M-8 282C42 250 91 293 154 269" stroke="#5FAE69" strokeWidth="5" strokeLinecap="round" opacity=".85" />
          <path d="M154 269C190 253 210 238 236 229" stroke="#E24B37" strokeWidth="5" strokeLinecap="round" opacity=".9" />
          <path d="M236 229C261 220 278 215 301 217" stroke="#D39B3A" strokeWidth="5" strokeLinecap="round" opacity=".95" />
          <path d="M301 217C323 219 346 230 376 222" stroke="#B8D2D8" strokeWidth="5" strokeLinecap="round" opacity=".95" />
        </svg>
        <svg className="sy-ink-wave" viewBox="0 0 360 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-7 67C32 24 67 91 110 53C146 21 172 23 205 56C249 100 279 18 370 41" stroke="#061F24" strokeWidth="15" strokeLinecap="round" opacity=".9" />
          <path d="M-10 82C37 43 64 105 116 73C151 51 176 47 211 70C253 98 286 47 371 61" stroke="#F0DDA7" strokeWidth="2" opacity=".75" />
        </svg>
      </div>

      <header className="sy-prescription-header">
        <span>GIJILAI · MOON GARDEN</span>
        <span>2026. 07. 18</span>
      </header>

      <div className="sy-seal" aria-label="오늘의 기운 수">
        <span>水</span>
        <small>오늘의 결</small>
      </div>

      <p className="sy-eyebrow">달빛 아래, 오늘의 처방</p>
      <h2>오늘은,<br /><em>빈틈을 남길</em><br />날이에요.</h2>
      <p className="sy-lead">좋은 대답을 서두르기보다 한 번 머문 뒤 말해보세요.<br />관계의 흐름이 더 부드러워져요.</p>

      <div className="sy-scene-caption" aria-hidden="true"><span>月下 水庭</span><i /></div>

      <div className="sy-element-flow" aria-label="목 화 토 금 수의 기운이 오늘의 수로 모입니다">
        <span className="sy-flow-label">오늘의 기운 흐름</span>
        <div className="sy-flow-river" aria-hidden="true">
          <i className="sy-flow-wood">木</i><b />
          <i className="sy-flow-fire">火</i><b />
          <i className="sy-flow-earth">土</i><b />
          <i className="sy-flow-metal">金</i><b />
          <i className="sy-flow-water">水</i>
        </div>
        <span className="sy-flow-copy">흐르며 <strong>水</strong>에 머뭅니다</span>
      </div>

      <dl className="sy-signals">
        <div><dt>기운</dt><dd><b>水</b> 회복</dd></div>
        <div><dt>관계</dt><dd>한 박자 <b>느리게</b></dd></div>
        <div><dt>시간</dt><dd>오후 <b>3:00</b></dd></div>
      </dl>

      <button className={`sy-cta${opened ? " is-open" : ""}`} type="button" onClick={() => setOpened((value) => !value)}>
        <span>{opened ? "오늘의 결을 기록했어요" : "오늘의 한 가지 받아보기"}</span><b>{opened ? "✓" : "→"}</b>
      </button>
      <p className={`sy-afterword${opened ? " is-open" : ""}`}>서두르지 않은 한 번의 대답이, 오늘의 기운을 지켜줘요.</p>

      <style>{`
        .sy-prescription { position:relative; min-height:100%; isolation:isolate; overflow:hidden; padding:20px 20px 19px; background:#063C42; color:#F7EDCF; font-family:Arial, "Noto Sans KR", sans-serif; }
        .sy-prescription::before { content:""; position:absolute; z-index:-1; inset:0; opacity:.24; background:linear-gradient(115deg, transparent 0 45%, rgba(245,222,168,.22) 45.2% 45.6%, transparent 45.8%), repeating-linear-gradient(90deg, transparent 0 47px, rgba(214,237,218,.06) 47px 48px); }
        .sy-night-scene { position:absolute; z-index:-2; inset:0; overflow:hidden; pointer-events:none; }
        .sy-moon { position:absolute; width:178px; height:178px; right:-41px; top:30px; border-radius:50%; background:radial-gradient(circle at 36% 31%, #FFF8D9 0 3%, #F0DFA6 28%, #D9BD79 67%, #A97B3F 100%); box-shadow:0 0 0 1px rgba(255,241,192,.62), 0 0 38px rgba(242,207,119,.38); }
        .sy-halo { position:absolute; right:-70px; top:1px; width:246px; height:246px; border:1px solid rgba(236,218,167,.52); border-radius:50%; }.sy-halo-two { right:-95px; top:-24px; width:294px; height:294px; border-color:rgba(236,218,167,.22); }
        .sy-garden { position:absolute; left:0; bottom:49px; width:100%; height:auto; }
        .sy-ink-wave { position:absolute; z-index:1; bottom:109px; left:-2px; width:calc(100% + 5px); opacity:.76; transform:rotate(-2deg); }
        .sy-prescription-header { position:relative; z-index:3; display:flex; justify-content:space-between; color:#BFD9CE; font-size:7px; font-weight:800; letter-spacing:.13em; }
        .sy-seal { position:absolute; z-index:4; top:43px; right:23px; display:flex; flex-direction:column; align-items:center; justify-content:center; width:51px; height:51px; border:1px solid #FFD7A0; background:#B93D2C; color:#FFE7B6; box-shadow:3px 4px 0 rgba(20,31,28,.32); transform:rotate(8deg); }.sy-seal::before { content:""; position:absolute; inset:4px; border:1px solid rgba(255,233,190,.65); }.sy-seal span { position:relative; font:25px/1 Georgia, "Noto Serif KR", serif; }.sy-seal small { position:relative; margin-top:2px; font-size:6px; letter-spacing:.12em; }
        .sy-eyebrow { position:relative; z-index:3; margin:33px 0 0; color:#F2C879; font-size:8px; font-weight:800; letter-spacing:.15em; }
        .sy-prescription h2 { position:relative; z-index:3; margin:10px 0 0; color:#FFF4D7; font:400 31px/.98 Georgia, "Noto Serif KR", serif; letter-spacing:-.1em; text-shadow:0 2px 0 rgba(2,31,35,.3); }.sy-prescription h2 em { color:#F2CB7C; font-style:normal; }
        .sy-lead { position:relative; z-index:3; margin:12px 0 0; color:#DAE8D5; font-size:10px; line-height:1.65; letter-spacing:-.035em; text-shadow:0 1px 5px #063C42; }
        .sy-scene-caption { position:absolute; z-index:3; top:227px; left:21px; display:flex; align-items:center; gap:8px; color:#F0DDA7; font:10px Georgia, "Noto Serif KR", serif; letter-spacing:.16em; transform:rotate(-6deg); }.sy-scene-caption i { display:block; width:29px; height:1px; background:#F0DDA7; }
        .sy-element-flow { position:relative; z-index:4; display:grid; grid-template-columns:auto 1fr; column-gap:9px; align-items:center; margin:91px 0 9px; padding:7px 9px 8px; border:1px solid rgba(219,228,203,.45); background:linear-gradient(90deg, rgba(4,37,49,.88), rgba(6,67,78,.74)); box-shadow:inset 3px 0 #3AB7C1; }.sy-flow-label { grid-row:span 2; color:#DDEAD7; font-size:7px; font-weight:800; letter-spacing:.04em; writing-mode:vertical-rl; }.sy-flow-river { display:flex; align-items:center; min-width:0; }.sy-flow-river i { display:grid; flex:0 0 17px; width:17px; height:17px; place-items:center; border-radius:50%; color:#072C36; font:700 10px/1 Georgia, "Noto Serif KR", serif; box-shadow:0 0 0 1px rgba(255,255,255,.18); }.sy-flow-river b { display:block; flex:1 1 8px; height:2px; min-width:4px; background:linear-gradient(90deg, currentColor, rgba(206,237,233,.35)); }.sy-flow-wood { background:#61BD79; color:#61BD79; }.sy-flow-wood + b { color:#61BD79; }.sy-flow-fire { background:#EC513D; color:#EC513D; }.sy-flow-fire + b { color:#EC513D; }.sy-flow-earth { background:#D8A343; color:#D8A343; }.sy-flow-earth + b { color:#D8A343; }.sy-flow-metal { background:#C7DCE0; color:#C7DCE0; }.sy-flow-metal + b { color:#C7DCE0; }.sy-flow-river .sy-flow-water { flex-basis:23px; width:23px; height:23px; background:#3DC6D1; color:#063C42; box-shadow:0 0 0 2px #082E39, 0 0 15px rgba(61,198,209,.8); }.sy-flow-copy { color:#C7DDD7; font-size:8px; letter-spacing:-.055em; }.sy-flow-copy strong { color:#60D5DF; font:700 12px Georgia, "Noto Serif KR", serif; }
        .sy-signals { position:relative; z-index:4; display:grid; grid-template-columns:repeat(3,1fr); gap:0; margin:0 0 13px; border-top:1px solid rgba(233,225,184,.55); border-bottom:1px solid rgba(233,225,184,.55); background:rgba(2,42,45,.34); backdrop-filter:blur(2px); }
        .sy-signals div { min-height:47px; padding:8px 4px; border-right:1px solid rgba(233,225,184,.31); }.sy-signals div:last-child { border:0; }
        .sy-signals dt { color:#AFCBC1; font-size:8px; letter-spacing:.07em; }.sy-signals dd { margin:5px 0 0; color:#F7EFCE; font-size:9px; letter-spacing:-.05em; white-space:nowrap; }.sy-signals dd b { color:#F5C46C; font-weight:800; }
        .sy-cta { position:relative; z-index:4; display:flex; align-items:center; justify-content:space-between; width:100%; min-height:43px; padding:0 14px; border:1px solid #F5C46C; background:linear-gradient(100deg, #116C83 0 23%, #3A9D68 23% 27%, #C73D31 27% 31%, #C98A2E 31% 35%, #C8DBDE 35% 39%, #B93D2C 39% 100%); color:#FFF0C7; box-shadow:4px 5px 0 #082A2E; font-size:10px; font-weight:800; cursor:pointer; transition:transform .2s ease, background .2s ease, box-shadow .2s ease; }.sy-cta:hover { transform:translate(-1px,-1px); box-shadow:6px 7px 0 #082A2E; }.sy-cta.is-open { background:#116C83; box-shadow:2px 3px 0 #082A2E; }.sy-cta b { font-size:17px; font-weight:400; }
        .sy-afterword { position:relative; z-index:4; max-height:0; margin:0; overflow:hidden; color:#F1DCA3; font:11px/1.5 Georgia, "Noto Serif KR", serif; text-align:center; transition:max-height .3s ease, margin .3s ease; }.sy-afterword.is-open { max-height:35px; margin-top:10px; }
        @media (max-width:340px) { .sy-prescription { padding-right:17px; padding-left:17px; }.sy-prescription h2 { font-size:28px; }.sy-moon { right:-56px; }.sy-signals { margin-top:106px; } }
        @media (prefers-reduced-motion: reduce) { .sy-cta,.sy-afterword { transition:none; } }
      `}</style>
    </section>
  );
}
