"use client";

import { type ComponentType, useCallback, useEffect, useState } from "react";
import Variant1 from "@/components/home-redesign/Variant1";
import Variant2 from "@/components/home-redesign/Variant2";
import Variant3 from "@/components/home-redesign/Variant3";
import Variant4 from "@/components/home-redesign/Variant4";
import Variant5 from "@/components/home-redesign/Variant5";
import Variant6 from "@/components/home-redesign/Variant6";
import Variant7 from "@/components/home-redesign/Variant7";

type Variant = {
  n: number;
  prefix: string;
  personaName: string;
  personaManifesto: string;
  variantTitle: string;
  concept: string;
  bestFor: string;
  signatureMove: string;
  Comp: ComponentType;
};

// 7명의 디자이너 페르소나가 서브에이전트로 각자 만든 홈 시안 — 번호로 골라 결정한다.
const VARIANTS: Variant[] = [
  {
    n: 1,
    prefix: "hrv1",
    personaName: `여백주의자 — 미니멀 절제파`,
    personaManifesto: `홈은 질문 하나만 받는 그릇이다. 사주도 기질도 리포트도 지금 당장은 보여주지 않는다 — 묻고 싶은 한 문장만 받아내면 나머지는 알아서 따라온다.`,
    variantTitle: `한 줄만 묻는 홈`,
    concept: `화면 전체를 비워 단 하나의 큰 질문 입력 필드에 시선을 묶는다. 브랜드 마크는 점 하나만큼, 리포트 메뉴는 접고, 오직 질문과 단일 CTA만 남긴다.`,
    bestFor: `진입 장벽이 0이어야 할 때. 곧장 "고민 한 줄"을 적게 만들어 첫 상담 전환을 최대화.`,
    signatureMove: `화면 한가운데 깜빡이는 먹빛 캐럿 한 점 — 페이지에서 유일하게 움직이는 요소.`,
    Comp: Variant1,
  },
  {
    n: 2,
    prefix: "hrv2",
    personaName: `표지 디자이너 — 에디토리얼 매거진파`,
    personaManifesto: `홈은 매거진 표지다. 큰 명조 헤드라인과 큰 캐릭터 비주얼로 감정을 먼저 때리고, 진입 동선은 작고 단정하게 깐다. 스크린샷 찍어 공유하고 싶은 한 장면.`,
    variantTitle: `오늘의 표지`,
    concept: `매일 바뀌는 잡지 표지처럼 '오늘의 한 줄'을 거대한 명조 헤드라인으로 박는다. 풀블리드 듀오 위에 제호·이슈번호·발행일을 얹어 한 장의 표지를 완성.`,
    bestFor: `감정적 임팩트와 공유성이 전환보다 중요한 첫인상 구간, 브랜드 보이스를 한 방에 각인.`,
    signatureMove: `마스트헤드 + 이슈번호 + 발행일 + 거대 명조 헤드라인이 한 장 풀블리드 표지로 합쳐짐.`,
    Comp: Variant2,
  },
  {
    n: 3,
    prefix: "hrv3",
    personaName: `동네 상담소 간판장이 — B급 캐릭터파`,
    personaManifesto: `수상한데 자꾸 믿음 가는 동네 점집 간판 한 장. 손글씨·도장·스티커·형광 네온으로 정신없지만, 그 정신없음이 정겹고 그 정겨움이 사람을 들어오게 한다.`,
    variantTitle: `동네 점집 간판`,
    concept: `간판장이가 밤새 칠한 동네 상담소 간판을 그대로 홈으로. 비뚤배뚤 손글씨 위에 빨간 도장·형광 스티커, 마스코트가 한가운데서 호객. "언니오빠한테 던지기" 입력칸이 우편함처럼 박혀 있다.`,
    bestFor: `무난한 카드 UI에 질려 "이거 뭔데 웃기네" 하고 일단 눌러보게 만들 때.`,
    signatureMove: `형광 도장 뱃지("운 탓? 성격 탓?") + 거친 테두리 입력칸 + 영수증처럼 톱니로 잘린 '방금 나간 답' 스트립.`,
    Comp: Variant3,
  },
  {
    n: 4,
    prefix: "hrv4",
    personaName: `운영실장 — 정보밀도 대시보드파`,
    personaManifesto: `재방문 사용자에게 홈은 랜딩이 아니라 콘솔이다. 리포트 4종 상태·오늘 액션·상담 큐·주간 흐름을 한 화면 위젯 보드로 깔아, 0초 안에 "다음에 뭘 할지"가 보이게 한다.`,
    variantTitle: `콘솔 보드`,
    concept: `인사+날짜 아래로 사주·기질·융합·가족 4종 리포트 상태 그리드 / 오늘 액션 체크리스트 / 다음 상담 큐 / 주간 마음흐름 미니 막대를 촘촘한 위젯 보드로 배치. 색은 상태 신호로만.`,
    bestFor: `이미 리포트를 한 번 본 재방문 사용자가 매일 들러 "오늘 뭘 할지"를 빠르게 고를 때.`,
    signatureMove: `리포트 4종을 상태 점(준비됨·요약완료·잠김)으로 신호화한 2×2 그리드 + 7일 마음흐름 막대 미니차트.`,
    Comp: Variant4,
  },
  {
    n: 5,
    prefix: "hrv5",
    personaName: `메신저 빌더 — 대화 우선파`,
    personaManifesto: `채팅이 곧 홈이다. 사용자가 "선택"하기 전에 이미 대화가 시작돼 있어야 한다. 첫 화면을 살아 있는 스레드로 채워 묻는 순간 바로 답이 따라오게 한다.`,
    variantTitle: `바로 대화창 홈`,
    concept: `홈을 통째로 메신저 스레드로. 상단 듀오 헤더 아래 이미 언니오빠가 먼저 말을 건 대화가 깔려 있고, 근거 칩(사주·기질·융합)이 붙은 답이 보인다. 추천 질문 칩이나 하단 sticky 입력창으로 바로 상담 시작.`,
    bestFor: `"뭘 눌러야 하지" 고민 없이 바로 말 걸고 싶은 사용자, 진입 직후 이탈 방지.`,
    signatureMove: `하단 sticky 입력창 위 가로 스크롤 추천 칩 + 답 말풍선마다 근거 데이터 칩이 인라인으로 박혀 신뢰를 줌.`,
    Comp: Variant5,
  },
  {
    n: 6,
    prefix: "hrv6",
    personaName: `명리 시각화가 — 계절시계/오행 비주얼파`,
    personaManifesto: `사주답게. 홈에 들어오자마자 글자가 아니라 '내 계절 시계'를 먼저 본다. 오행 5색과 사계절을 절제된 신호로 깔고, 한가운데 큰 점 하나가 "이게 네 타고난 결"이라 말 건다.`,
    variantTitle: `계절 시계 홈`,
    concept: `인라인 SVG 계절 시계가 히어로. 4분면 계절색(봄=목/여름=화/가을=토/겨울=수)이 은은히 깔리고, 중앙 큰 점은 '타고난 결', 둘레 9개 점은 '10년 단위 흐름'. 아래로 오늘의 흐름 한 줄 + 근거 칩 + CTA.`,
    bestFor: `"사주 서비스답다"는 첫인상이 중요할 때. 비주얼로 정체성을 각인시키고 자기 결을 보고 싶게.`,
    signatureMove: `중앙 '타고난 결' 점에서 둘레 '10년 흐름'까지 가는 살아있는 계절 시계 — 현재 대운만 채워진 링으로 하이라이트.`,
    Comp: Variant6,
  },
  {
    n: 7,
    prefix: "hrv7",
    personaName: `첫인상 설계자 — 온보딩/감정 체크인파`,
    personaManifesto: `진입 장벽은 0이어야 한다. 긴 질문을 쓰게 만들지 말고, 지금 기분 버튼 하나만 누르면 질문이 알아서 완성되게 한다 — 30초 안에, 따뜻하게.`,
    variantTitle: `30초 기분 체크인`,
    concept: `타이핑 없이 '지금 내 상태' 칩 하나만 누르면 그 감정에 맞는 반말 질문 문장이 카드 안에서 자동 완성된다. 고르기만 하면 1차 CTA가 그 질문으로 바로 상담을 연다.`,
    bestFor: `첫 방문자·게스트가 뭘 물어야 할지 몰라 막막할 때. 빈 입력창 공포를 없애고 30초 안에 첫 상담으로.`,
    signatureMove: `감정 칩을 누르면 미리보기 카드의 질문 문장이 반말로 갈아끼워지는 라이브 조립 — 타이핑 0, 빈 입력창 공포 0.`,
    Comp: Variant7,
  },
];

const CHOICE_KEY = "home-redesign-choice";

export default function HomeRedesignPage() {
  const [selected, setSelected] = useState(1);
  const [chosen, setChosen] = useState<number | null>(null);

  // 결정값 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHOICE_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        if (n >= 1 && n <= VARIANTS.length) {
          setChosen(n);
          setSelected(n);
        }
      }
    } catch {
      /* localStorage 비활성 무시 */
    }
  }, []);

  const decide = useCallback((n: number) => {
    setChosen(n);
    try {
      localStorage.setItem(CHOICE_KEY, String(n));
    } catch {
      /* 무시 */
    }
  }, []);

  // 키보드: 1~7 선택, ←/→ 이동, Enter 결정
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key >= "1" && e.key <= String(VARIANTS.length)) {
        setSelected(parseInt(e.key, 10));
      } else if (e.key === "ArrowRight") {
        setSelected((s) => (s % VARIANTS.length) + 1);
      } else if (e.key === "ArrowLeft") {
        setSelected((s) => ((s - 2 + VARIANTS.length) % VARIANTS.length) + 1);
      } else if (e.key === "Enter") {
        setSelected((s) => {
          decide(s);
          return s;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  const active = VARIANTS.find((v) => v.n === selected) ?? VARIANTS[0];
  const ActiveComp = active.Comp;

  return (
    <main className="hr-page">
      <header className="hr-head">
        <div className="hr-head-top">
          <div className="hr-title">
            <span className="hr-kicker">HOME REDESIGN · 페르소나 7시안</span>
            <h1>번호로 골라 결정하기</h1>
            <p>디자이너 7인을 주입해 각자 만든 홈 시안입니다. 숫자 1–7 키(또는 ←/→)로 넘기고, 마음에 드는 안에서 결정하세요.</p>
          </div>
          {chosen != null && (
            <div className="hr-chosen-flag" role="status">
              <span className="hr-chosen-flag-n">{chosen}</span>
              <span>
                <em>결정됨</em>
                <strong>{VARIANTS[chosen - 1].variantTitle}</strong>
              </span>
            </div>
          )}
        </div>

        <nav className="hr-rail" aria-label="시안 번호 선택">
          {VARIANTS.map((v) => {
            const isActive = v.n === selected;
            const isChosen = v.n === chosen;
            return (
              <button
                key={v.n}
                type="button"
                className={`hr-num${isActive ? " active" : ""}${isChosen ? " chosen" : ""}`}
                aria-pressed={isActive}
                aria-label={`${v.n}번 ${v.variantTitle}`}
                onClick={() => setSelected(v.n)}
              >
                <span className="hr-num-d">{v.n}</span>
                <span className="hr-num-t">{v.variantTitle}</span>
                {isChosen && <span className="hr-num-check" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </nav>
      </header>

      <section className="hr-stage">
        <div className="hr-phone-wrap">
          <div className="hr-phone">
            <div className="hr-notch" aria-hidden="true" />
            <div className="hr-screen" key={active.n}>
              <ActiveComp />
            </div>
          </div>
          <div className="hr-phone-cap">{active.n}번 · {active.variantTitle}</div>
        </div>

        <aside className="hr-note">
          <div className="hr-note-head">
            <span className="hr-note-n">{active.n}</span>
            <div>
              <h2>{active.variantTitle}</h2>
              <p className="hr-note-persona">{active.personaName}</p>
            </div>
          </div>
          <p className="hr-note-manifesto">“{active.personaManifesto}”</p>
          <dl className="hr-note-dl">
            <div>
              <dt>컨셉</dt>
              <dd>{active.concept}</dd>
            </div>
            <div>
              <dt>이길 때</dt>
              <dd>{active.bestFor}</dd>
            </div>
            <div>
              <dt>시그니처</dt>
              <dd>{active.signatureMove}</dd>
            </div>
          </dl>

          <button
            type="button"
            className={`hr-decide${chosen === active.n ? " done" : ""}`}
            onClick={() => decide(active.n)}
          >
            {chosen === active.n ? `✓ ${active.n}번으로 결정됨` : `이 시안(${active.n}번)으로 결정`}
          </button>
          {chosen != null && chosen !== active.n && (
            <p className="hr-decide-hint">
              현재 결정: <strong>{chosen}번 {VARIANTS[chosen - 1].variantTitle}</strong>
            </p>
          )}
        </aside>
      </section>

      <style>{`
        .hr-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font);
          padding: max(16px, var(--safe-t)) max(16px, var(--safe-r)) 40px max(16px, var(--safe-l));
        }

        /* ── 헤더 ── */
        .hr-head {
          position: sticky;
          top: 0;
          z-index: 20;
          background: color-mix(in srgb, var(--bg) 92%, transparent);
          backdrop-filter: blur(12px);
          margin: 0 calc(-1 * max(16px, var(--safe-l))) 0 calc(-1 * max(16px, var(--safe-r)));
          padding: 14px max(16px, var(--safe-r)) 12px max(16px, var(--safe-l));
          border-bottom: 1px solid var(--border);
        }
        .hr-head-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          max-width: 1080px;
          margin: 0 auto;
        }
        .hr-kicker {
          font-size: 11px;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: var(--text-muted);
        }
        .hr-title h1 {
          margin: 6px 0 4px;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .hr-title p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-sub);
          max-width: 560px;
        }
        .hr-chosen-flag {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex: none;
          padding: 8px 14px 8px 8px;
          background: var(--el-wood-bg);
          border: 1px solid color-mix(in srgb, var(--el-wood) 40%, transparent);
          border-radius: var(--radius-pill);
        }
        .hr-chosen-flag-n {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--el-wood);
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
          font-size: 15px;
        }
        .hr-chosen-flag em {
          display: block;
          font-style: normal;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: var(--el-wood);
          font-weight: 700;
        }
        .hr-chosen-flag strong {
          display: block;
          font-size: 13px;
          color: var(--text);
        }

        /* ── 번호 레일 ── */
        .hr-rail {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 12px 2px 2px;
          max-width: 1080px;
          margin: 0 auto;
          scrollbar-width: thin;
        }
        .hr-num {
          position: relative;
          flex: 1 1 0;
          min-width: 96px;
          min-height: 56px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
          padding: 9px 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          text-align: left;
          transition: border-color 0.12s, background 0.12s, transform 0.08s;
        }
        .hr-num:hover { border-color: var(--border-strong); }
        .hr-num:active { transform: translateY(1px); }
        .hr-num.active {
          border-color: var(--text);
          background: var(--surface-2);
          box-shadow: inset 0 0 0 1px var(--text);
        }
        .hr-num.chosen {
          border-color: var(--el-wood);
        }
        .hr-num-d {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-muted);
          line-height: 1;
        }
        .hr-num.active .hr-num-d { color: var(--text); }
        .hr-num-t {
          font-size: 12px;
          line-height: 1.25;
          color: var(--text-sub);
          font-weight: 600;
        }
        .hr-num.active .hr-num-t { color: var(--text); }
        .hr-num-check {
          position: absolute;
          top: 7px;
          right: 8px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--el-wood);
          color: #fff;
          font-size: 10px;
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        /* ── 스테이지: 폰 + 노트 ── */
        .hr-stage {
          display: flex;
          gap: 28px;
          align-items: flex-start;
          justify-content: center;
          max-width: 1080px;
          margin: 24px auto 0;
        }
        .hr-phone-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          flex: none;
        }
        .hr-phone {
          position: relative;
          width: 422px;
          max-width: calc(100vw - 32px);
          padding: 14px;
          background: #16140f;
          border-radius: 44px;
          box-shadow: 0 24px 60px rgba(20, 18, 12, 0.28), inset 0 0 0 2px rgba(255,255,255,0.04);
        }
        .hr-notch {
          position: absolute;
          top: 22px;
          left: 50%;
          transform: translateX(-50%);
          width: 116px;
          height: 26px;
          background: #16140f;
          border-radius: 999px;
          z-index: 3;
          pointer-events: none;
        }
        .hr-screen {
          position: relative;
          width: 390px;
          max-width: 100%;
          height: min(770px, calc(100vh - 230px));
          overflow-y: auto;
          overflow-x: hidden;
          background: var(--bg);
          border-radius: 32px;
          -webkit-overflow-scrolling: touch;
        }
        /* 변형 컴포넌트 루트가 화면을 꽉 채우게 */
        .hr-screen > div { min-height: 100%; }
        .hr-phone-cap {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* ── 페르소나 노트 ── */
        .hr-note {
          flex: 1 1 320px;
          max-width: 400px;
          position: sticky;
          top: 188px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow);
        }
        .hr-note-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .hr-note-n {
          width: 38px;
          height: 38px;
          flex: none;
          border-radius: 11px;
          background: var(--text);
          color: var(--bg);
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 800;
        }
        .hr-note-head h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .hr-note-persona {
          margin: 2px 0 0;
          font-size: 12.5px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .hr-note-manifesto {
          margin: 16px 0 0;
          font-family: var(--font-serif);
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-sub);
          padding-left: 12px;
          border-left: 2px solid var(--border-strong);
        }
        .hr-note-dl {
          margin: 18px 0 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hr-note-dl > div { display: flex; flex-direction: column; gap: 3px; }
        .hr-note-dl dt {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .hr-note-dl dd {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--text);
        }
        .hr-decide {
          margin-top: 22px;
          width: 100%;
          min-height: 50px;
          font-family: var(--font);
          font-size: 15px;
          font-weight: 700;
          color: var(--btn-fg);
          background: var(--btn-bg);
          border: none;
          border-radius: var(--radius-pill);
          transition: opacity 0.12s;
        }
        .hr-decide:hover { opacity: 0.9; }
        .hr-decide.done {
          background: var(--el-wood);
          color: #fff;
        }
        .hr-decide-hint {
          margin: 10px 0 0;
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
        }
        .hr-decide-hint strong { color: var(--text); }

        /* ── 반응형: 좁은 화면은 세로 적층 ── */
        @media (max-width: 900px) {
          .hr-stage { flex-direction: column; align-items: center; }
          .hr-note {
            position: static;
            width: 100%;
            max-width: 422px;
          }
          .hr-screen { height: min(720px, calc(100vh - 300px)); }
        }
        @media (max-width: 720px) {
          .hr-head-top { flex-direction: column; }
          .hr-num { min-width: 84px; }
          .hr-num-t { display: none; }
          .hr-num { min-height: 44px; align-items: center; justify-content: center; }
          .hr-num-d { font-size: 16px; }
        }
      `}</style>
    </main>
  );
}
