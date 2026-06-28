export default function Variant2() {
  return (
    <div className="hrv2-root">
      <style>{`
        .hrv2-root {
          width: 100%;
          min-height: 100%;
          background: var(--bg, #f7f4ee);
          color: var(--text, #1f1d1a);
          font-family: var(--font, "Pretendard", system-ui, sans-serif);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .hrv2-cover {
          position: relative;
          width: 100%;
          background: #1b1814;
          color: #f4efe6;
          overflow: hidden;
          padding-bottom: var(--space-5, 28px);
        }
        .hrv2-cover::after {
          content: "";
          position: absolute;
          inset: 0;
          background: var(--grain, none);
          opacity: 0.06;
          pointer-events: none;
          mix-blend-mode: overlay;
        }
        .hrv2-masthead {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 20px 10px;
          border-bottom: 1px solid rgba(244,239,230,0.22);
        }
        .hrv2-logo {
          font-family: var(--font-brand-serif, "Noto Serif KR", serif);
          font-size: 25px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #f4efe6;
        }
        .hrv2-logo span {
          color: #d9893f;
          font-style: italic;
          margin: 0 1px;
        }
        .hrv2-issue {
          flex-shrink: 0;
          text-align: right;
          font-size: 10px;
          line-height: 1.45;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(244,239,230,0.66);
          font-weight: 600;
        }
        .hrv2-issue b {
          display: block;
          color: #f4efe6;
          font-weight: 700;
          letter-spacing: 0.2em;
        }
        .hrv2-stage {
          position: relative;
          z-index: 2;
          padding: 16px 20px 0;
        }
        .hrv2-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #e0a45c;
          margin-bottom: 14px;
        }
        .hrv2-kicker::before {
          content: "";
          width: 18px;
          height: 1px;
          background: #d9893f;
        }
        .hrv2-headline {
          font-family: var(--font-brand-serif, "Noto Serif KR", serif);
          font-weight: 700;
          font-size: 46px;
          line-height: 1.07;
          letter-spacing: -0.025em;
          margin: 0;
          color: #f7f2e9;
          text-wrap: balance;
        }
        .hrv2-headline em {
          font-style: italic;
          color: #e9b873;
          position: relative;
        }
        .hrv2-headline u {
          text-decoration: none;
          border-bottom: 4px solid #c2483c;
          padding-bottom: 1px;
        }
        .hrv2-dek {
          margin: 18px 0 4px;
          max-width: 290px;
          font-family: var(--font-serif, "Gowun Batang", serif);
          font-size: 14.5px;
          line-height: 1.62;
          color: rgba(244,239,230,0.82);
        }
        .hrv2-portrait {
          position: relative;
          z-index: 1;
          margin-top: 18px;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .hrv2-portrait img {
          width: 78%;
          max-width: 300px;
          aspect-ratio: 1 / 1;
          object-fit: contain;
          filter: drop-shadow(0 14px 30px rgba(0,0,0,0.45));
        }
        .hrv2-byline {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 4px 20px 0;
          padding-top: 12px;
          border-top: 1px solid rgba(244,239,230,0.18);
          font-size: 11px;
          letter-spacing: 0.04em;
          color: rgba(244,239,230,0.62);
        }
        .hrv2-byline b { color: #e9c89a; font-weight: 700; }
        .hrv2-barcode {
          display: flex;
          gap: 1.5px;
          align-items: flex-end;
          height: 16px;
          opacity: 0.7;
        }
        .hrv2-barcode i {
          display: block;
          width: 1.5px;
          height: 100%;
          background: #e9c89a;
        }
        .hrv2-barcode i:nth-child(2n) { height: 64%; }
        .hrv2-barcode i:nth-child(3n) { width: 3px; }
        .hrv2-barcode i:nth-child(5n) { height: 82%; }

        .hrv2-entry {
          padding: 22px 20px 18px;
          background: var(--bg, #f7f4ee);
          border-bottom: 1px solid var(--border, #e4ddd0);
        }
        .hrv2-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 54px;
          border: none;
          border-radius: var(--radius, 10px);
          background: #1f1d1a;
          color: #f7f2e9;
          font-family: var(--font, "Pretendard", sans-serif);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          box-shadow: var(--shadow, 0 6px 18px rgba(31,29,26,0.18));
        }
        .hrv2-cta-arrow {
          font-family: var(--font-serif, serif);
          font-size: 18px;
        }
        .hrv2-sub {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
          font-size: 13px;
          color: var(--text-muted, #6f6a61);
        }
        .hrv2-sub a {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 0 4px;
          color: var(--text, #1f1d1a);
          font-weight: 600;
          text-decoration: none;
        }
        .hrv2-sub a span {
          border-bottom: 1.5px solid var(--border, #ddd6c9);
          padding-bottom: 1px;
        }
        .hrv2-sub .hrv2-dot { margin: 0 6px; color: var(--border, #cfc8ba); }

        .hrv2-contents {
          padding: 6px 20px 30px;
        }
        .hrv2-contents-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin: 16px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1.5px solid var(--text, #1f1d1a);
        }
        .hrv2-contents-title {
          font-family: var(--font-brand-serif, serif);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text, #1f1d1a);
        }
        .hrv2-contents-no {
          flex-shrink: 0;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted, #6f6a61);
          font-weight: 600;
        }
        .hrv2-toc { display: flex; flex-direction: column; }
        .hrv2-item {
          display: flex;
          align-items: center;
          gap: 13px;
          width: 100%;
          min-height: 56px;
          padding: 13px 2px;
          border: none;
          border-bottom: 1px solid var(--border, #e4ddd0);
          background: transparent;
          text-align: left;
          cursor: pointer;
          font-family: var(--font, sans-serif);
        }
        .hrv2-pg {
          flex-shrink: 0;
          width: 30px;
          font-family: var(--font-brand-serif, serif);
          font-size: 18px;
          font-weight: 700;
          color: var(--text-sub, #8a8478);
          font-style: italic;
        }
        .hrv2-swatch {
          flex-shrink: 0;
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }
        .hrv2-item-body { flex: 1; min-width: 0; }
        .hrv2-item-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text, #1f1d1a);
          letter-spacing: -0.01em;
          line-height: 1.25;
        }
        .hrv2-item-desc {
          margin-top: 2px;
          font-size: 12.5px;
          color: var(--text-muted, #6f6a61);
          line-height: 1.4;
        }
        .hrv2-chev {
          flex-shrink: 0;
          font-family: var(--font-serif, serif);
          font-size: 17px;
          color: var(--text-sub, #b3ada0);
        }
        .hrv2-action {
          margin-top: 18px;
          padding: 16px 16px 15px;
          border-radius: var(--radius-lg, 18px);
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e4ddd0);
          box-shadow: var(--shadow, 0 6px 18px rgba(31,29,26,0.06));
        }
        .hrv2-action-kicker {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--el-fire, #c2483c);
          margin-bottom: 7px;
        }
        .hrv2-action-line {
          font-family: var(--font-serif, "Gowun Batang", serif);
          font-size: 16.5px;
          line-height: 1.55;
          color: var(--text, #1f1d1a);
          margin: 0 0 12px;
        }
        .hrv2-action-line b {
          color: var(--el-fire, #c2483c);
          background: var(--el-fire-bg, #f6e2df);
          padding: 0 4px;
          border-radius: 3px;
          font-weight: 800;
        }
        .hrv2-ask {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          min-height: 48px;
          padding: 0 14px 0 16px;
          border: 1.5px solid var(--text, #1f1d1a);
          border-radius: var(--radius-pill, 999px);
          background: transparent;
          cursor: pointer;
          font-family: var(--font, sans-serif);
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text, #1f1d1a);
        }
        .hrv2-ask-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: var(--text, #1f1d1a);
          color: var(--surface, #f7f2e9);
          font-family: var(--font-serif, serif);
          font-size: 15px;
        }
        .hrv2-colophon {
          margin-top: 22px;
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: var(--text-sub, #9b958a);
          line-height: 1.6;
        }
      `}</style>

      <section className="hrv2-cover">
        <div className="hrv2-masthead">
          <div className="hrv2-logo">사주언니<span>×</span>기질오빠</div>
          <div className="hrv2-issue">
            <b>ISSUE 06·28</b>
            오늘의 표지 · 매일 발행
          </div>
        </div>

        <div className="hrv2-stage">
          <span className="hrv2-kicker">오늘의 한 줄</span>
          <h1 className="hrv2-headline">
            운 탓 <em>70%</em>,<br />
            네 성격 탓 <u>30%</u>.<br />
            오늘은 둘 다 손봐.
          </h1>
          <p className="hrv2-dek">
            흐름은 못 바꿔도 선택지는 줄일 수 있거든. 사주랑 기질, 둘 다 깔아놓고
            오늘 할 거 딱 하나만 정해주는 게 내 일이야.
          </p>
        </div>

        <div className="hrv2-portrait">
          <img src="/brand-icons/persona-duo.png" alt="사주언니와 기질오빠 듀오 일러스트" />
        </div>

        <div className="hrv2-byline">
          <span>글·풀이 <b>사주언니 · 기질오빠</b></span>
          <div className="hrv2-barcode" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
        </div>
      </section>

      <div className="hrv2-entry">
        <button type="button" className="hrv2-cta">
          게스트로 시작하기
          <span className="hrv2-cta-arrow" aria-hidden="true">→</span>
        </button>
        <p className="hrv2-sub">
          <a href="#"><span>이메일로 로그인</span></a>
          <span className="hrv2-dot" aria-hidden="true">·</span>
          <a href="#"><span>회원가입</span></a>
        </p>
      </div>

      <div className="hrv2-contents">
        <div className="hrv2-contents-head">
          <span className="hrv2-contents-title">이번 호 들여다보기</span>
          <span className="hrv2-contents-no">CONTENTS</span>
        </div>

        <div className="hrv2-toc">
          <button type="button" className="hrv2-item">
            <span className="hrv2-pg">01</span>
            <span className="hrv2-swatch" style={{ background: "var(--el-water, #33507e)" }}></span>
            <span className="hrv2-item-body">
              <span className="hrv2-item-name">개인사주 풀이</span>
              <span className="hrv2-item-desc">타고난 결이랑 10년 단위 흐름, 한 장으로 정리해줄게</span>
            </span>
            <span className="hrv2-chev" aria-hidden="true">→</span>
          </button>

          <button type="button" className="hrv2-item">
            <span className="hrv2-pg">02</span>
            <span className="hrv2-swatch" style={{ background: "var(--el-wood, #2f7d62)" }}></span>
            <span className="hrv2-item-body">
              <span className="hrv2-item-name">기질 풀이</span>
              <span className="hrv2-item-desc">8축 성격검사로 네가 어디서 세고 어디서 무른지 까발려</span>
            </span>
            <span className="hrv2-chev" aria-hidden="true">→</span>
          </button>

          <button type="button" className="hrv2-item">
            <span className="hrv2-pg">03</span>
            <span className="hrv2-swatch" style={{ background: "var(--el-fire, #c2483c)" }}></span>
            <span className="hrv2-item-body">
              <span className="hrv2-item-name">융합 풀이</span>
              <span className="hrv2-item-desc">사주랑 기질 겹쳐보면 진짜 너가 나와. 여기가 핵심이야</span>
            </span>
            <span className="hrv2-chev" aria-hidden="true">→</span>
          </button>

          <button type="button" className="hrv2-item">
            <span className="hrv2-pg">04</span>
            <span className="hrv2-swatch" style={{ background: "var(--el-earth, #bf8f2e)" }}></span>
            <span className="hrv2-item-body">
              <span className="hrv2-item-name">가족 풀이</span>
              <span className="hrv2-item-desc">엄마·배우자·아이랑 왜 그렇게 부딪히는지 짚어줄게</span>
            </span>
            <span className="hrv2-chev" aria-hidden="true">→</span>
          </button>
        </div>

        <div className="hrv2-action">
          <div className="hrv2-action-kicker">오늘의 액션 · 1개만</div>
          <p className="hrv2-action-line">
            머릿속 고민 다 펼치지 말고, <b>딱 두 개</b>로 줄여서 가져와.
            나머진 오늘 안 건드려도 돼.
          </p>
          <button type="button" className="hrv2-ask">
            오늘의 고민 털어놓기
            <span className="hrv2-ask-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <p className="hrv2-colophon">
          사주언니 × 기질오빠 · 만세력과 8축 기질을 근거로 한 인생 상담<br />
          오늘의 표지는 매일 새로 발행돼
        </p>
      </div>
    </div>
  );
}
