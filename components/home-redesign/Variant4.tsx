export default function Variant4() {
  return (
    <div className="hrv4-root">
      <style>{`
        .hrv4-root {
          width: 100%;
          min-height: 100%;
          background: var(--bg, #f7f4ee);
          color: var(--text, #1f1d1a);
          font-family: var(--font, Pretendard, system-ui, sans-serif);
          box-sizing: border-box;
          padding: var(--space-3, 16px) var(--space-3, 16px) calc(var(--space-6, 40px) + env(safe-area-inset-bottom, 0px));
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .hrv4-root * { box-sizing: border-box; }
        .hrv4-root button {
          -webkit-appearance: none;
          appearance: none;
          margin: 0;
        }

        /* ── topbar ── */
        .hrv4-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .hrv4-avatar {
          width: 44px; height: 44px;
          max-width: 44px;
          border-radius: 12px;
          object-fit: contain;
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e4ddd0);
          flex: 0 0 auto;
          display: block;
        }
        .hrv4-hello { flex: 1 1 auto; min-width: 0; }
        .hrv4-hello-h {
          font-family: var(--font-brand, "Gowun Dodum", serif);
          font-size: 17px;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .hrv4-hello-sub {
          font-size: 12px;
          color: var(--text-muted, #6f6a60);
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .hrv4-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: var(--text-sub, #9b958a);
          display: inline-block;
          flex: 0 0 auto;
        }
        .hrv4-guestpill {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted, #6f6a60);
          background: var(--surface-2, #f0ebe1);
          border: 1px solid var(--border, #e4ddd0);
          border-radius: var(--radius-pill, 999px);
          padding: 4px 9px;
          white-space: nowrap;
        }

        /* ── ticker (반말 한 줄) ── */
        .hrv4-ticker {
          background: var(--text, #1f1d1a);
          color: #f3efe7;
          border-radius: var(--radius, 10px);
          padding: 11px 13px;
          font-size: 13.5px;
          line-height: 1.45;
          display: flex;
          gap: 9px;
          align-items: flex-start;
          margin-bottom: 16px;
          font-family: var(--font-serif, "Gowun Batang", serif);
        }
        .hrv4-ticker-mk {
          flex: 0 0 auto;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          background: rgba(255,255,255,0.14);
          color: #f3efe7;
          border-radius: 5px;
          padding: 3px 6px;
          margin-top: 1px;
          font-family: var(--font, Pretendard, sans-serif);
        }

        /* ── section label ── */
        .hrv4-seclbl {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin: 0 2px 9px;
        }
        .hrv4-seclbl-t {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--text-muted, #6f6a60);
          text-transform: uppercase;
        }
        .hrv4-seclbl-c {
          font-size: 11px;
          color: var(--text-sub, #9b958a);
        }

        /* ── report status grid 2x2 ── */
        .hrv4-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
          margin-bottom: 18px;
        }
        .hrv4-card {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e4ddd0);
          border-radius: var(--radius, 10px);
          padding: 11px 11px 12px;
          position: relative;
          min-height: 96px;
          display: flex;
          flex-direction: column;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          color: inherit;
        }
        .hrv4-card-top {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
        }
        .hrv4-card-emo { font-size: 16px; line-height: 1; }
        .hrv4-card-name {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text, #1f1d1a);
        }
        .hrv4-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .hrv4-sdot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; }
        .hrv4-s-ready .hrv4-sdot { background: var(--el-wood, #2f7d62); }
        .hrv4-s-ready { color: var(--el-wood, #2f7d62); }
        .hrv4-s-done .hrv4-sdot { background: var(--el-water, #33507e); }
        .hrv4-s-done { color: var(--el-water, #33507e); }
        .hrv4-s-lock .hrv4-sdot { background: var(--text-sub, #9b958a); }
        .hrv4-s-lock { color: var(--text-sub, #9b958a); }
        .hrv4-card-desc {
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--text-muted, #6f6a60);
          margin-top: auto;
        }
        .hrv4-card.hrv4-locked { background: var(--surface-2, #f0ebe1); }
        .hrv4-card.hrv4-locked .hrv4-card-name { color: var(--text-muted, #6f6a60); }
        .hrv4-card-go {
          position: absolute;
          top: 10px; right: 10px;
          font-size: 13px;
          color: var(--text-sub, #9b958a);
          line-height: 1;
        }

        /* ── today actions checklist ── */
        .hrv4-actions {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e4ddd0);
          border-radius: var(--radius-lg, 18px);
          padding: 13px 14px 14px;
          margin-bottom: 18px;
        }
        .hrv4-act-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 11px;
        }
        .hrv4-act-h {
          font-size: 13.5px;
          font-weight: 700;
        }
        .hrv4-act-prog {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted, #6f6a60);
          background: var(--surface-2, #f0ebe1);
          border-radius: var(--radius-pill, 999px);
          padding: 3px 8px;
        }
        .hrv4-act-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 8px 0;
          border-top: 1px solid var(--border, #e4ddd0);
        }
        .hrv4-act-item:first-of-type { border-top: none; padding-top: 2px; }
        .hrv4-check {
          width: 20px; height: 20px;
          border-radius: 6px;
          border: 1.5px solid var(--border, #d8d0c2);
          flex: 0 0 auto;
          margin-top: 1px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface, #fff);
        }
        .hrv4-check.hrv4-on {
          background: var(--el-wood, #2f7d62);
          border-color: var(--el-wood, #2f7d62);
        }
        .hrv4-check svg { display: block; }
        .hrv4-act-txt { flex: 1 1 auto; min-width: 0; }
        .hrv4-act-label {
          font-size: 13px;
          line-height: 1.4;
          font-weight: 500;
        }
        .hrv4-act-item.hrv4-done .hrv4-act-label {
          color: var(--text-sub, #9b958a);
          text-decoration: line-through;
          text-decoration-color: var(--text-sub, #9b958a);
        }
        .hrv4-act-tag {
          display: inline-block;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted, #6f6a60);
          margin-top: 3px;
        }
        .hrv4-act-tag::before { content: "↳ "; color: var(--text-sub, #9b958a); }

        /* ── two-up: queue + weekly ── */
        .hrv4-row2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 18px;
        }

        .hrv4-queue {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e4ddd0);
          border-radius: var(--radius-lg, 18px);
          padding: 13px 14px;
          position: relative;
          overflow: hidden;
        }
        .hrv4-queue::before {
          content: "";
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
          background: var(--el-fire, #c2483c);
        }
        .hrv4-q-lbl {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--el-fire, #c2483c);
          margin-bottom: 6px;
        }
        .hrv4-q-q {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.45;
          font-family: var(--font-serif, "Gowun Batang", serif);
          margin-bottom: 10px;
        }
        .hrv4-q-meta {
          font-size: 11px;
          color: var(--text-muted, #6f6a60);
          margin-bottom: 11px;
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .hrv4-q-btn {
          width: 100%;
          border: none;
          background: var(--text, #1f1d1a);
          color: #f3efe7;
          font-size: 13px;
          font-weight: 700;
          border-radius: var(--radius, 10px);
          padding: 12px;
          min-height: 44px;
          font-family: inherit;
          cursor: pointer;
        }

        .hrv4-weekly {
          background: var(--surface, #fff);
          border: 1px solid var(--border, #e4ddd0);
          border-radius: var(--radius-lg, 18px);
          padding: 13px 14px 14px;
        }
        .hrv4-wk-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }
        .hrv4-wk-h { font-size: 13.5px; font-weight: 700; }
        .hrv4-wk-cap {
          font-size: 11px;
          color: var(--text-muted, #6f6a60);
          font-family: var(--font-serif, "Gowun Batang", serif);
          text-align: right;
        }
        .hrv4-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 5px;
          height: 56px;
        }
        .hrv4-bcol {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          height: 100%;
          justify-content: flex-end;
        }
        .hrv4-bwrap {
          width: 100%;
          flex: 1 1 auto;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .hrv4-bar {
          width: 60%;
          max-width: 14px;
          border-radius: 4px 4px 2px 2px;
          background: var(--el-water-bg, #dde4ef);
          border-bottom: 2px solid var(--el-water, #33507e);
        }
        .hrv4-bar.hrv4-up { background: var(--el-wood-bg, #d9e7e0); border-bottom-color: var(--el-wood, #2f7d62); }
        .hrv4-bar.hrv4-down { background: var(--el-fire-bg, #f1d9d6); border-bottom-color: var(--el-fire, #c2483c); }
        .hrv4-bar.hrv4-today { outline: 2px solid var(--text, #1f1d1a); outline-offset: 1px; }
        .hrv4-blbl { font-size: 9.5px; color: var(--text-sub, #9b958a); }
        .hrv4-blbl.hrv4-tlbl { color: var(--text, #1f1d1a); font-weight: 700; }

        /* ── primary CTA + auth ── */
        .hrv4-cta-wrap {
          border-top: 1px solid var(--border, #e4ddd0);
          padding-top: 16px;
        }
        .hrv4-cta {
          width: 100%;
          border: none;
          background: var(--el-fire, #c2483c);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          border-radius: var(--radius-pill, 999px);
          padding: 15px;
          min-height: 48px;
          font-family: inherit;
          cursor: pointer;
          box-shadow: var(--shadow, 0 2px 8px rgba(0,0,0,0.08));
          letter-spacing: -0.01em;
        }
        .hrv4-cta-sub {
          text-align: center;
          font-size: 12px;
          color: var(--text-muted, #6f6a60);
          margin-top: 10px;
        }
        .hrv4-authrow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 11px;
        }
        .hrv4-authlink {
          background: none;
          border: 1px solid var(--border, #d8d0c2);
          border-radius: var(--radius-pill, 999px);
          padding: 11px 16px;
          min-height: 44px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text, #1f1d1a);
          font-family: inherit;
          cursor: pointer;
        }
        .hrv4-authlink.hrv4-ghost {
          border: none;
          color: var(--link, #1956d6);
          padding: 11px 10px;
        }
      `}</style>

      {/* ── 인사 + 날짜 ── */}
      <div className="hrv4-top">
        <img className="hrv4-avatar" src="/brand-icons/persona-duo.png" alt="사주언니 기질오빠" />
        <div className="hrv4-hello">
          <div className="hrv4-hello-h">왔어? 오늘도 보자</div>
          <div className="hrv4-hello-sub">
            <span>6월 28일 일요일</span>
            <span className="hrv4-dot" />
            <span>병오일 · 따뜻한 결</span>
          </div>
        </div>
        <span className="hrv4-guestpill">게스트</span>
      </div>

      {/* ── 오늘의 한 줄 (반말 팩폭) ── */}
      <div className="hrv4-ticker">
        <span className="hrv4-ticker-mk">오늘</span>
        <span>운 탓 70%, 네 성격 탓 30%인 날이야. 욕심 부리지 말고 오늘은 선택지를 2개로 줄여. 그럼 안 흔들려.</span>
      </div>

      {/* ── 리포트 4종 상태 그리드 ── */}
      <div className="hrv4-seclbl">
        <span className="hrv4-seclbl-t">내 풀이</span>
        <span className="hrv4-seclbl-c">근거 데이터 4종</span>
      </div>
      <div className="hrv4-grid">
        <button type="button" className="hrv4-card">
          <span className="hrv4-card-go">›</span>
          <div className="hrv4-card-top">
            <span className="hrv4-card-emo">🌿</span>
            <span className="hrv4-card-name">개인 사주</span>
          </div>
          <div className="hrv4-status hrv4-s-ready"><span className="hrv4-sdot" />준비됨</div>
          <div className="hrv4-card-desc">타고난 결 다 풀어놨어. 바로 봐.</div>
        </button>

        <button type="button" className="hrv4-card">
          <span className="hrv4-card-go">›</span>
          <div className="hrv4-card-top">
            <span className="hrv4-card-emo">🧭</span>
            <span className="hrv4-card-name">기질</span>
          </div>
          <div className="hrv4-status hrv4-s-done"><span className="hrv4-sdot" />요약 완료</div>
          <div className="hrv4-card-desc">8축 중 통찰성 만렙. 디테일 봐봐.</div>
        </button>

        <button type="button" className="hrv4-card">
          <span className="hrv4-card-go">›</span>
          <div className="hrv4-card-top">
            <span className="hrv4-card-emo">🔗</span>
            <span className="hrv4-card-name">융합 풀이</span>
          </div>
          <div className="hrv4-status hrv4-s-ready"><span className="hrv4-sdot" />준비됨</div>
          <div className="hrv4-card-desc">사주랑 기질 겹쳐봤어. 약점 1개 잡힘.</div>
        </button>

        <button type="button" className="hrv4-card hrv4-locked">
          <span className="hrv4-card-go">🔒</span>
          <div className="hrv4-card-top">
            <span className="hrv4-card-emo">👨‍👩‍👧</span>
            <span className="hrv4-card-name">가족</span>
          </div>
          <div className="hrv4-status hrv4-s-lock"><span className="hrv4-sdot" />잠김</div>
          <div className="hrv4-card-desc">가족 생일 넣으면 열려. 2명 더 필요.</div>
        </button>
      </div>

      {/* ── 오늘 액션 체크리스트 ── */}
      <div className="hrv4-actions">
        <div className="hrv4-act-head">
          <span className="hrv4-act-h">오늘 할 거 (딱 3개)</span>
          <span className="hrv4-act-prog">1 / 3</span>
        </div>

        <div className="hrv4-act-item hrv4-done">
          <span className="hrv4-check hrv4-on">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="hrv4-act-txt">
            <div className="hrv4-act-label">아침에 물 한 잔 마시고 시작하기</div>
            <span className="hrv4-act-tag">기질: 추진성 높음 → 워밍업 필요</span>
          </div>
        </div>

        <div className="hrv4-act-item">
          <span className="hrv4-check" />
          <div className="hrv4-act-txt">
            <div className="hrv4-act-label">미뤄둔 메시지 1개만 오늘 답장하기</div>
            <span className="hrv4-act-tag">사주: 오늘은 매듭짓기 좋은 흐름</span>
          </div>
        </div>

        <div className="hrv4-act-item">
          <span className="hrv4-check" />
          <div className="hrv4-act-txt">
            <div className="hrv4-act-label">밤 11시 전 화면 끄기. 현타 오기 전에.</div>
            <span className="hrv4-act-tag">융합: 약한 음, 에너지 관리가 핵심</span>
          </div>
        </div>
      </div>

      {/* ── 다음 상담 큐 + 주간 흐름 ── */}
      <div className="hrv4-row2">
        <div className="hrv4-queue">
          <div className="hrv4-q-lbl">이어서 물어볼 거</div>
          <div className="hrv4-q-q">"지금 이 일, 버텨야 돼 옮겨야 돼?"</div>
          <div className="hrv4-q-meta">
            <span>어제 저장함</span>
            <span className="hrv4-dot" />
            <span>근거: 사주 + 기질</span>
          </div>
          <button type="button" className="hrv4-q-btn">이 고민 상담 이어가기</button>
        </div>

        <div className="hrv4-weekly">
          <div className="hrv4-wk-head">
            <span className="hrv4-wk-h">이번 주 마음 흐름</span>
            <span className="hrv4-wk-cap">주말 가니까 풀린다</span>
          </div>
          <div className="hrv4-bars">
            <div className="hrv4-bcol">
              <div className="hrv4-bwrap"><div className="hrv4-bar hrv4-down" style={{ height: "40%" }} /></div>
              <span className="hrv4-blbl">월</span>
            </div>
            <div className="hrv4-bcol">
              <div className="hrv4-bwrap"><div className="hrv4-bar hrv4-down" style={{ height: "28%" }} /></div>
              <span className="hrv4-blbl">화</span>
            </div>
            <div className="hrv4-bcol">
              <div className="hrv4-bwrap"><div className="hrv4-bar" style={{ height: "52%" }} /></div>
              <span className="hrv4-blbl">수</span>
            </div>
            <div className="hrv4-bcol">
              <div className="hrv4-bwrap"><div className="hrv4-bar" style={{ height: "60%" }} /></div>
              <span className="hrv4-blbl">목</span>
            </div>
            <div className="hrv4-bcol">
              <div className="hrv4-bwrap"><div className="hrv4-bar hrv4-up" style={{ height: "74%" }} /></div>
              <span className="hrv4-blbl">금</span>
            </div>
            <div className="hrv4-bcol">
              <div className="hrv4-bwrap"><div className="hrv4-bar hrv4-up" style={{ height: "88%" }} /></div>
              <span className="hrv4-blbl">토</span>
            </div>
            <div className="hrv4-bcol">
              <div className="hrv4-bwrap"><div className="hrv4-bar hrv4-up hrv4-today" style={{ height: "82%" }} /></div>
              <span className="hrv4-blbl hrv4-tlbl">오늘</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1차 진입 CTA + 로그인 보조 ── */}
      <div className="hrv4-cta-wrap">
        <button type="button" className="hrv4-cta">게스트로 시작하기</button>
        <div className="hrv4-cta-sub">가입 없이 바로. 풀이는 1분이면 떠.</div>
        <div className="hrv4-authrow">
          <button type="button" className="hrv4-authlink">이메일로 로그인</button>
          <button type="button" className="hrv4-authlink hrv4-ghost">회원가입</button>
        </div>
      </div>
    </div>
  );
}
