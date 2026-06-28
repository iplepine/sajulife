export default function Variant1() {
  return (
    <div className="hrv1-root">
      <style>{`
        .hrv1-root {
          width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font);
          display: flex;
          flex-direction: column;
          padding: var(--space-5) var(--space-4) var(--space-4);
          -webkit-font-smoothing: antialiased;
        }
        .hrv1-root *, .hrv1-root *::before, .hrv1-root *::after {
          box-sizing: border-box;
        }

        /* 상단: 아주 작은 텍스트 마크 한 줄 + 미세한 듀오 일러스트 */
        .hrv1-mark {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: var(--font-brand);
          font-size: 13px;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }
        .hrv1-mark-img {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-pill);
          object-fit: contain;
          background: var(--surface-2);
          border: 1px solid var(--border);
          flex: none;
        }
        .hrv1-mark strong {
          font-weight: 600;
          color: var(--text);
        }

        /* 중앙: 질문 + 입력 + CTA, 넉넉한 여백 */
        .hrv1-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: var(--space-5);
          padding: var(--space-6) 0;
        }

        .hrv1-kicker {
          font-size: 13px;
          letter-spacing: 0.02em;
          color: var(--text-sub);
        }
        .hrv1-question {
          font-family: var(--font-brand-serif, var(--font-serif));
          font-weight: 700;
          font-size: 30px;
          line-height: 1.32;
          letter-spacing: -0.01em;
          color: var(--text);
          margin: 10px 0 0;
        }

        /* 단 하나의 입력 필드 — 테두리 없이 밑줄과 캐럿만 */
        .hrv1-field {
          position: relative;
          padding-bottom: 14px;
          border-bottom: 1.5px solid var(--text);
        }
        .hrv1-placeholder {
          font-size: 17px;
          line-height: 1.5;
          color: var(--text-sub);
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .hrv1-caret {
          display: inline-block;
          width: 2px;
          height: 19px;
          background: var(--el-fire);
          animation: hrv1-blink 1.1s steps(1) infinite;
        }
        @keyframes hrv1-blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }

        /* 입력 아래: 빠른 예시 칩 (반말 톤, 보조) */
        .hrv1-examples {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .hrv1-chip {
          font-family: var(--font);
          font-size: 14px;
          color: var(--text-sub);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          padding: 9px 14px;
          min-height: 38px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .hrv1-chip:hover {
          border-color: var(--text-muted);
          color: var(--text);
        }

        /* 1차 CTA — 먹 단색, 꽉 찬 폭 */
        .hrv1-cta {
          width: 100%;
          min-height: 54px;
          font-family: var(--font);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--bg);
          background: var(--text);
          border: none;
          border-radius: var(--radius-pill);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.15s;
        }
        .hrv1-cta:hover { opacity: 0.88; }
        .hrv1-cta-arrow { font-size: 15px; transform: translateY(0.5px); }

        /* CTA 아래 한 줄: 근거 데이터 안내 (반말, 미세) */
        .hrv1-basis {
          margin-top: 14px;
          text-align: center;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--text-sub);
        }
        .hrv1-basis-guest {
          color: var(--text-muted);
        }

        /* 하단: 작은 보조 링크 (존댓말 UI) */
        .hrv1-foot {
          margin-top: var(--space-5);
          padding-top: var(--space-3);
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .hrv1-link {
          background: none;
          border: none;
          padding: 8px 4px;
          min-height: 36px;
          font-family: var(--font);
          font-size: 13px;
          color: var(--link);
          cursor: pointer;
          text-decoration: none;
        }
        .hrv1-link:hover { text-decoration: underline; }
        .hrv1-foot-sep { color: var(--border); }
      `}</style>

      <div className="hrv1-mark">
        <img
          className="hrv1-mark-img"
          src="/brand-icons/persona-duo.png"
          alt=""
          aria-hidden="true"
        />
        <span><strong>사주언니</strong> × 기질오빠</span>
      </div>

      <div className="hrv1-center">
        <div>
          <div className="hrv1-kicker">묻고 싶은 거 딱 한 줄만.</div>
          <h1 className="hrv1-question">오늘,<br />뭐가 제일 답답해?</h1>
        </div>

        <div className="hrv1-field">
          <div className="hrv1-placeholder">
            <span>이직할까 말까 6개월째 고민 중</span>
            <span className="hrv1-caret" aria-hidden="true"></span>
          </div>
        </div>

        <div className="hrv1-examples">
          <button type="button" className="hrv1-chip">연애가 자꾸 같은 데서 깨져</button>
          <button type="button" className="hrv1-chip">올해 돈 흐름 어때?</button>
          <button type="button" className="hrv1-chip">엄마랑 왜 늘 부딪히지</button>
        </div>

        <div>
          <button type="button" className="hrv1-cta">
            한 줄 적고 시작하기
            <span className="hrv1-cta-arrow" aria-hidden="true">→</span>
          </button>
          <p className="hrv1-basis">
            네 만세력이랑 기질 8축 깔고 답해줄게.<br />감 아니고 근거로 팩폭 들어간다.
            <span className="hrv1-basis-guest"><br />ID 없이 게스트로 바로 시작.</span>
          </p>
        </div>
      </div>

      <div className="hrv1-foot">
        <button type="button" className="hrv1-link">이메일로 로그인</button>
        <span className="hrv1-foot-sep" aria-hidden="true">·</span>
        <button type="button" className="hrv1-link">회원가입</button>
      </div>
    </div>
  );
}
