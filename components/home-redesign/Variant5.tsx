export default function Variant5() {
  return (
    <div className="hrv5-root">
      <style>{`
        .hrv5-root {
          width: 100%;
          min-height: 100%;
          background: var(--bg, #f7f4ee);
          color: var(--text, #1f1d1a);
          font-family: var(--font, "Pretendard", system-ui, sans-serif);
          display: flex;
          flex-direction: column;
          position: relative;
          -webkit-font-smoothing: antialiased;
        }

        /* ===== Header ===== */
        .hrv5-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: color-mix(in srgb, var(--bg, #f7f4ee) 88%, transparent);
          backdrop-filter: saturate(1.2) blur(10px);
          -webkit-backdrop-filter: saturate(1.2) blur(10px);
          border-bottom: 1px solid var(--border, #e3ddd1);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .hrv5-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-pill, 999px);
          object-fit: contain;
          background: var(--surface-2, #fbf9f4);
          border: 1px solid var(--border, #e3ddd1);
          flex-shrink: 0;
        }
        .hrv5-htext { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .hrv5-hname {
          font-family: var(--font-brand, "Gowun Dodum", sans-serif);
          font-size: 15.5px;
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }
        .hrv5-hcross { color: var(--text-sub, #615d55); opacity: 0.7; font-weight: 400; margin: 0 1px; }
        .hrv5-hmeta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: var(--text-muted, #76716a);
          line-height: 1.1;
        }
        .hrv5-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--el-wood, #2f7d62);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-wood, #2f7d62) 22%, transparent);
          flex-shrink: 0;
        }
        .hrv5-hbtns { margin-left: auto; }
        .hrv5-login-link {
          background: none; border: none; cursor: pointer;
          font-family: inherit;
          font-size: 12.5px;
          color: var(--link, #1956d6);
          font-weight: 600;
          padding: 8px 8px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }

        /* ===== Thread ===== */
        .hrv5-thread {
          flex: 1;
          padding: 16px 14px 12px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow: hidden;
        }
        .hrv5-daystamp {
          align-self: center;
          font-size: 11px;
          color: var(--text-muted, #76716a);
          background: var(--surface-2, #fbf9f4);
          border: 1px solid var(--border, #e3ddd1);
          padding: 3px 12px;
          border-radius: var(--radius-pill, 999px);
          letter-spacing: 0.02em;
        }

        .hrv5-row { display: flex; gap: 9px; max-width: 100%; }
        .hrv5-row-me { justify-content: flex-end; }
        .hrv5-row-ai { justify-content: flex-start; }

        .hrv5-bubavatar {
          width: 30px; height: 30px;
          border-radius: var(--radius-pill, 999px);
          object-fit: contain;
          background: var(--surface-2, #fbf9f4);
          border: 1px solid var(--border, #e3ddd1);
          flex-shrink: 0;
          align-self: flex-end;
          margin-bottom: 2px;
        }

        .hrv5-bub {
          padding: 11px 14px;
          font-size: 14.5px;
          line-height: 1.62;
          letter-spacing: -0.01em;
          max-width: 80%;
          word-break: keep-all;
        }
        .hrv5-bub-me {
          background: var(--el-water, #33507e);
          color: #fff;
          border-radius: 16px 16px 4px 16px;
          box-shadow: var(--shadow, 0 2px 10px rgba(31,29,26,0.07));
        }
        .hrv5-bub-ai {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e3ddd1);
          border-radius: 16px 16px 16px 4px;
          box-shadow: var(--shadow, 0 2px 10px rgba(31,29,26,0.06));
        }
        .hrv5-bub-ai b { font-weight: 700; }
        .hrv5-bub-ai .hrv5-pop {
          color: var(--el-fire, #c2483c);
          font-weight: 700;
        }

        .hrv5-aiwrap { display: flex; flex-direction: column; gap: 7px; max-width: 82%; }

        /* evidence chips inside answer */
        .hrv5-tags { display: flex; flex-wrap: wrap; gap: 6px; padding-left: 2px; }
        .hrv5-tag {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: var(--radius-pill, 999px);
          border: 1px solid transparent;
          letter-spacing: -0.01em;
        }
        .hrv5-tag-saju {
          color: var(--el-fire, #c2483c);
          background: var(--el-fire-bg, #f7e8e6);
          border-color: color-mix(in srgb, var(--el-fire, #c2483c) 28%, transparent);
        }
        .hrv5-tag-gijil {
          color: var(--el-wood, #2f7d62);
          background: var(--el-wood-bg, #e8f1ec);
          border-color: color-mix(in srgb, var(--el-wood, #2f7d62) 28%, transparent);
        }
        .hrv5-tag-fusion {
          color: var(--el-water, #33507e);
          background: var(--el-water-bg, #e7eaf1);
          border-color: color-mix(in srgb, var(--el-water, #33507e) 28%, transparent);
        }

        /* today action card embedded in thread */
        .hrv5-action {
          margin-left: 39px;
          margin-top: -3px;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e3ddd1);
          border-left: 3px solid var(--el-earth, #bf8f2e);
          border-radius: var(--radius, 10px);
          padding: 11px 13px;
          max-width: 82%;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          box-shadow: var(--shadow, 0 2px 10px rgba(31,29,26,0.05));
        }
        .hrv5-action-emoji {
          font-size: 18px; line-height: 1.3;
        }
        .hrv5-action-body { display: flex; flex-direction: column; gap: 2px; }
        .hrv5-action-label {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em;
          color: var(--el-earth, #bf8f2e);
          text-transform: uppercase;
        }
        .hrv5-action-text {
          font-size: 13.5px; line-height: 1.5; font-weight: 600;
          color: var(--text, #1f1d1a);
          word-break: keep-all;
        }

        /* typing hint */
        .hrv5-typing {
          margin-left: 39px;
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11.5px; color: var(--text-muted, #76716a);
        }
        .hrv5-typing span {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--text-muted, #76716a);
          display: inline-block;
          animation: hrv5-blink 1.2s infinite ease-in-out;
        }
        .hrv5-typing span:nth-child(2) { animation-delay: 0.2s; }
        .hrv5-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes hrv5-blink {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }

        /* ===== Report shortcuts row (chips reframed as thread reply choices) ===== */
        .hrv5-reportrow {
          margin-left: 39px;
          display: flex; flex-wrap: wrap; gap: 7px;
          max-width: 86%;
        }
        .hrv5-reportchip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e3ddd1);
          border-radius: var(--radius-pill, 999px);
          padding: 7px 12px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text, #1f1d1a);
          cursor: pointer;
          font-family: inherit;
          min-height: 40px;
        }
        .hrv5-reportchip .hrv5-rc-em { font-size: 14px; }

        /* ===== Bottom dock ===== */
        .hrv5-dock {
          position: sticky;
          bottom: 0;
          z-index: 20;
          background: color-mix(in srgb, var(--bg, #f7f4ee) 92%, transparent);
          backdrop-filter: saturate(1.2) blur(10px);
          -webkit-backdrop-filter: saturate(1.2) blur(10px);
          border-top: 1px solid var(--border, #e3ddd1);
          padding: 9px 0 calc(10px + env(safe-area-inset-bottom, 0px));
        }
        .hrv5-suggest {
          display: flex; gap: 8px;
          overflow-x: auto;
          padding: 0 14px 9px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .hrv5-suggest::-webkit-scrollbar { display: none; }
        .hrv5-sgchip {
          flex-shrink: 0;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e3ddd1);
          border-radius: var(--radius-pill, 999px);
          padding: 8px 14px;
          font-size: 13px;
          color: var(--text, #1f1d1a);
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          min-height: 44px;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .hrv5-sgchip-lead {
          color: var(--el-fire, #c2483c);
          border-color: color-mix(in srgb, var(--el-fire, #c2483c) 38%, transparent);
          background: var(--el-fire-bg, #f7e8e6);
          font-weight: 600;
        }

        .hrv5-inputbar {
          display: flex; align-items: flex-end; gap: 9px;
          padding: 0 14px;
        }
        .hrv5-inputfield {
          flex: 1;
          background: var(--surface, #fff);
          border: 1.5px solid var(--border, #e3ddd1);
          border-radius: 22px;
          padding: 11px 16px;
          font-size: 14.5px;
          color: var(--text-muted, #76716a);
          min-height: 46px;
          display: flex; align-items: center;
          font-family: inherit;
          position: relative;
        }
        .hrv5-caret {
          display: inline-block;
          width: 1.5px; height: 17px;
          background: var(--el-fire, #c2483c);
          margin-left: 1px;
          animation: hrv5-caret 1.05s step-end infinite;
          vertical-align: middle;
        }
        @keyframes hrv5-caret { 50% { opacity: 0; } }
        .hrv5-send {
          width: 46px; height: 46px;
          flex-shrink: 0;
          border-radius: 50%;
          border: none;
          background: var(--el-water, #33507e);
          color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow, 0 2px 10px rgba(31,29,26,0.12));
        }
        .hrv5-send svg { width: 21px; height: 21px; }

        /* primary guest CTA — floats above suggestions on first entry */
        .hrv5-guestcta {
          margin: 0 14px 9px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--text, #1f1d1a);
          color: var(--bg, #f7f4ee);
          border: none;
          border-radius: var(--radius-pill, 999px);
          padding: 13px 18px;
          font-size: 14.5px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          width: calc(100% - 28px);
          justify-content: center;
          min-height: 50px;
          box-shadow: var(--shadow, 0 4px 16px rgba(31,29,26,0.16));
          letter-spacing: -0.01em;
        }
        .hrv5-guestcta .hrv5-gc-arrow { font-size: 16px; }
        .hrv5-docknote {
          text-align: center;
          font-size: 11px;
          color: var(--text-muted, #76716a);
          padding: 0 14px 2px;
        }
        .hrv5-docknote button {
          color: var(--link, #1956d6);
          font-weight: 600;
          background: none; border: none; cursor: pointer;
          font-family: inherit; font-size: 11px;
          padding: 4px 2px;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>

      {/* ===== Duo header ===== */}
      <header className="hrv5-header">
        <img
          className="hrv5-avatar"
          src="/brand-icons/persona-duo.png"
          alt="사주언니와 기질오빠 듀오"
        />
        <div className="hrv5-htext">
          <div className="hrv5-hname">
            사주언니 <span className="hrv5-hcross">×</span> 기질오빠
          </div>
          <div className="hrv5-hmeta">
            <span className="hrv5-dot" />
            근거는 사주 · 기질 · 융합 3종
          </div>
        </div>
        <div className="hrv5-hbtns">
          <button type="button" className="hrv5-login-link">로그인</button>
        </div>
      </header>

      {/* ===== Thread ===== */}
      <main className="hrv5-thread">
        <div className="hrv5-daystamp">오늘</div>

        {/* AI opener */}
        <div className="hrv5-row hrv5-row-ai">
          <img
            className="hrv5-bubavatar"
            src="/brand-icons/saju-duo-friendly/friendly-duo-01-no-glasses.png"
            alt="언니오빠"
          />
          <div className="hrv5-aiwrap">
            <div className="hrv5-bub hrv5-bub-ai">
              왔어? 일단 앉아봐. 오늘 머릿속 제일 시끄러운 거 하나만 던져.
              점치는 거 아니고, <b>네 사주랑 기질 데이터 깔아놓고</b> 같이 정리하는 거야.
            </div>
          </div>
        </div>

        {/* User question */}
        <div className="hrv5-row hrv5-row-me">
          <div className="hrv5-bub hrv5-bub-me">
            요즘 일이 안 풀려. 이거 운이 안 좋은 거야, 내가 문제인 거야?
          </div>
        </div>

        {/* AI answer with evidence tags */}
        <div className="hrv5-row hrv5-row-ai">
          <img
            className="hrv5-bubavatar"
            src="/brand-icons/saju-unni.png"
            alt="사주언니"
          />
          <div className="hrv5-aiwrap">
            <div className="hrv5-bub hrv5-bub-ai">
              팩폭 들어간다. <span className="hrv5-pop">운 탓 70%, 네 성격 탓 30%</span>야.
              지금은 흐름 자체가 무거운 시기 맞아 — 근데 일을 한 번에 다 붙잡으려는 네 욕심이
              나머지 30%를 키우고 있거든. 오늘은 선택지를 <b>2개로 줄여.</b> 그럼 숨통 트인다.
            </div>
            <div className="hrv5-tags">
              <span className="hrv5-tag hrv5-tag-saju">🔥 사주 · 흐름</span>
              <span className="hrv5-tag hrv5-tag-gijil">🌿 기질 · 추진성↑</span>
              <span className="hrv5-tag hrv5-tag-fusion">💧 융합 · 과부하</span>
            </div>
          </div>
        </div>

        {/* Today's action — embedded card */}
        <div className="hrv5-action">
          <span className="hrv5-action-emoji">🪧</span>
          <div className="hrv5-action-body">
            <span className="hrv5-action-label">오늘 할 거 1개</span>
            <span className="hrv5-action-text">
              벌여놓은 일 목록 적고, 오늘 안 해도 안 죽는 거 3개 그어버리기.
            </span>
          </div>
        </div>

        {/* report shortcut chips, framed as "더 볼래?" reply */}
        <div className="hrv5-typing">
          <span /><span /><span /> 근거 더 까볼래?
        </div>
        <div className="hrv5-reportrow">
          <button type="button" className="hrv5-reportchip">
            <span className="hrv5-rc-em">📜</span> 내 사주 풀이
          </button>
          <button type="button" className="hrv5-reportchip">
            <span className="hrv5-rc-em">🧭</span> 기질 8축
          </button>
          <button type="button" className="hrv5-reportchip">
            <span className="hrv5-rc-em">🔗</span> 융합 풀이
          </button>
          <button type="button" className="hrv5-reportchip">
            <span className="hrv5-rc-em">👨‍👩‍👧</span> 가족 궁합
          </button>
        </div>
      </main>

      {/* ===== Bottom dock ===== */}
      <div className="hrv5-dock">
        {/* primary entry CTA */}
        <button type="button" className="hrv5-guestcta">
          게스트로 바로 시작하기 <span className="hrv5-gc-arrow">→</span>
        </button>

        {/* suggested questions — horizontal scroll */}
        <div className="hrv5-suggest">
          <button type="button" className="hrv5-sgchip hrv5-sgchip-lead">
            🔥 올해 운 어때?
          </button>
          <button type="button" className="hrv5-sgchip">💼 이직해도 될까?</button>
          <button type="button" className="hrv5-sgchip">❤️ 이 사람 나랑 맞아?</button>
          <button type="button" className="hrv5-sgchip">😮‍💨 현타 왔어</button>
          <button type="button" className="hrv5-sgchip">💸 돈 흐름 봐줘</button>
        </div>

        {/* input + send */}
        <div className="hrv5-inputbar">
          <div className="hrv5-inputfield">
            여기 바로 고민 적어<span className="hrv5-caret" />
          </div>
          <button type="button" className="hrv5-send" aria-label="보내기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>

        <div className="hrv5-docknote">
          가입 없이 바로 대화 가능 ·{" "}
          <button type="button">이메일로 로그인</button> ·{" "}
          <button type="button">회원가입</button>
        </div>
      </div>
    </div>
  );
}
