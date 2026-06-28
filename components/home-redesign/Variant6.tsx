export default function Variant6() {
  const dayun = [
    { age: "5세", season: "winter", active: false },
    { age: "15세", season: "winter", active: false },
    { age: "25세", season: "spring", active: false },
    { age: "35세", season: "spring", active: true },
    { age: "45세", season: "summer", active: false },
    { age: "55세", season: "summer", active: false },
    { age: "65세", season: "autumn", active: false },
    { age: "75세", season: "autumn", active: false },
    { age: "85세", season: "winter", active: false },
  ];
  const cx = 160;
  const cy = 160;
  const rDot = 116;
  const seasonColor: Record<string, string> = {
    spring: "var(--season-spring-deep)",
    summer: "var(--season-summer-deep)",
    autumn: "var(--season-autumn-deep)",
    winter: "var(--season-winter-deep)",
  };
  const dots = dayun.map((d, i) => {
    const angle = -90 + (360 / dayun.length) * i;
    const rad = (angle * Math.PI) / 180;
    return {
      ...d,
      x: cx + rDot * Math.cos(rad),
      y: cy + rDot * Math.sin(rad),
    };
  });

  return (
    <div className="hrv6-root">
      <style>{`
        .hrv6-root {
          width: 100%;
          min-height: 100%;
          background:
            radial-gradient(120% 90% at 50% 0%, var(--surface) 0%, var(--bg) 62%);
          font-family: var(--font);
          color: var(--text);
          box-sizing: border-box;
          padding: 0 0 40px;
          overflow-x: hidden;
        }
        .hrv6-root * { box-sizing: border-box; }

        .hrv6-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 8px;
        }
        .hrv6-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .hrv6-brandimg {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: contain;
          background: var(--surface-2);
          border: 1px solid var(--border);
          flex: none;
        }
        .hrv6-brandname {
          font-family: var(--font-brand);
          font-size: 16px;
          line-height: 1.15;
          color: var(--text);
        }
        .hrv6-brandsub {
          font-size: 11px;
          color: var(--text-sub);
          letter-spacing: 0.02em;
          margin-top: 2px;
        }
        .hrv6-login {
          font-size: 13px;
          color: var(--link);
          text-decoration: none;
          min-height: 44px;
          padding: 8px 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font);
          flex: none;
        }

        .hrv6-hero {
          position: relative;
          margin: 4px auto 0;
          width: 320px;
          max-width: 88vw;
        }
        .hrv6-svg { display: block; width: 100%; height: auto; }

        .hrv6-quad-label {
          font-family: var(--font-brand);
          font-size: 12px;
          letter-spacing: 0.04em;
        }
        .hrv6-center-cap {
          font-size: 10.5px;
          fill: var(--text-sub);
          letter-spacing: 0.06em;
        }
        .hrv6-center-main {
          font-family: var(--font-brand);
          font-size: 15px;
          fill: var(--text);
        }
        .hrv6-age {
          font-size: 9.5px;
          fill: var(--text-sub);
          font-family: var(--font);
        }

        .hrv6-flow {
          margin: 6px 20px 0;
          text-align: center;
        }
        .hrv6-flow-tag {
          display: inline-block;
          font-size: 11px;
          color: var(--el-water);
          background: var(--el-water-bg);
          border-radius: var(--radius-pill);
          padding: 4px 12px;
          margin-bottom: 12px;
          letter-spacing: 0.02em;
        }
        .hrv6-flow-line {
          font-family: var(--font-brand-serif);
          font-size: 18px;
          line-height: 1.55;
          color: var(--text);
          margin: 0;
          word-break: keep-all;
        }
        .hrv6-flow-line b {
          color: var(--el-fire);
          font-weight: inherit;
          border-bottom: 2px solid var(--el-fire-bg);
        }

        .hrv6-basis {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin: 16px 18px 0;
        }
        .hrv6-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          padding: 7px 11px 7px 8px;
        }
        .hrv6-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex: none;
        }

        .hrv6-cta-wrap {
          margin: 22px 20px 0;
        }
        .hrv6-cta {
          width: 100%;
          min-height: 54px;
          border: none;
          border-radius: var(--radius-lg);
          background: var(--text);
          color: var(--bg);
          font-family: var(--font);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: var(--shadow);
        }
        .hrv6-cta-hint {
          text-align: center;
          font-size: 12px;
          color: var(--text-sub);
          margin: 9px 0 0;
        }

        .hrv6-actions {
          margin: 26px 20px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .hrv6-act {
          text-align: left;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 13px 12px;
          cursor: pointer;
          font-family: var(--font);
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 88px;
        }
        .hrv6-act-ico {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          margin-bottom: 2px;
          flex: none;
        }
        .hrv6-act-t {
          font-size: 14px;
          color: var(--text);
          font-weight: 500;
        }
        .hrv6-act-s {
          font-size: 11.5px;
          color: var(--text-sub);
          line-height: 1.35;
          word-break: keep-all;
        }

        .hrv6-today {
          margin: 22px 20px 0;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-left: 3px solid var(--el-wood);
          border-radius: var(--radius);
          padding: 14px 16px;
        }
        .hrv6-today-k {
          font-size: 11px;
          color: var(--el-wood);
          letter-spacing: 0.04em;
          margin: 0 0 5px;
        }
        .hrv6-today-v {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text);
          margin: 0;
          word-break: keep-all;
        }
        .hrv6-foot {
          margin: 24px 20px 0;
          text-align: center;
          font-size: 12px;
          color: var(--text-sub);
        }
        .hrv6-foot a {
          color: var(--link);
          text-decoration: none;
          display: inline-block;
          min-height: 44px;
          line-height: 44px;
          padding: 0 4px;
        }
        .hrv6-foot-sep { color: var(--border); }
      `}</style>

      <div className="hrv6-top">
        <div className="hrv6-brand">
          <img className="hrv6-brandimg" src="/brand-icons/persona-duo.png" alt="" />
          <div>
            <div className="hrv6-brandname">사주언니 · 기질오빠</div>
            <div className="hrv6-brandsub">사주 + 기질로 보는 내 결</div>
          </div>
        </div>
        <button type="button" className="hrv6-login">로그인</button>
      </div>

      <div className="hrv6-hero">
        <svg
          className="hrv6-svg"
          viewBox="0 0 320 320"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="계절 시계: 한가운데 큰 점은 타고난 결, 둘레 아홉 점은 10년 단위 흐름"
        >
          <defs>
            <clipPath id="hrv6-clip">
              <circle cx="160" cy="160" r="150" />
            </clipPath>
          </defs>

          <g clipPath="url(#hrv6-clip)">
            <rect x="160" y="10" width="150" height="150" fill="var(--season-spring-bg)" />
            <rect x="160" y="160" width="150" height="150" fill="var(--season-autumn-bg)" />
            <rect x="10" y="160" width="150" height="150" fill="var(--season-winter-bg)" />
            <rect x="10" y="10" width="150" height="150" fill="var(--season-summer-bg)" />
          </g>

          <circle cx="160" cy="160" r="150" fill="none" stroke="var(--border)" strokeWidth="1" />
          <circle cx="160" cy="160" r="116" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 5" opacity="0.7" />
          <line x1="160" y1="14" x2="160" y2="306" stroke="var(--border)" strokeWidth="1" opacity="0.55" />
          <line x1="14" y1="160" x2="306" y2="160" stroke="var(--border)" strokeWidth="1" opacity="0.55" />

          <text className="hrv6-quad-label" x="216" y="58" textAnchor="middle" fill="var(--season-spring-deep)">봄</text>
          <text className="hrv6-quad-label" x="104" y="58" textAnchor="middle" fill="var(--season-summer-deep)">여름</text>
          <text className="hrv6-quad-label" x="104" y="270" textAnchor="middle" fill="var(--season-winter-deep)">겨울</text>
          <text className="hrv6-quad-label" x="216" y="270" textAnchor="middle" fill="var(--season-autumn-deep)">가을</text>

          {dots.map((d, i) => {
            const c = seasonColor[d.season];
            if (d.active) {
              return (
                <g key={i}>
                  <circle cx={d.x} cy={d.y} r="11" fill="none" stroke={c} strokeWidth="2.5" />
                  <circle cx={d.x} cy={d.y} r="5.5" fill={c} />
                </g>
              );
            }
            return <circle key={i} cx={d.x} cy={d.y} r="5" fill={c} opacity="0.42" />;
          })}

          {dots.map((d, i) => {
            if (i !== 0 && i !== dots.length - 1 && !d.active) return null;
            const out = d.x >= 160;
            return (
              <text
                key={"a" + i}
                className="hrv6-age"
                x={d.x + (out ? 14 : -14)}
                y={d.y + 3.5}
                textAnchor={out ? "start" : "end"}
              >
                {d.age}
              </text>
            );
          })}

          <circle cx="160" cy="160" r="39" fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="160" cy="160" r="9" fill="var(--el-wood)" />
          <circle cx="160" cy="160" r="15" fill="none" stroke="var(--el-wood)" strokeWidth="1" opacity="0.4" />
          <text className="hrv6-center-main" x="160" y="147" textAnchor="middle">곧게 뻗는</text>
          <text className="hrv6-center-main" x="160" y="165" textAnchor="middle">나무 같은 사람</text>
          <text className="hrv6-center-cap" x="160" y="200" textAnchor="middle">타고난 결</text>
        </svg>
      </div>

      <div className="hrv6-flow">
        <span className="hrv6-flow-tag">지금 너의 흐름 · 35세 봄 구간</span>
        <p className="hrv6-flow-line">
          뿌리는 단단한데 가지를 안 뻗고 있네. 운 탓 <b>30%</b>, 네 망설임 탓 <b>70%</b>. 오늘은 미룬 것 딱 하나만 손대.
        </p>
      </div>

      <div className="hrv6-basis">
        <span className="hrv6-chip"><span className="hrv6-dot" style={{ background: "var(--el-wood)" }} />타고난 결 · 봄 기운</span>
        <span className="hrv6-chip"><span className="hrv6-dot" style={{ background: "var(--el-fire)" }} />기질 8축 · 추진성 강</span>
      </div>

      <div className="hrv6-cta-wrap">
        <button type="button" className="hrv6-cta">
          게스트로 시작하기
          <span aria-hidden="true">→</span>
        </button>
        <p className="hrv6-cta-hint">가입 없이 바로 시작 · 30초면 첫 결과 나와</p>
      </div>

      <div className="hrv6-actions">
        <button type="button" className="hrv6-act">
          <span className="hrv6-act-ico" style={{ background: "var(--el-wood-bg)", color: "var(--el-wood)" }}>◔</span>
          <span className="hrv6-act-t">개인 사주</span>
          <span className="hrv6-act-s">타고난 결과 10년 흐름</span>
        </button>
        <button type="button" className="hrv6-act">
          <span className="hrv6-act-ico" style={{ background: "var(--el-fire-bg)", color: "var(--el-fire)" }}>◑</span>
          <span className="hrv6-act-t">기질 검사</span>
          <span className="hrv6-act-s">성격 8축, 진짜 내 성향</span>
        </button>
        <button type="button" className="hrv6-act">
          <span className="hrv6-act-ico" style={{ background: "var(--el-water-bg)", color: "var(--el-water)" }}>◕</span>
          <span className="hrv6-act-t">융합 풀이</span>
          <span className="hrv6-act-s">사주 × 기질 합본</span>
        </button>
        <button type="button" className="hrv6-act">
          <span className="hrv6-act-ico" style={{ background: "var(--el-earth-bg)", color: "var(--el-earth)" }}>◓</span>
          <span className="hrv6-act-t">가족 풀이</span>
          <span className="hrv6-act-s">부모·짝·아이와의 결</span>
        </button>
      </div>

      <div className="hrv6-today">
        <p className="hrv6-today-k">오늘 할 액션 하나</p>
        <p className="hrv6-today-v">머릿속에서 3주째 굴리는 그 연락, 오늘 안에 첫 문장만 보내. 완벽한 타이밍 같은 건 네 봄엔 안 와. 봄은 그냥 싹 틔우는 계절이야.</p>
      </div>

      <div className="hrv6-foot">
        이미 계정이 있으신가요? <a href="#">이메일로 로그인</a> <span className="hrv6-foot-sep">·</span> <a href="#">회원가입</a>
      </div>
    </div>
  );
}
