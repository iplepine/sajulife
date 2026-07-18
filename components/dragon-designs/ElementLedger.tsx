"use client";

import { useState } from "react";

type ElementLedgerProps = { dragon: string };
type LedgerView = "balance" | "practice" | "rhythm";

const SIGNALS = [
  ["木", "시작", "높음"],
  ["火", "표현", "보통"],
  ["土", "중심", "필요"],
  ["金", "정리", "낮음"],
  ["水", "회복", "보통"],
];

const RHYTHM = [
  ["월", "木", 72], ["화", "火", 58], ["수", "土", 86], ["목", "金", 42],
  ["금", "水", 61], ["토", "土", 79], ["일", "木", 68],
];

/** 신사임당: 오행의 균형을 진단·실천·기록으로 이어 주는 시스템형 홈. */
export default function ElementLedger({ dragon }: ElementLedgerProps) {
  const [view, setView] = useState<LedgerView>("balance");
  const [isDone, setIsDone] = useState(false);

  return (
    <div className="dhd-phone-screen dledger">
      <header><span>SAJULIFE / PERSONAL LEDGER</span><b>07.17</b></header>
      <div className="dledger-title-row">
        <div><p>나의 기운 장부</p><strong>오늘의 균형 기록</strong></div>
        <span className="dledger-page">0{view === "balance" ? 1 : view === "practice" ? 2 : 3} / 03</span>
      </div>
      <nav className="dledger-tabs" aria-label="기운 장부 화면">
        {(["balance", "practice", "rhythm"] as LedgerView[]).map((item) => (
          <button key={item} type="button" className={view === item ? "is-active" : ""} onClick={() => setView(item)}>
            {item === "balance" ? "균형" : item === "practice" ? "오늘 한 일" : "7일 리듬"}
          </button>
        ))}
      </nav>

      {view === "balance" && (
        <section className="dledger-panel dledger-balance">
          <p className="dledger-kicker">YOUR ELEMENTAL BALANCE</p>
          <h2>오늘의 균형은<br /><em>토</em>에서 시작돼요.</h2>
          <div className="dledger-art" aria-hidden="true">
            <span className="dledger-ring dledger-ring-a" /><span className="dledger-ring dledger-ring-b" />
            <span className="dledger-seal">土</span><img src={dragon} alt="" draggable={false} />
          </div>
          <div className="dledger-table" aria-label="오늘의 오행 신호">
            {SIGNALS.map(([symbol, label, state]) => (
              <div key={symbol} className={symbol === "土" ? "is-focus" : ""}>
                <b>{symbol}</b><span>{label}</span><em>{state}</em>
              </div>
            ))}
          </div>
          <p className="dledger-note"><b>오늘의 읽기</b> 빠른 결정 대신 기준을 한 번 더 정리할수록 중심이 단단해져요.</p>
        </section>
      )}

      {view === "practice" && (
        <section className="dledger-panel dledger-practice">
          <p className="dledger-kicker">ONE STEADY ACTION</p>
          <h2>토의 기운을<br /><em>하나만</em> 세워요.</h2>
          <div className="dledger-practice-art" aria-hidden="true"><span>土</span><img src={dragon} alt="" draggable={false} /></div>
          <article className={`dledger-task${isDone ? " is-done" : ""}`}>
            <span>오늘의 한 가지</span><strong>책상 위 한 곳만 정리하기</strong>
            <p>환경의 기준점 하나를 만들면 생각도 덜 흔들려요.</p>
            <button type="button" onClick={() => setIsDone((current) => !current)}>
              <i aria-hidden>{isDone ? "✓" : ""}</i>{isDone ? "오늘 기록됨" : "이 일 기록하기"}
            </button>
          </article>
          <p className="dledger-caption">크게 바꾸기보다, 작아도 끝낸 기록을 남겨요.</p>
        </section>
      )}

      {view === "rhythm" && (
        <section className="dledger-panel dledger-rhythm">
          <p className="dledger-kicker">SEVEN DAY RHYTHM</p>
          <h2>기운은 매일<br /><em>같지 않아요.</em></h2>
          <p className="dledger-rhythm-lead">좋고 나쁨이 아니라, 내가 힘을 쓰기 쉬운 방향을 기록해요.</p>
          <div className="dledger-chart" aria-label="7일 기운 리듬">
            {RHYTHM.map(([day, element, value]) => (
              <div key={day} className={day === "수" ? "is-today" : ""}>
                <span style={{ height: `${value}%` }}><i>{element}</i></span><b>{day}</b>
              </div>
            ))}
          </div>
          <article className="dledger-rhythm-summary"><span>이번 주의 발견</span><strong>수요일과 토요일, <em>정리·기준 세우기</em>에 힘이 모였어요.</strong></article>
          <button type="button" className="dledger-rhythm-cta">7일 기록 이어보기 <b>→</b></button>
        </section>
      )}

      <style>{`
        .dledger { min-height:100%; padding:0 18px 17px; overflow:hidden; background:#f0ecdf; color:#25241f; }
        .dledger header { color:#716c5f; }
        .dledger-title-row { display:flex; align-items:end; justify-content:space-between; margin-top:24px; }.dledger-title-row p { margin:0; color:#9a6b2d; font-size:9px; font-weight:800; letter-spacing:.1em; }.dledger-title-row strong { display:block; margin-top:4px; font:16px Georgia, "Noto Serif KR", serif; letter-spacing:-.06em; }.dledger-page { color:#827b6c; font-size:9px; letter-spacing:.08em; }
        .dledger-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:3px; margin:13px 0 0; padding-bottom:9px; border-bottom:1px solid #c9c0ab; }.dledger-tabs button { min-height:28px; border:0; background:transparent; color:#807a6d; font-size:10px; cursor:pointer; }.dledger-tabs button.is-active { color:#5d371f; font-weight:850; background:#ded4bd; }
        .dledger-panel { animation:dledger-reveal .25s ease both; }.dledger-kicker { margin:17px 0 0; color:#9a6b2d; font-size:9px; font-weight:800; letter-spacing:.12em; }.dledger h2 { position:relative; z-index:3; margin:7px 0 0; font-family:Georgia, "Noto Serif KR", serif; font-size:28px; font-weight:500; line-height:1.02; letter-spacing:-.07em; }.dledger h2 em { color:#a9692c; font-style:normal; }
        .dledger-art { position:relative; height:178px; margin:0 -18px; overflow:hidden; background:repeating-linear-gradient(0deg, transparent 0 25px, rgba(87,76,55,.08) 25px 26px), linear-gradient(135deg, #e0d6b8, #f5f1e5); }.dledger-art img { position:absolute; z-index:2; right:-5px; bottom:-18px; width:74%; filter:sepia(.26) contrast(.96); animation:dledger-drift 5s ease-in-out infinite; }.dledger-ring { position:absolute; left:53%; top:48%; border:1px solid rgba(132,102,48,.46); border-radius:50%; transform:translate(-50%,-50%); }.dledger-ring-a { width:202px; height:202px; }.dledger-ring-b { width:128px; height:128px; border-style:dashed; }.dledger-seal { position:absolute; z-index:3; display:grid; place-items:center; width:44px; height:44px; left:28px; top:51px; border:1px solid #a9692c; border-radius:3px; color:#a9692c; background:#f5f0df; font:25px Georgia,serif; transform:rotate(-8deg); }
        .dledger-table { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; margin:10px 0; }.dledger-table div { display:grid; gap:3px; min-height:54px; padding:7px 3px; border-top:1px solid #b8af97; color:#746f63; text-align:center; }.dledger-table div.is-focus { border-top:2px solid #a9692c; color:#5d371f; background:rgba(169,105,44,.09); }.dledger-table b { font:17px Georgia,serif; }.dledger-table span,.dledger-table em { font-size:8px; font-style:normal; }.dledger-table em { color:#a9692c; font-weight:800; }.dledger-note { margin:8px 0 0; padding:10px 11px; border-left:2px solid #a9692c; background:rgba(255,253,246,.48); color:#696154; font-size:10px; line-height:1.55; }.dledger-note b { display:block; color:#6c4525; font-size:9px; }
        .dledger-practice-art { position:relative; height:183px; margin:0 -18px; overflow:hidden; background:linear-gradient(145deg,#e1d3b8,#f6f1e5); }.dledger-practice-art span { position:absolute; top:16px; left:31px; color:rgba(143,95,43,.27); font:135px Georgia,serif; }.dledger-practice-art img { position:absolute; z-index:1; right:-14px; bottom:-23px; width:82%; filter:sepia(.28) contrast(.95); animation:dledger-drift 5s ease-in-out infinite reverse; }.dledger-task { margin-top:-13px; position:relative; z-index:2; padding:15px; border:1px solid #bdb299; background:#fbf8ee; box-shadow:0 7px 19px rgba(71,57,34,.09); }.dledger-task > span { color:#9a6b2d; font-size:9px; font-weight:850; letter-spacing:.1em; }.dledger-task strong { display:block; margin-top:6px; font:18px Georgia, "Noto Serif KR", serif; letter-spacing:-.07em; }.dledger-task p { margin:6px 0 11px; color:#716a5e; font-size:10px; line-height:1.5; }.dledger-task button { display:flex; align-items:center; gap:7px; width:100%; min-height:36px; border:1px solid #655c4d; background:#2c2922; color:#faf5e8; font-size:10px; font-weight:800; cursor:pointer; }.dledger-task button i { display:grid; place-items:center; width:15px; height:15px; border:1px solid #d5c8a9; font-style:normal; }.dledger-task.is-done { border-color:#7f9373; }.dledger-task.is-done button { background:#657b5d; }.dledger-caption { margin:12px 0 0; color:#7d7568; font-size:9px; text-align:center; }
        .dledger-rhythm-lead { margin:10px 0 0; color:#716a5e; font-size:10px; line-height:1.5; }.dledger-chart { display:flex; align-items:end; justify-content:space-between; height:194px; margin:18px 0 12px; padding:12px 7px 0; border-bottom:1px solid #b8af97; background:repeating-linear-gradient(0deg, transparent 0 42px, rgba(105,96,76,.1) 42px 43px); }.dledger-chart > div { display:grid; grid-template-rows:1fr auto; justify-items:center; width:28px; height:100%; }.dledger-chart span { position:relative; display:flex; align-items:start; justify-content:center; width:17px; min-height:16px; margin-top:auto; background:#b4a17c; transition:height .35s ease; }.dledger-chart span i { margin-top:-18px; color:#74603a; font:12px Georgia,serif; font-style:normal; }.dledger-chart b { margin-top:7px; color:#807a6d; font-size:9px; }.dledger-chart .is-today span { background:#a9692c; box-shadow:0 0 0 4px rgba(169,105,44,.12); }.dledger-chart .is-today b { color:#6c4525; }.dledger-rhythm-summary { padding:11px 12px; border-left:2px solid #a9692c; background:rgba(255,253,246,.48); }.dledger-rhythm-summary span { color:#9a6b2d; font-size:9px; font-weight:850; letter-spacing:.08em; }.dledger-rhythm-summary strong { display:block; margin-top:5px; font:14px Georgia, "Noto Serif KR", serif; line-height:1.35; letter-spacing:-.06em; font-weight:500; }.dledger-rhythm-summary em { color:#a9692c; font-style:normal; }.dledger-rhythm-cta { display:flex; justify-content:space-between; align-items:center; width:100%; min-height:42px; margin-top:12px; padding:0 14px; border:0; background:#25241f; color:#f5f0df; font-size:10px; font-weight:800; cursor:pointer; }.dledger-rhythm-cta b { color:#d4a54d; font-size:17px; }
        @keyframes dledger-drift { 50% { transform:translate(-5px,-5px) rotate(-1deg); } } @keyframes dledger-reveal { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } } @media (prefers-reduced-motion: reduce) { .dledger-art img,.dledger-practice-art img,.dledger-panel { animation:none; }.dledger-chart span { transition:none; } }
      `}</style>
    </div>
  );
}
