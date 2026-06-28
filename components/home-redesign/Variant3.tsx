export default function Variant3() {
  return (
    <div className="hrv3-root">
      <style>{`
        .hrv3-root {
          width: 100%;
          min-height: 100%;
          max-width: 100%;
          box-sizing: border-box;
          background:
            radial-gradient(circle at 12% 8%, rgba(194,72,60,0.06), transparent 40%),
            radial-gradient(circle at 88% 4%, rgba(57,213,160,0.10), transparent 38%),
            repeating-linear-gradient(45deg, rgba(31,29,26,0.018) 0 2px, transparent 2px 9px),
            var(--bg);
          color: var(--text);
          font-family: var(--font);
          padding: var(--space-3) var(--space-3) calc(var(--space-6) + 96px);
          overflow-x: hidden;
        }
        .hrv3-root * { box-sizing: border-box; }

        .hrv3-board {
          position: relative;
          border: 3px solid var(--text);
          border-radius: var(--radius-lg);
          background: var(--surface);
          box-shadow: 6px 7px 0 rgba(31,29,26,0.85), var(--shadow);
          padding: var(--space-4) var(--space-3) var(--space-3);
          margin-top: 22px;
        }
        .hrv3-board::before {
          content: "";
          position: absolute;
          inset: 6px;
          border: 1.5px dashed var(--border);
          border-radius: 13px;
          pointer-events: none;
        }
        .hrv3-nail {
          position: absolute; width: 11px; height: 11px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fff, var(--text-muted) 60%, var(--text));
          box-shadow: 0 1px 1px rgba(0,0,0,0.4);
        }
        .hrv3-nail-tl { top: -5px; left: 14px; }
        .hrv3-nail-tr { top: -5px; right: 14px; }
        .hrv3-nail-bl { bottom: -5px; left: 14px; }
        .hrv3-nail-br { bottom: -5px; right: 14px; }

        .hrv3-ribbon {
          position: absolute; top: -16px; left: 50%; transform: translateX(-50%) rotate(-1.5deg);
          background: var(--text); color: #fff;
          font-family: var(--font-brand);
          font-size: 12.5px; letter-spacing: 1px;
          padding: 5px 16px; border-radius: var(--radius-pill);
          white-space: nowrap; box-shadow: 2px 2px 0 rgba(194,72,60,0.55);
          max-width: 92%;
          z-index: 3;
        }
        .hrv3-blink {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: #39d5a0; margin-right: 6px; vertical-align: middle;
          box-shadow: 0 0 7px #39d5a0; animation: hrv3-pulse 1.3s ease-in-out infinite;
        }
        @keyframes hrv3-pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        .hrv3-masc-wrap { text-align: center; margin: 6px 0 2px; position: relative; }
        .hrv3-masc {
          width: 168px; height: 168px; max-width: 100%; object-fit: contain;
          border-radius: 22px;
          filter: drop-shadow(3px 4px 0 rgba(31,29,26,0.18));
        }
        .hrv3-stamp {
          position: absolute; font-family: var(--font-brand);
          font-weight: 700; text-align: center; line-height: 1.15;
          border: 2.5px solid currentColor; border-radius: 13px;
          padding: 7px 9px; background: var(--surface);
          font-size: 12.5px; z-index: 2;
        }
        .hrv3-stamp-red { color: var(--el-fire); transform: rotate(-9deg); top: 6px; left: 4px; box-shadow: 2px 2px 0 rgba(194,72,60,0.25); }
        .hrv3-stamp-neon {
          color: #117c5a; transform: rotate(8deg); top: 14px; right: 0;
          background: #d8fff0; border-color: #1aa87a;
          box-shadow: 2px 2px 0 rgba(26,168,122,0.3);
        }
        .hrv3-stamp small { display: block; font-size: 9.5px; font-weight: 400; opacity: 0.85; font-family: var(--font); }

        .hrv3-head {
          font-family: var(--font-brand);
          font-size: 27px; line-height: 1.28; text-align: center;
          margin: 10px 4px 4px; letter-spacing: -0.3px;
        }
        .hrv3-hi {
          background: linear-gradient(180deg, transparent 58%, #fff06b 58% 92%, transparent 92%);
          padding: 0 2px;
        }
        .hrv3-red { color: var(--el-fire); }
        .hrv3-sub {
          text-align: center; font-size: 13.5px; color: var(--text-sub);
          margin: 2px 10px 4px; line-height: 1.5;
        }
        .hrv3-sub b { color: var(--text); font-weight: 700; }

        .hrv3-mailbox {
          margin: 16px 2px 4px;
          border: 2.5px solid var(--text);
          border-radius: var(--radius);
          background: var(--surface-2);
          box-shadow: 4px 4px 0 rgba(31,29,26,0.8);
          overflow: hidden;
        }
        .hrv3-mailbox-tag {
          font-family: var(--font-brand); font-size: 12px;
          background: var(--text); color: #fff; padding: 5px 12px;
          display: flex; align-items: center; gap: 6px;
        }
        .hrv3-mailbox-dot { font-size: 13px; }
        .hrv3-field {
          padding: 11px 12px 9px; font-size: 14.5px; color: var(--text);
          line-height: 1.5; min-height: 46px;
        }
        .hrv3-ph { color: var(--text-muted); }
        .hrv3-cursor {
          display: inline-block; width: 2px; height: 17px; background: var(--el-fire);
          vertical-align: -3px; margin-left: 1px; animation: hrv3-caret 1s step-end infinite;
        }
        @keyframes hrv3-caret { 50% { opacity: 0; } }
        .hrv3-throw {
          width: 100%; border: none; border-top: 2.5px dashed var(--text);
          background: var(--el-fire); color: #fff;
          font-family: var(--font-brand); font-size: 17px; font-weight: 700;
          padding: 14px; cursor: pointer; letter-spacing: 0.5px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 52px;
        }
        .hrv3-arrow { font-size: 19px; }

        .hrv3-chips { display: flex; flex-wrap: wrap; gap: 7px; margin: 11px 2px 2px; }
        .hrv3-chip {
          border: 1.5px solid var(--border); background: var(--surface);
          color: var(--text); font-size: 12.5px; padding: 9px 12px;
          border-radius: var(--radius-pill); cursor: pointer; font-family: var(--font);
          min-height: 44px; display: inline-flex; align-items: center;
        }
        .hrv3-emo { margin-right: 3px; }

        .hrv3-strip-head {
          display: flex; align-items: center; gap: 7px;
          margin: 26px 4px 9px; font-family: var(--font-brand); font-size: 15px;
        }
        .hrv3-tape {
          background: #fff06b; color: #1f1d1a; font-size: 11px;
          padding: 2px 8px; border-radius: 4px; transform: rotate(-2deg);
          font-family: var(--font); border: 1px solid rgba(31,29,26,0.25);
        }
        .hrv3-strip {
          display: flex; gap: 11px; overflow-x: auto; padding: 4px 2px 10px;
          scrollbar-width: none; -webkit-overflow-scrolling: touch;
        }
        .hrv3-strip::-webkit-scrollbar { display: none; }
        .hrv3-receipt {
          flex: 0 0 232px;
          background: var(--surface);
          border: 1.5px solid var(--text);
          border-radius: 4px;
          padding: 11px 12px 12px;
          box-shadow: 3px 3px 0 rgba(31,29,26,0.18);
          position: relative;
        }
        .hrv3-receipt::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: -7px; height: 7px;
          background:
            radial-gradient(circle at 5px -1px, transparent 5px, var(--surface) 5px) repeat-x;
          background-size: 11px 7px;
          filter: drop-shadow(0 2px 0 rgba(31,29,26,0.12));
        }
        .hrv3-rtag {
          display: inline-block; font-size: 10.5px; font-weight: 700;
          padding: 2px 7px; border-radius: var(--radius-pill); margin-bottom: 7px;
          font-family: var(--font);
        }
        .hrv3-ans {
          font-family: var(--font-serif); font-size: 14px; line-height: 1.62; color: var(--text);
        }
        .hrv3-ans b { color: var(--el-fire); font-weight: 700; }
        .hrv3-ago { font-size: 10.5px; color: var(--text-muted); margin-top: 9px; }
        .hrv3-rtag-fire { background: var(--el-fire-bg); color: var(--el-fire); }
        .hrv3-rtag-water { background: var(--el-water-bg); color: var(--el-water); }
        .hrv3-rtag-wood { background: var(--el-wood-bg); color: var(--el-wood); }

        .hrv3-menu-head {
          font-family: var(--font-brand); font-size: 15px; margin: 26px 4px 11px;
          display: flex; align-items: center; gap: 6px;
        }
        .hrv3-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .hrv3-mitem {
          border: 2px solid var(--text); border-radius: var(--radius);
          background: var(--surface); padding: 12px 11px 11px; cursor: pointer;
          box-shadow: 3px 3px 0 rgba(31,29,26,0.7); position: relative; overflow: hidden;
        }
        .hrv3-ic { font-size: 24px; }
        .hrv3-nm { font-family: var(--font-brand); font-size: 15px; margin-top: 5px; }
        .hrv3-ds { font-size: 11.5px; color: var(--text-sub); margin-top: 3px; line-height: 1.45; }
        .hrv3-corner {
          position: absolute; top: 0; right: 0;
          width: 0; height: 0; border-style: solid;
          border-width: 0 26px 26px 0;
        }
        .hrv3-corner-w { border-color: transparent var(--el-water) transparent transparent; }
        .hrv3-corner-e { border-color: transparent var(--el-earth) transparent transparent; }
        .hrv3-corner-g { border-color: transparent var(--el-wood) transparent transparent; }
        .hrv3-corner-f { border-color: transparent var(--el-fire) transparent transparent; }

        .hrv3-action {
          margin: 22px 2px 2px;
          border: 2.5px solid var(--text);
          border-radius: var(--radius);
          background: var(--el-earth-bg);
          padding: 14px 14px 13px;
          box-shadow: 4px 4px 0 rgba(31,29,26,0.8);
          transform: rotate(-0.6deg);
        }
        .hrv3-action-lbl {
          font-family: var(--font-brand); font-size: 12.5px; color: var(--el-fire);
          letter-spacing: 1px; display: flex; align-items: center; gap: 5px;
        }
        .hrv3-action-txt { font-size: 15.5px; line-height: 1.55; margin-top: 6px; font-weight: 600; color: var(--text); }
        .hrv3-action-txt b { color: var(--el-fire); }
        .hrv3-chk {
          margin-top: 11px; display: inline-flex; align-items: center; gap: 8px;
          border: 2px solid var(--text); border-radius: var(--radius-pill);
          padding: 8px 14px; font-size: 13px; font-weight: 700; cursor: pointer;
          background: var(--surface); color: var(--text); min-height: 44px;
        }
        .hrv3-chk-box {
          width: 16px; height: 16px; border: 2px solid var(--text); border-radius: 4px; display: inline-block;
        }

        .hrv3-foot-stamp {
          text-align: center; margin: 22px 0 0; font-family: var(--font-brand);
          color: var(--text-muted); font-size: 12px;
        }
        .hrv3-seal {
          display: inline-block; border: 2px solid var(--el-fire); color: var(--el-fire);
          border-radius: 50%; width: 52px; height: 52px; line-height: 1.15;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          margin: 0 auto 7px; font-size: 12.5px; transform: rotate(-7deg);
          box-shadow: 1px 1px 0 rgba(194,72,60,0.2);
        }

        .hrv3-dock {
          position: fixed; left: 0; right: 0; bottom: 0;
          max-width: 390px; margin: 0 auto;
          background: var(--surface);
          border-top: 3px solid var(--text);
          box-shadow: 0 -4px 14px rgba(31,29,26,0.14);
          padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
          z-index: 20;
        }
        .hrv3-cta {
          width: 100%; min-height: 52px;
          background: var(--text); color: #fff;
          border: none; border-radius: var(--radius);
          font-family: var(--font-brand); font-size: 17px; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          box-shadow: 3px 3px 0 var(--el-fire);
        }
        .hrv3-neon-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #39d5a0;
          box-shadow: 0 0 8px #39d5a0; animation: hrv3-pulse 1.3s ease-in-out infinite;
        }
        .hrv3-login {
          text-align: center; margin-top: 9px; font-size: 12.5px; color: var(--text-sub);
        }
        .hrv3-login a { color: var(--link); text-decoration: none; font-weight: 600; }
        .hrv3-sep { color: var(--border); margin: 0 7px; }
        .hrv3-free { color: var(--text-muted); }
      `}</style>

      <div className="hrv3-board">
        <span className="hrv3-nail hrv3-nail-tl" /><span className="hrv3-nail hrv3-nail-tr" />
        <span className="hrv3-nail hrv3-nail-bl" /><span className="hrv3-nail hrv3-nail-br" />
        <div className="hrv3-ribbon"><span className="hrv3-blink" />지금 영업 중 · 동네 사주 상담소</div>

        <div className="hrv3-masc-wrap">
          <span className="hrv3-stamp hrv3-stamp-red">운 탓?<br/>성격 탓?<small>둘 다 봐줌</small></span>
          <span className="hrv3-stamp hrv3-stamp-neon">반말<br/>주의<small>팩폭 함</small></span>
          <img className="hrv3-masc" src="/brand-icons/saju-duo-bgrade/bgrade-duo-app-mascot.png" alt="사주언니 기질오빠 마스코트" />
        </div>

        <h1 className="hrv3-head">
          고민? <span className="hrv3-hi">일단 던져봐.</span><br/>
          <span className="hrv3-red">사주 + 성격</span> 둘 다 까서<br/>답해줄게.
        </h1>
        <p className="hrv3-sub">점이 아니라 <b>데이터</b>야. 만세력이랑 8축 성격검사로 까보고 오늘 할 거 딱 하나 정해준다.</p>

        <div className="hrv3-mailbox">
          <div className="hrv3-mailbox-tag"><span className="hrv3-mailbox-dot">✍️</span> 언니오빠한테 던지기</div>
          <div className="hrv3-field">
            <span className="hrv3-ph">이직해야 하나... 지금 회사 6년 째인데</span><span className="hrv3-cursor" />
          </div>
          <button type="button" className="hrv3-throw"><span className="hrv3-arrow">→</span> 던지기</button>
        </div>

        <div className="hrv3-chips">
          <button type="button" className="hrv3-chip"><span className="hrv3-emo">💸</span>돈 들어와?</button>
          <button type="button" className="hrv3-chip"><span className="hrv3-emo">💔</span>이 사람 손절?</button>
          <button type="button" className="hrv3-chip"><span className="hrv3-emo">🔥</span>지금 이직각?</button>
          <button type="button" className="hrv3-chip"><span className="hrv3-emo">🌫️</span>현타 왔어</button>
        </div>
      </div>

      <div className="hrv3-strip-head">📮 방금 나간 답들 <span className="hrv3-tape">남들 건 익명</span></div>
      <div className="hrv3-strip">
        <div className="hrv3-receipt">
          <span className="hrv3-rtag hrv3-rtag-fire">이직 고민</span>
          <p className="hrv3-ans">운 탓 70%, <b>네 성격 탓 30%</b>야. 올해 흐름은 들어오는데, 넌 일 벌이고 못 닫는 결이거든. 오늘은 선택지 <b>2개로 줄여.</b></p>
          <p className="hrv3-ago">방금 전</p>
        </div>
        <div className="hrv3-receipt">
          <span className="hrv3-rtag hrv3-rtag-water">관계 손절</span>
          <p className="hrv3-ans">손절각 맞아. 근데 넌 <b>정 많아서 못 끊는 타입</b>이라 또 붙잡을걸? 끊을 거면 오늘 <b>연락처부터</b> 정리해.</p>
          <p className="hrv3-ago">3분 전</p>
        </div>
        <div className="hrv3-receipt">
          <span className="hrv3-rtag hrv3-rtag-wood">돈 운</span>
          <p className="hrv3-ans">하반기 들어와. 근데 <b>존버가 답</b>이야, 지금 벌이면 다 샌다. 큰 결정은 가을까지 <b>봉인.</b></p>
          <p className="hrv3-ago">8분 전</p>
        </div>
      </div>

      <div className="hrv3-menu-head">🗂️ 까볼 근거 — 풀이 메뉴판</div>
      <div className="hrv3-menu">
        <div className="hrv3-mitem"><span className="hrv3-corner hrv3-corner-w" /><div className="hrv3-ic">🌙</div><div className="hrv3-nm">개인 사주</div><div className="hrv3-ds">만세력으로 본 네 평생 결</div></div>
        <div className="hrv3-mitem"><span className="hrv3-corner hrv3-corner-e" /><div className="hrv3-ic">🧭</div><div className="hrv3-nm">기질 풀이</div><div className="hrv3-ds">8축 성격검사로 본 진짜 너</div></div>
        <div className="hrv3-mitem"><span className="hrv3-corner hrv3-corner-g" /><div className="hrv3-ic">🔗</div><div className="hrv3-nm">융합 풀이</div><div className="hrv3-ds">사주 × 성격 합쳐서 한 방</div></div>
        <div className="hrv3-mitem"><span className="hrv3-corner hrv3-corner-f" /><div className="hrv3-ic">👨‍👩‍👧</div><div className="hrv3-nm">가족 풀이</div><div className="hrv3-ds">부모·짝·애랑 궁합 결</div></div>
      </div>

      <div className="hrv3-action">
        <div className="hrv3-action-lbl">📌 오늘 딱 하나만 해</div>
        <div className="hrv3-action-txt">오늘은 새 일 벌이지 말고, <b>벌여둔 것 중 하나만</b> 끝까지 닫아. 네 결이 자꾸 시작만 하거든.</div>
        <div className="hrv3-chk"><span className="hrv3-chk-box" /> 했음, 도장 쾅</div>
      </div>

      <div className="hrv3-foot-stamp">
        <div className="hrv3-seal">무료<br/>체험</div>
        <div>가입 없이 일단 들어와서 한 판 던져봐.</div>
      </div>

      <div className="hrv3-dock">
        <button type="button" className="hrv3-cta"><span className="hrv3-neon-dot" /> 게스트로 시작하기</button>
        <div className="hrv3-login">
          <span className="hrv3-free">이미 단골이면 </span>
          <a href="#">이메일로 로그인</a>
          <span className="hrv3-sep">·</span>
          <a href="#">회원가입</a>
        </div>
      </div>
    </div>
  );
}
