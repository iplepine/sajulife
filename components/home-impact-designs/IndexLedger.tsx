"use client";

export default function IndexLedger() {
  const elements = [
    ["wood", "木", "시작", "42"],
    ["fire", "火", "표현", "67"],
    ["earth", "土", "중심", "81"],
    ["metal", "金", "정리", "56"],
    ["water", "水", "회복", "72"],
  ];

  return (
    <section className="hid-phone hid-ledger" aria-label="신사임당의 기록 색인 표지 시안">
      <div className="hid-ledger-grain" />
      <div className="hid-ledger-specimen" aria-hidden="true">
        <svg viewBox="0 0 310 230" fill="none">
          <path d="M244 229C227 177 220 117 239 35M212 230C203 175 173 134 103 99M206 186C149 189 88 160 45 117" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M237 89c25-18 47-10 49 8-3 21-31 27-50 11 1-7 1-13 1-19ZM201 165c-24-26-53-21-61 1 1 25 36 39 63 17 1-6 0-12-2-18ZM153 150c-30-14-54 4-50 26 9 23 43 25 60 3 1-9-2-18-10-29Z" fill="currentColor" opacity=".9" />
          <circle cx="244" cy="38" r="25" fill="#c4472c" /><circle cx="244" cy="38" r="10" stroke="#f0ddae" strokeWidth="2" />
          <path d="M54 111c-20-24-9-44 9-44 22 5 25 31 8 47-6 2-12 1-17-3Z" fill="#dbb44c" />
          <path d="M83 198c-16-17-6-36 9-38 18 5 21 25 8 39-7 3-12 3-17-1Z" fill="#c4472c" />
        </svg>
      </div>
      <header className="hid-ledger-top">
        <span>SAJULIFE</span>
        <b>2026. 07. 18</b>
      </header>
      <div className="hid-ledger-seal">土</div>
      <p className="hid-ledger-kicker">사임당 도감 · 오행 표본 018</p>
      <h2>오늘은<br /><em>중심을 지키는</em><br />하루.</h2>
      <p className="hid-ledger-summary">바깥의 속도보다 내 기준을 한 번 더 확인하면, 좋은 선택이 남아요.</p>
      <div className="hid-ledger-index" aria-label="오늘의 기운 지표">
        {elements.map(([tone, symbol, label, value]) => (
          <div key={symbol} className={`element-${tone}${symbol === "土" ? " is-main" : ""}`}>
            <span>{symbol}</span><b>{label}</b><em>{value}</em>
          </div>
        ))}
      </div>
      <div className="hid-ledger-cycle" aria-label="오행 순환">
        <span className="element-wood">木</span><i>→</i><span className="element-fire">火</span><i>→</i><span className="element-earth">土</span><i>→</i><span className="element-metal">金</span><i>→</i><span className="element-water">水</span>
      </div>
      <article className="hid-ledger-action">
        <span>01 / 오늘의 기준 · 土</span>
        <strong>새로운 일을 더하기보다<br />진행 중인 한 가지를 끝내기</strong>
        <b>기록 열기 →</b>
      </article>
      <footer><span>균형 지수</span><b>81 / 100</b><i /></footer>
    </section>
  );
}
