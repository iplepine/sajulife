export default function Variant7() {
  return (
    <div className="hrv7-root">
      <style>{`
        .hrv7-root {
          width: 100%; min-height: 100%;
          background:
            radial-gradient(120% 70% at 50% -8%, var(--season-spring-bg) 0%, rgba(0,0,0,0) 58%),
            var(--bg);
          color: var(--text);
          font-family: var(--font);
          -webkit-font-smoothing: antialiased;
          box-sizing: border-box;
          padding: calc(20px + env(safe-area-inset-top)) 18px calc(36px + env(safe-area-inset-bottom));
        }
        .hrv7-root *, .hrv7-root *::before, .hrv7-root *::after { box-sizing: border-box; }

        .hrv7-top { display: flex; align-items: center; gap: 11px; margin: 2px 0 18px; }
        .hrv7-duo {
          width: 52px; height: 52px; border-radius: 16px; flex: none;
          object-fit: contain; background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
        }
        .hrv7-hi-name {
          font-family: var(--font-brand);
          font-size: 15px; font-weight: 700; color: var(--text);
          letter-spacing: -.01em; line-height: 1.2;
        }
        .hrv7-hi-sub {
          font-size: 13px; color: var(--text-muted);
          margin-top: 3px; line-height: 1.4;
        }
        .hrv7-wave { display: inline-block; margin-left: 2px; }

        .hrv7-greet {
          font-family: var(--font-brand);
          font-size: 25px; line-height: 1.32; font-weight: 700;
          letter-spacing: -.02em; color: var(--text);
          margin: 4px 2px 6px;
        }
        .hrv7-greet b { color: var(--season-spring-deep); font-weight: 700; }
        .hrv7-greet-sub {
          font-size: 14.5px; color: var(--text-sub); line-height: 1.55;
          margin: 0 2px 22px;
        }

        .hrv7-step {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 700; color: var(--text-muted);
          letter-spacing: .02em; margin: 0 2px 11px;
        }
        .hrv7-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--season-spring-deep);
        }

        .hrv7-chips {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 18px;
        }
        .hrv7-chip {
          appearance: none; cursor: pointer; text-align: left;
          border: 1.5px solid var(--border);
          background: var(--surface);
          border-radius: 16px;
          padding: 14px 14px;
          display: flex; align-items: center; gap: 11px;
          min-height: 60px;
          transition: transform .08s ease;
          font-family: var(--font);
        }
        .hrv7-chip:active { transform: scale(.985); }
        .hrv7-emoji {
          font-size: 23px; line-height: 1; flex: none;
          width: 30px; text-align: center;
        }
        .hrv7-chip-txt { min-width: 0; }
        .hrv7-chip-label {
          display: block;
          font-size: 15px; font-weight: 700; color: var(--text);
          line-height: 1.25;
        }
        .hrv7-chip-hint {
          display: block;
          font-size: 11.5px; color: var(--text-muted);
          margin-top: 2px; line-height: 1.3;
        }
        .hrv7-chip.on {
          border-color: var(--season-spring-deep);
          background: var(--season-spring-bg);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--season-spring-deep) 22%, transparent);
        }
        .hrv7-chip.on .hrv7-chip-hint { color: var(--season-spring-deep); }
        .hrv7-check {
          margin-left: auto; flex: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--season-spring-deep);
          color: #fff; font-size: 12px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }

        .hrv7-preview {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
          padding: 16px 16px 17px;
          margin-bottom: 14px;
          overflow: hidden;
        }
        .hrv7-preview::before {
          content: ""; position: absolute; left: 0; top: 0; bottom: 0;
          width: 4px; background: var(--season-spring-deep);
          border-radius: 4px 0 0 4px;
        }
        .hrv7-preview-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 700;
          color: var(--season-spring-deep);
          background: var(--season-spring-bg);
          border-radius: var(--radius-pill);
          padding: 4px 11px; margin-bottom: 11px;
        }
        .hrv7-q {
          font-family: var(--font-serif);
          font-size: 18.5px; line-height: 1.55; color: var(--text);
          letter-spacing: -.01em; margin: 0;
        }
        .hrv7-q em {
          font-style: normal; font-weight: 700;
          color: var(--season-spring-deep);
          background: linear-gradient(transparent 62%, color-mix(in srgb, var(--season-spring-deep) 26%, transparent) 62%);
          padding: 0 1px;
        }
        .hrv7-q-foot {
          font-size: 12.5px; color: var(--text-muted);
          margin: 12px 0 0; line-height: 1.45;
          display: flex; align-items: flex-start; gap: 6px;
        }

        .hrv7-cta {
          width: 100%; cursor: pointer;
          border: none; border-radius: 15px;
          background: var(--text); color: var(--bg);
          font-family: var(--font); font-size: 16px; font-weight: 800;
          min-height: 54px; padding: 0 18px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          letter-spacing: -.01em;
          box-shadow: var(--shadow);
          transition: transform .08s ease;
        }
        .hrv7-cta:active { transform: scale(.99); }
        .hrv7-cta-arrow { font-size: 17px; }

        .hrv7-aux-text {
          text-align: center; font-size: 13px; color: var(--text-muted);
          margin: 14px 0 8px; line-height: 1.4;
        }
        .hrv7-aux {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin: 0 0 4px; flex-wrap: wrap;
        }
        .hrv7-link {
          appearance: none; background: none; border: none; cursor: pointer;
          font-family: var(--font);
          font-size: 13.5px; font-weight: 700; color: var(--link);
          padding: 8px 6px; min-height: 44px;
          display: inline-flex; align-items: center;
        }
        .hrv7-link-guest {
          color: var(--season-spring-deep);
          background: var(--season-spring-bg);
          border-radius: var(--radius-pill);
          padding: 8px 14px;
        }
        .hrv7-sep { color: var(--border-strong); font-size: 12px; }

        .hrv7-trust {
          margin-top: 16px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 12px 14px;
          display: flex; align-items: center; gap: 10px;
        }
        .hrv7-trust-icon {
          width: 28px; height: 28px; flex: none;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }
        .hrv7-trust-w { background: var(--el-wood-bg); }
        .hrv7-trust-txt { font-size: 12.5px; color: var(--text-sub); line-height: 1.5; }
        .hrv7-trust-txt b { color: var(--text); font-weight: 700; }

        .hrv7-foot {
          text-align: center; margin-top: 18px;
          font-size: 11.5px; color: var(--text-muted); line-height: 1.6;
        }
      `}</style>

      <div className="hrv7-top">
        <img
          className="hrv7-duo"
          src="/brand-icons/persona-duo.png"
          alt="사주언니와 기질오빠"
        />
        <div>
          <div className="hrv7-hi-name">사주언니 × 기질오빠<span className="hrv7-wave">👋</span></div>
          <div className="hrv7-hi-sub">사주랑 기질로 봐주는, 입 거친 친언니·오빠</div>
        </div>
      </div>

      <h1 className="hrv7-greet">
        말 길게 안 써도 돼.<br />
        <b>지금 기분</b>만 콕 눌러.
      </h1>
      <p className="hrv7-greet-sub">
        버튼 하나면 질문이 알아서 만들어져. 30초면 충분하니까 일단 와봐.
      </p>

      <div className="hrv7-step">
        <span className="hrv7-dot" />
        STEP 1 · 지금 네 상태는?
      </div>

      <div className="hrv7-chips">
        <button type="button" className="hrv7-chip on">
          <span className="hrv7-emoji">😮‍💨</span>
          <span className="hrv7-chip-txt">
            <span className="hrv7-chip-label">답답해</span>
            <span className="hrv7-chip-hint">막힌 게 있어</span>
          </span>
          <span className="hrv7-check">✓</span>
        </button>

        <button type="button" className="hrv7-chip">
          <span className="hrv7-emoji">😰</span>
          <span className="hrv7-chip-txt">
            <span className="hrv7-chip-label">예민해</span>
            <span className="hrv7-chip-hint">신경이 곤두</span>
          </span>
        </button>

        <button type="button" className="hrv7-chip">
          <span className="hrv7-emoji">🫠</span>
          <span className="hrv7-chip-txt">
            <span className="hrv7-chip-label">지쳤어</span>
            <span className="hrv7-chip-hint">방전 직전</span>
          </span>
        </button>

        <button type="button" className="hrv7-chip">
          <span className="hrv7-emoji">✨</span>
          <span className="hrv7-chip-txt">
            <span className="hrv7-chip-label">설레</span>
            <span className="hrv7-chip-hint">뭔가 시작</span>
          </span>
        </button>
      </div>

      <div className="hrv7-preview">
        <span className="hrv7-preview-tag">🪄 질문이 만들어졌어</span>
        <p className="hrv7-q">
          요즘 <em>답답해서</em> 숨이 턱 막히는데,
          이게 운 흐름 때문인지 내 성격 때문인지 좀 짚어줘.
        </p>
        <p className="hrv7-q-foot">
          <span>↳</span>
          <span>타고난 흐름이랑 네 성격결 같이 보고 답해줄게.</span>
        </p>
      </div>

      <button type="button" className="hrv7-cta">
        이 질문으로 시작하기
        <span className="hrv7-cta-arrow">→</span>
      </button>

      <p className="hrv7-aux-text">계정 없이 바로 봐도 돼.</p>
      <div className="hrv7-aux">
        <button type="button" className="hrv7-link hrv7-link-guest">게스트로 시작하기</button>
        <span className="hrv7-sep">·</span>
        <button type="button" className="hrv7-link">이메일로 로그인</button>
        <span className="hrv7-sep">·</span>
        <button type="button" className="hrv7-link">회원가입</button>
      </div>

      <div className="hrv7-trust">
        <span className="hrv7-trust-icon hrv7-trust-w">🌿</span>
        <span className="hrv7-trust-txt">
          <b>근거 있는 풀이</b>야. 만세력 사주 + 8축 기질검사로 짚어주니까, 그냥 위로만 하는 거 아냐.
        </span>
      </div>

      <p className="hrv7-foot">
        기분이 애매하면 아무거나 눌러도 돼.<br />
        고르는 순간 질문은 알아서 바뀌니까.
      </p>
    </div>
  );
}
