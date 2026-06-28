import BrandIcon from "@/components/BrandIcon";
import type { ReactNode } from "react";

const QUESTIONS = [
  "이직을 지금 움직여도 될까요?",
  "관계에서 반복되는 말다툼을 줄이고 싶어요.",
  "올해 돈 흐름을 어떻게 잡아야 할까요?",
];

const BASIS = ["사주", "기질", "융합", "가족"];

export default function HomeDesignsPage() {
  return (
    <main className="home-designs-page">
      <header className="home-designs-hero">
        <div>
          <p className="home-designs-kicker">HOME SCREEN DIRECTIONS</p>
          <h1>홈 화면 20가지 디자인 시안</h1>
          <p>
            실제 제품 홈의 역할을 유지하면서, 상담 진입, 리포트 기준, 오늘 액션의 우선순위를
            서로 다르게 배치한 비교용 시안입니다. 11-20번은 재방문, 루틴, 공유, 가족 흐름까지
            더 넓게 확장한 추가안입니다.
          </p>
        </div>
        <div className="home-designs-summary" aria-label="공통 설계 기준">
          <span>공통 기준</span>
          <strong>다음 행동을 고르는 첫 화면</strong>
          <em>캐릭터는 상단 대표 영역에서 한 번만 강하게 사용</em>
        </div>
      </header>

      <section className="bgrade-home-proposal" aria-labelledby="bgrade-home-title">
        <div className="bgrade-poster">
          <div className="bgrade-sticker bgrade-sticker--top">NEW</div>
          <div className="bgrade-poster-copy">
            <span>추천 방향</span>
            <h2 id="bgrade-home-title">수상한데 믿음 가는 동네 사주 상담소 홈</h2>
            <p>기능을 보여주기보다, 언니오빠가 오늘 할 말 들고 기다리는 첫 화면입니다.</p>
          </div>
          <div className="bgrade-character-card">
            <img src="/brand-icons/saju-duo-bgrade/bgrade-duo-app-mascot.png" alt="" />
          </div>
          <div className="bgrade-stamp" aria-hidden="true">운 탓?</div>
          <div className="bgrade-stamp bgrade-stamp--blue" aria-hidden="true">성격 탓?</div>
        </div>

        <div className="bgrade-phone">
          <div className="bgrade-phone-top">
            <span>오늘도 또 그 고민</span>
            <strong>일단 물어봐요.</strong>
          </div>
          <div className="bgrade-question-box">
            <span>지금 고민</span>
            <p>“이직을 해야 하는지, 그냥 내가 예민한 건지 모르겠어요.”</p>
            <button type="button">언니오빠한테 던지기</button>
          </div>
          <div className="bgrade-answer-strip">
            <strong>방금 온 답</strong>
            <p>운도 살짝 막혔고, 성격도 확인을 오래 끄는 중. 오늘은 회사 탓 70%, 내 패턴 30%로 봅시다.</p>
          </div>
          <div className="bgrade-action-row">
            <button type="button">답변 보기</button>
            <button type="button">액션 1개 저장</button>
          </div>
          <div className="bgrade-mini-board" aria-label="오늘 홈 상태">
            <span>상담 대기 1</span>
            <span>액션 미완 2</span>
            <span>리포트 준비됨</span>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--counsel">
        <ConceptNote
          number="01"
          title="상담실형"
          visual="따뜻한 한지, 낮은 대비, 큰 질문 입력"
          content="오늘 날짜, 현재 고민 입력, 기준 정보, 오늘 액션"
          interaction="질문 입력 포커스, 추천 질문 선택, 답변 생성 진입"
          best="첫 상담 전환율을 가장 우선할 때"
        />
        <div className="concept-preview">
          <div className="counsel-screen">
            <div className="counsel-hero">
              <div>
                <span>6월 27일 토요일</span>
                <h2>오늘 마음에 걸리는 일을 먼저 꺼내세요.</h2>
                <p>준비된 사주와 기질 기준으로 지금 고민을 보고, 바로 실행할 말까지 정리합니다.</p>
              </div>
              <img src="/brand-icons/persona-duo.png" alt="" />
            </div>
            <div className="counsel-input">
              <span>새 질문</span>
              <p>“요즘 일이 막히는 이유를 사주와 기질 기준으로 보고 싶어요.”</p>
              <button type="button">지금 보기</button>
            </div>
            <div className="counsel-strip">
              {BASIS.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="counsel-action">
              <strong>오늘 액션</strong>
              <span>오전에는 결정 미루고, 오후에 선택지 2개만 비교하기</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--map">
        <ConceptNote
          number="02"
          title="생애 지도형"
          visual="오행 컬러를 얇은 신호로 쓰는 프리미엄 대시보드"
          content="중앙 생애 지도, 리포트 상태, 상담 준비도, 최근 흐름"
          interaction="지도 영역에서 리포트/상담으로 분기, 상태 카드 hover"
          best="리포트를 여러 개 만든 사용자의 재방문 홈"
        />
        <div className="concept-preview">
          <div className="map-screen">
            <div className="map-top">
              <div>
                <span>나의 기준 정보</span>
                <h2>사주와 기질이 만나는 지점</h2>
              </div>
              <button type="button">상담 시작</button>
            </div>
            <div className="map-body">
              <div className="life-map" aria-hidden="true">
                <span className="map-ring map-ring--one" />
                <span className="map-ring map-ring--two" />
                <span className="map-axis" />
                <span className="map-core">辰</span>
                <i className="wood" />
                <i className="fire" />
                <i className="earth" />
                <i className="water" />
              </div>
              <div className="map-cards">
                <MiniStatus icon="saju" title="개인 사주" status="준비됨" />
                <MiniStatus icon="tci" title="기질" status="요약 완료" />
                <MiniStatus icon="fusion" title="융합" status="상담 기준" />
                <MiniStatus icon="family" title="가족" status="추가 가능" muted />
              </div>
            </div>
            <div className="map-footer">
              <span>최근 상담</span>
              <strong>이직 타이밍을 커리어와 돈 흐름으로 다시 보기</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--chat">
        <ConceptNote
          number="03"
          title="대화 우선형"
          visual="모바일 메신저처럼 빠르게 묻고 이어가는 화면"
          content="최근 질문, AI 답변 요약, 추천 질문, 고정 입력창"
          interaction="추천 질문 탭, 입력창 sticky, 최근 답변으로 이동"
          best="재방문 사용자가 상담을 계속 이어가게 만들 때"
        />
        <div className="concept-preview">
          <div className="chat-screen">
            <div className="chat-head">
              <img src="/brand-icons/persona-duo.png" alt="" />
              <div>
                <span>사주언니 x 기질오빠</span>
                <strong>기준 정보 3개 연결됨</strong>
              </div>
            </div>
            <div className="chat-thread">
              <div className="bubble user">요즘 결정이 계속 늦어지는 이유가 뭘까요?</div>
              <div className="bubble ai">
                올해는 선택지를 늘리는 힘보다 좁히는 훈련이 더 중요해요. 오늘은 비교 기준을
                두 개만 남기세요.
              </div>
              <div className="chat-sources">
                <span>사주</span>
                <span>기질</span>
                <span>융합</span>
              </div>
            </div>
            <div className="chat-prompts">
              {QUESTIONS.map((question) => (
                <button type="button" key={question}>{question}</button>
              ))}
            </div>
            <div className="chat-compose">
              <span>지금 고민을 입력하세요</span>
              <button type="button">보내기</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--planner">
        <ConceptNote
          number="04"
          title="액션 보드형"
          visual="운영 도구처럼 조용하고 촘촘한 실행 중심 화면"
          content="오늘 액션, 이번 주 선택, 상담 큐, 리포트 기준 상태"
          interaction="체크 완료, 액션 상세 열기, 상담 질문을 큐로 등록"
          best="상담 이후 액션 플랜과 재방문을 검증할 때"
        />
        <div className="concept-preview">
          <div className="planner-screen">
            <div className="planner-head">
              <div>
                <span>오늘의 정리</span>
                <h2>읽고 끝내지 말고, 하나만 실행하기</h2>
              </div>
              <strong>3개 남음</strong>
            </div>
            <div className="planner-grid">
              <div className="planner-column">
                <span>오늘</span>
                <Task checked title="아침에 떠오른 선택지 적기" meta="사주 리포트" />
                <Task title="오후 4시 이후 결정 후보 2개 비교" meta="융합 상담" />
              </div>
              <div className="planner-column">
                <span>이번 주</span>
                <Task title="돈 관련 약속은 숫자로 다시 확인" meta="금전운" />
                <Task title="가족 대화는 먼저 일정만 합의" meta="가족 리포트" />
              </div>
            </div>
            <div className="planner-question">
              <span>다음 상담 큐</span>
              <strong>이번 선택이 장기적으로 맞는지 보고 싶어요.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--editorial">
        <ConceptNote
          number="05"
          title="매거진형"
          visual="브랜드 캐릭터와 큰 문장으로 시작하는 에디토리얼 홈"
          content="오늘의 한줄, 핵심 리포트, 상담 CTA, 공유 가능한 문장"
          interaction="한줄 리포트 reveal, 리포트 카드 진입, 상담 CTA 강조"
          best="브랜드 감성과 공유 욕구를 크게 만들 때"
        />
        <div className="concept-preview">
          <div className="editorial-screen">
            <div className="editorial-art">
              <img src="/brand-icons/persona-duo.png" alt="" />
              <div className="editorial-mark">SAJULIFE</div>
            </div>
            <div className="editorial-copy">
              <span>오늘의 한줄</span>
              <h2>도와주는 힘은 충분해요. 이제 선택지를 줄일 차례예요.</h2>
              <p>사주 흐름은 넓게 열리고, 기질은 확인을 오래 끌 수 있어요. 오늘은 확신보다 기준을 먼저 잡으세요.</p>
            </div>
            <div className="editorial-cards">
              <button type="button">개인 사주 보기</button>
              <button type="button">융합 리포트 보기</button>
              <button type="button">상담으로 이어가기</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--focus">
        <ConceptNote
          number="06"
          title="집중 모드형"
          visual="잡음을 줄인 한 화면, 오늘의 결정 하나만 전면 배치"
          content="오늘의 핵심 질문, 판단 기준 3개, 바로 실행 CTA"
          interaction="집중 모드 진입, 기준 펼침, 상담으로 넘기기"
          best="첫 화면에서 사용자가 망설임 없이 한 가지 행동을 하게 할 때"
        />
        <div className="concept-preview">
          <div className="focus-screen">
            <div className="focus-main">
              <span>오늘 하나만 정리</span>
              <h2>지금 결정해야 할 일을 사주와 기질 기준으로 좁혀볼까요?</h2>
              <p>질문을 길게 쓰지 않아도 괜찮아요. 오늘 선택지를 줄이는 데 필요한 기준만 먼저 잡습니다.</p>
              <button type="button">오늘의 결정 보기</button>
            </div>
            <div className="focus-aside">
              <img src="/brand-icons/persona-duo.png" alt="" />
              <div className="focus-meter" aria-hidden="true">
                <span style={{ height: "72%" }} />
                <span style={{ height: "46%" }} />
                <span style={{ height: "58%" }} />
              </div>
              <div className="focus-basis">
                <strong>판단 기준</strong>
                <em>일 흐름</em>
                <em>관계 에너지</em>
                <em>확신을 늦추는 패턴</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--deck">
        <ConceptNote
          number="07"
          title="카드 스택형"
          visual="리포트와 상담을 손안의 카드처럼 넘기는 구조"
          content="오늘 카드, 최근 상담 카드, 액션 카드, 기준 카드"
          interaction="카드 넘김, 카드 고정, CTA 카드 열기"
          best="모바일 첫 화면에서 선택지를 작게 나누어 보여줄 때"
        />
        <div className="concept-preview">
          <div className="deck-screen">
            <div className="deck-top">
              <span>오늘의 카드</span>
              <strong>3 / 4</strong>
            </div>
            <div className="deck-stack" aria-label="홈 카드 스택">
              <article className="deck-card deck-card--back">
                <span>기준 정보</span>
                <strong>사주 + 기질 + 융합</strong>
              </article>
              <article className="deck-card deck-card--middle">
                <span>최근 상담</span>
                <strong>이직 타이밍 다시 보기</strong>
              </article>
              <article className="deck-card deck-card--front">
                <span>오늘 질문</span>
                <h2>내가 미루는 선택은 운의 문제일까요, 기질의 문제일까요?</h2>
                <p>두 기준을 같이 놓고 오늘 할 수 있는 행동 하나까지 정리합니다.</p>
                <button type="button">이 카드로 상담</button>
              </article>
            </div>
            <div className="deck-tabs">
              <button type="button" className="on">질문</button>
              <button type="button">리포트</button>
              <button type="button">액션</button>
              <button type="button">공유</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--library">
        <ConceptNote
          number="08"
          title="리포트 서재형"
          visual="내 리포트가 쌓이는 상담 서재, 문서형 신뢰감"
          content="대표 리포트, 생성 상태, 상담 근거, 다음으로 읽을 문서"
          interaction="문서 열기, 상담 근거 선택, 리포트 갱신"
          best="리포트 품질과 축적감을 강하게 보여주고 싶을 때"
        />
        <div className="concept-preview">
          <div className="library-screen">
            <div className="library-hero">
              <div>
                <span>내 상담 서재</span>
                <h2>오늘 상담에 쓸 기준 문서를 고르세요.</h2>
              </div>
              <button type="button">새 질문 쓰기</button>
            </div>
            <div className="library-shelf">
              <LibraryReport icon="saju" title="개인 사주" status="대표 근거" tone="fire" />
              <LibraryReport icon="tci" title="기질 리포트" status="행동 패턴" tone="water" />
              <LibraryReport icon="fusion" title="융합 리포트" status="상담 추천" tone="earth" />
              <LibraryReport icon="family" title="가족 리포트" status="보조 근거" tone="wood" />
            </div>
            <div className="library-note">
              <strong>다음으로 읽을 문장</strong>
              <p>“선택을 빨리 하는 것보다, 기준을 먼저 세우는 쪽이 이번 주에는 더 유리해요.”</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--radar">
        <ConceptNote
          number="09"
          title="관계 레이더형"
          visual="고민 영역을 레이더처럼 펼쳐 현재 이슈를 바로 선택"
          content="관계/일/돈/가족/회복 영역, 최근 질문, 상담 CTA"
          interaction="영역 선택, 강도 조절, 선택한 이슈로 질문 생성"
          best="사용자가 고민을 말로 쓰기 전에 카테고리로 시작하게 할 때"
        />
        <div className="concept-preview">
          <div className="radar-screen">
            <div className="radar-copy">
              <span>지금 가장 큰 영역</span>
              <h2>어디가 제일 신경 쓰이나요?</h2>
              <p>영역을 하나 고르면 저장된 기준 정보로 바로 질문 문장을 만들어줍니다.</p>
            </div>
            <div className="radar-stage">
              <span className="radar-ring radar-ring--outer" />
              <span className="radar-ring radar-ring--inner" />
              <button type="button" className="radar-node radar-node--work">일</button>
              <button type="button" className="radar-node radar-node--love">관계</button>
              <button type="button" className="radar-node radar-node--money">돈</button>
              <button type="button" className="radar-node radar-node--family">가족</button>
              <button type="button" className="radar-node radar-node--rest">회복</button>
            </div>
            <div className="radar-question">
              <strong>추천 질문</strong>
              <span>관계에서 반복되는 말투와 오늘 피해야 할 반응을 알려줘.</span>
              <button type="button">이대로 묻기</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--ritual">
        <ConceptNote
          number="10"
          title="루틴 경로형"
          visual="오늘 상담을 작은 루틴 경로로 보여주는 실행 중심 화면"
          content="준비, 질문, 해석, 액션, 기록의 5단계"
          interaction="단계 완료, 다음 단계 잠금 해제, 액션 저장"
          best="리포트 이후 재방문 루프와 행동 완료율을 검증할 때"
        />
        <div className="concept-preview">
          <div className="ritual-screen">
            <div className="ritual-head">
              <div>
                <span>오늘의 루틴</span>
                <h2>질문 하나를 행동 하나로 바꾸는 길</h2>
              </div>
              <img src="/brand-icons/persona-duo.png" alt="" />
            </div>
            <ol className="ritual-path">
              <RitualStep state="done" title="기준 준비" desc="사주, 기질 연결 완료" />
              <RitualStep state="done" title="질문 선택" desc="오늘 고민 1개 선택" />
              <RitualStep state="now" title="해석 받기" desc="반복 패턴과 선택 기준 확인" />
              <RitualStep title="액션 저장" desc="오늘 할 일 1개로 줄이기" />
              <RitualStep title="기록 확인" desc="다음 상담으로 이어가기" />
            </ol>
            <button type="button" className="ritual-cta">해석 단계 이어가기</button>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--timeline">
        <ConceptNote
          number="11"
          title="타임라인 브리핑형"
          visual="하루 흐름을 시간대별 상담 루틴으로 보여주는 브리핑"
          content="오전 질문, 오후 해석, 저녁 액션 기록"
          interaction="시간대 선택, 현재 단계 강조, 다음 단계로 이동"
          best="재방문 사용자가 오늘 무엇을 하면 되는지 빠르게 확인할 때"
        />
        <div className="concept-preview">
          <div className="timeline-screen">
            <div className="timeline-head">
              <div>
                <span>오늘 흐름</span>
                <h2>오전에는 묻고, 오후에는 정리하고, 저녁에는 저장하세요.</h2>
              </div>
              <strong>6.27</strong>
            </div>
            <div className="timeline-track">
              <TimelineItem tone="wood" time="09:00" title="질문 열기" desc="지금 고민을 한 문장으로 고릅니다." />
              <TimelineItem tone="earth" time="15:00" title="해석 확인" desc="사주와 기질 기준을 나눠서 봅니다." active />
              <TimelineItem tone="water" time="21:00" title="액션 저장" desc="내일 다시 볼 행동 하나만 남깁니다." />
            </div>
            <div className="timeline-action">
              <span>다음 행동</span>
              <strong>오늘 답변에서 선택 기준만 먼저 확인하기</strong>
              <button type="button">해석 보기</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--checkin">
        <ConceptNote
          number="12"
          title="퀵 체크인형"
          visual="감정/상태 버튼을 먼저 눌러 질문을 자동 생성하는 화면"
          content="오늘 상태, 고민 강도, 추천 질문, 즉시 상담 CTA"
          interaction="상태 선택, 강도 슬라이더, 질문 자동 완성"
          best="사용자가 긴 질문을 쓰기 부담스러워할 때"
        />
        <div className="concept-preview">
          <div className="checkin-screen">
            <div className="checkin-main">
              <img src="/brand-icons/persona-duo.png" alt="" />
              <span>30초 체크인</span>
              <h2>오늘 상태만 골라도 상담을 시작할 수 있어요.</h2>
              <div className="checkin-choices">
                <CheckChoice label="답답함" desc="선택이 막힘" active />
                <CheckChoice label="예민함" desc="관계 신호" />
                <CheckChoice label="지침" desc="회복 우선" />
              </div>
            </div>
            <div className="checkin-panel">
              <strong>고민 강도</strong>
              <div className="checkin-meter" aria-hidden>
                <span />
              </div>
              <p>“요즘 선택이 막히는 이유와 오늘 줄여야 할 기준을 알려줘.”</p>
              <button type="button">이 질문으로 시작</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--calendar">
        <ConceptNote
          number="13"
          title="운세 캘린더형"
          visual="주간 캘린더를 중심에 두고 좋은 타이밍을 조용히 표시"
          content="이번 주 흐름, 날짜별 신호, 오늘 추천 액션"
          interaction="날짜 선택, 흐름 카드 전환, 상담 질문 연결"
          best="사용자가 날짜와 타이밍을 먼저 보고 싶어할 때"
        />
        <div className="concept-preview">
          <div className="calendar-screen">
            <div className="calendar-head">
              <div>
                <span>이번 주 흐름</span>
                <h2>결정은 금요일보다 오늘 오후가 가볍습니다.</h2>
              </div>
              <button type="button">주간 보기</button>
            </div>
            <div className="calendar-grid">
              <CalendarDay day="월" date="22" tone="muted" />
              <CalendarDay day="화" date="23" tone="water" />
              <CalendarDay day="수" date="24" tone="wood" />
              <CalendarDay day="목" date="25" tone="earth" active />
              <CalendarDay day="금" date="26" tone="fire" />
              <CalendarDay day="토" date="27" tone="wood" />
              <CalendarDay day="일" date="28" tone="muted" />
            </div>
            <div className="calendar-note">
              <strong>오늘 추천</strong>
              <span>사람을 설득하기보다 선택지를 2개로 줄이는 날</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--inbox">
        <ConceptNote
          number="14"
          title="상담 인박스형"
          visual="읽지 않은 상담과 액션을 메일함처럼 정리하는 화면"
          content="미해결 질문, 최근 답변, 액션 대기, 새 질문"
          interaction="질문 열기, 완료 처리, 새 상담 작성"
          best="상담 히스토리가 쌓인 사용자의 재방문 홈"
        />
        <div className="concept-preview">
          <div className="inbox-screen">
            <div className="inbox-top">
              <div>
                <span>상담함</span>
                <h2>아직 정리하지 않은 답변이 2개 있어요.</h2>
              </div>
              <button type="button">새 질문</button>
            </div>
            <div className="inbox-list">
              <InboxItem status="답변 도착" title="이직 타이밍을 다시 봐줘" meta="사주 + 기질 근거" active />
              <InboxItem status="액션 대기" title="관계 대화에서 피해야 할 말" meta="오늘 완료 필요" />
              <InboxItem status="보관됨" title="돈 약속을 숫자로 확인하기" meta="지난 상담" muted />
            </div>
            <div className="inbox-compose">
              <span>빠른 질문</span>
              <strong>이번 주에 먼저 정리할 고민을 추천해줘.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--coach">
        <ConceptNote
          number="15"
          title="코치 패널형"
          visual="상담 결과를 코칭 세션처럼 정리한 실행 패널"
          content="오늘 코치 메시지, 해야 할 일, 상담 근거, 체크 완료"
          interaction="액션 완료, 근거 펼침, 코치에게 다시 묻기"
          best="읽은 내용을 실제 행동으로 바꾸는 전환을 높일 때"
        />
        <div className="concept-preview">
          <div className="coach-screen">
            <div className="coach-card">
              <img src="/brand-icons/persona-duo.png" alt="" />
              <span>오늘의 코치</span>
              <h2>확신을 기다리지 말고 비교 기준을 먼저 고르세요.</h2>
              <button type="button">다시 묻기</button>
            </div>
            <div className="coach-actions">
              <CoachAction title="선택지 3개 적기" meta="완료됨" done />
              <CoachAction title="비교 기준 2개만 남기기" meta="오늘 오후" />
              <CoachAction title="결정 후 감정 기록하기" meta="내일 확인" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--signal">
        <ConceptNote
          number="16"
          title="신호등 판단형"
          visual="오늘의 행동을 초록/노랑/빨강 신호로 바로 분류"
          content="진행해도 좋은 일, 보류할 일, 피할 반응"
          interaction="신호 카드 선택, 이유 열기, 상담 질문 생성"
          best="사용자가 즉시 행동 판단을 원할 때"
        />
        <div className="concept-preview">
          <div className="signal-screen">
            <div className="signal-head">
              <span>오늘의 판단 신호</span>
              <h2>움직일 것과 미룰 것을 나눠보세요.</h2>
            </div>
            <div className="signal-grid">
              <SignalCard level="go" title="진행" desc="자료 확인, 짧은 제안, 일정 확정" />
              <SignalCard level="wait" title="보류" desc="돈 약속, 장기 계약, 감정적 답장" />
              <SignalCard level="stop" title="주의" desc="확신 없는 선언, 관계 단정, 밤늦은 결정" />
            </div>
            <button type="button" className="signal-cta">보류 이유 물어보기</button>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--compare">
        <ConceptNote
          number="17"
          title="선택 비교형"
          visual="두 선택지를 사주/기질/액션 기준으로 나란히 비교"
          content="선택 A/B, 기준별 장단점, 오늘 추천, 상담 CTA"
          interaction="선택지 교체, 기준 추가, 추천 이유 펼침"
          best="이직/관계/돈처럼 사용자가 둘 중 하나를 골라야 할 때"
        />
        <div className="concept-preview">
          <div className="compare-screen">
            <div className="compare-head">
              <span>선택 비교</span>
              <h2>남는 것과 줄이는 것을 기준으로 봅니다.</h2>
            </div>
            <div className="compare-table">
              <CompareRow label="사주 흐름" a="지금 움직임" b="한 박자 대기" />
              <CompareRow label="기질 패턴" a="확인 욕구 증가" b="불안은 줄지만 속도 저하" />
              <CompareRow label="오늘 액션" a="조건 2개 확인" b="답장 하루 보류" accent />
            </div>
            <div className="compare-result">
              <strong>추천</strong>
              <span>A를 작게 실행하고, 최종 결정은 내일로 넘기기</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--familyhub">
        <ConceptNote
          number="18"
          title="가족 허브형"
          visual="가족 관계를 중심 궤도처럼 배치한 홈"
          content="가족 구성원, 관계 신호, 오늘 대화 주제, 가족 리포트"
          interaction="구성원 선택, 대화 주제 생성, 가족 상담 진입"
          best="가족 리포트와 관계 상담을 홈의 주 사용처로 밀 때"
        />
        <div className="concept-preview">
          <div className="familyhub-screen">
            <div className="familyhub-map">
              <span className="familyhub-ring" />
              <button type="button" className="familyhub-node self">나</button>
              <button type="button" className="familyhub-node partner">배우자</button>
              <button type="button" className="familyhub-node parent">부모</button>
              <button type="button" className="familyhub-node child">자녀</button>
            </div>
            <div className="familyhub-copy">
              <span>가족 대화</span>
              <h2>오늘은 조언보다 일정만 합의하는 편이 좋아요.</h2>
              <p>가족 구성원의 흐름을 함께 보고, 갈등을 키우지 않는 말부터 고릅니다.</p>
              <button type="button">가족 질문 만들기</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--share">
        <ConceptNote
          number="19"
          title="공유 스냅형"
          visual="상담 결과를 저장하거나 공유하기 좋은 한 장 카드로 요약"
          content="오늘의 문장, 근거 태그, 공유/저장 액션, 다음 질문"
          interaction="문장 복사, 공유 링크 만들기, 다음 상담 이어가기"
          best="리포트의 말맛과 재방문 링크를 같이 살리고 싶을 때"
        />
        <div className="concept-preview">
          <div className="share-screen">
            <div className="share-card">
              <span>오늘의 문장</span>
              <h2>지금 필요한 건 더 큰 확신이 아니라, 덜 흔들리는 기준이에요.</h2>
              <div className="share-tags">
                <ShareStat label="근거" value="사주 x 기질" />
                <ShareStat label="액션" value="1개 저장" />
                <ShareStat label="공유" value="비공개" />
              </div>
            </div>
            <div className="share-actions">
              <button type="button">문장 저장</button>
              <button type="button">링크 만들기</button>
              <button type="button">상담 이어가기</button>
            </div>
          </div>
        </div>
      </section>

      <section className="home-concept home-concept--widgets">
        <ConceptNote
          number="20"
          title="위젯 보드형"
          visual="작은 홈 위젯을 조합해 개인화된 대시보드처럼 구성"
          content="오늘 질문, 액션, 리포트 상태, 최근 상담, 주간 흐름"
          interaction="위젯 재배치, 바로가기, 완료 토글"
          best="기능이 많아졌을 때 사용자가 자기 홈을 구성하게 할 때"
        />
        <div className="concept-preview">
          <div className="widgets-screen">
            <HomeWidget tone="dark" title="오늘 질문">
              <strong>지금 미루는 선택을 기준 2개로 줄이기</strong>
            </HomeWidget>
            <HomeWidget tone="wood" title="액션">
              <strong>2 / 3</strong>
              <span>오늘 완료</span>
            </HomeWidget>
            <HomeWidget title="리포트">
              <BrandIcon name="fusion" />
              <span>융합 리포트 준비됨</span>
            </HomeWidget>
            <HomeWidget tone="water" title="최근 상담">
              <span>관계 말투를 다시 확인하기</span>
            </HomeWidget>
            <HomeWidget tone="earth" title="주간 흐름">
              <div className="widget-bars" aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </div>
            </HomeWidget>
          </div>
        </div>
      </section>
    </main>
  );
}

function ConceptNote({
  number,
  title,
  visual,
  content,
  interaction,
  best,
}: {
  number: string;
  title: string;
  visual: string;
  content: string;
  interaction: string;
  best: string;
}) {
  return (
    <aside className="concept-note">
      <span>{number}</span>
      <h2>{title}</h2>
      <dl>
        <div>
          <dt>Visual</dt>
          <dd>{visual}</dd>
        </div>
        <div>
          <dt>Content</dt>
          <dd>{content}</dd>
        </div>
        <div>
          <dt>Motion</dt>
          <dd>{interaction}</dd>
        </div>
        <div>
          <dt>Best</dt>
          <dd>{best}</dd>
        </div>
      </dl>
    </aside>
  );
}

function MiniStatus({
  icon,
  title,
  status,
  muted,
}: {
  icon: "saju" | "tci" | "fusion" | "family";
  title: string;
  status: string;
  muted?: boolean;
}) {
  return (
    <div className={`mini-status${muted ? " muted" : ""}`}>
      <BrandIcon name={icon} />
      <div>
        <strong>{title}</strong>
        <span>{status}</span>
      </div>
    </div>
  );
}

function Task({ title, meta, checked }: { title: string; meta: string; checked?: boolean }) {
  return (
    <label className={`planner-task${checked ? " checked" : ""}`}>
      <input type="checkbox" checked={checked} readOnly />
      <span>
        <strong>{title}</strong>
        <em>{meta}</em>
      </span>
    </label>
  );
}

function LibraryReport({
  icon,
  title,
  status,
  tone,
}: {
  icon: "saju" | "tci" | "fusion" | "family";
  title: string;
  status: string;
  tone: "fire" | "water" | "earth" | "wood";
}) {
  return (
    <button type="button" className={`library-report library-report--${tone}`}>
      <BrandIcon name={icon} />
      <span>
        <strong>{title}</strong>
        <em>{status}</em>
      </span>
    </button>
  );
}

function RitualStep({
  state,
  title,
  desc,
}: {
  state?: "done" | "now";
  title: string;
  desc: string;
}) {
  return (
    <li className={`ritual-step${state ? ` ${state}` : ""}`}>
      <span aria-hidden />
      <div>
        <strong>{title}</strong>
        <em>{desc}</em>
      </div>
    </li>
  );
}

function TimelineItem({
  time,
  title,
  desc,
  tone,
  active,
}: {
  time: string;
  title: string;
  desc: string;
  tone: "wood" | "earth" | "water";
  active?: boolean;
}) {
  return (
    <div className={`timeline-item timeline-item--${tone}${active ? " active" : ""}`}>
      <span>{time}</span>
      <div>
        <strong>{title}</strong>
        <em>{desc}</em>
      </div>
    </div>
  );
}

function CheckChoice({ label, desc, active }: { label: string; desc: string; active?: boolean }) {
  return (
    <button type="button" className={`checkin-choice${active ? " active" : ""}`}>
      <strong>{label}</strong>
      <span>{desc}</span>
    </button>
  );
}

function CalendarDay({
  day,
  date,
  tone,
  active,
}: {
  day: string;
  date: string;
  tone: "muted" | "wood" | "water" | "earth" | "fire";
  active?: boolean;
}) {
  return (
    <button type="button" className={`calendar-day calendar-day--${tone}${active ? " active" : ""}`}>
      <span>{day}</span>
      <strong>{date}</strong>
    </button>
  );
}

function InboxItem({
  status,
  title,
  meta,
  active,
  muted,
}: {
  status: string;
  title: string;
  meta: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <button type="button" className={`inbox-item${active ? " active" : ""}${muted ? " muted" : ""}`}>
      <span>{status}</span>
      <strong>{title}</strong>
      <em>{meta}</em>
    </button>
  );
}

function CoachAction({ title, meta, done }: { title: string; meta: string; done?: boolean }) {
  return (
    <label className={`coach-action${done ? " done" : ""}`}>
      <input type="checkbox" checked={done} readOnly />
      <span>
        <strong>{title}</strong>
        <em>{meta}</em>
      </span>
    </label>
  );
}

function SignalCard({
  level,
  title,
  desc,
}: {
  level: "go" | "wait" | "stop";
  title: string;
  desc: string;
}) {
  return (
    <button type="button" className={`signal-card signal-card--${level}`}>
      <span />
      <strong>{title}</strong>
      <em>{desc}</em>
    </button>
  );
}

function CompareRow({
  label,
  a,
  b,
  accent,
}: {
  label: string;
  a: string;
  b: string;
  accent?: boolean;
}) {
  return (
    <div className={`compare-row${accent ? " accent" : ""}`}>
      <span>{label}</span>
      <strong>{a}</strong>
      <em>{b}</em>
    </div>
  );
}

function ShareStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="share-stat">
      <em>{label}</em>
      <strong>{value}</strong>
    </span>
  );
}

function HomeWidget({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "dark" | "wood" | "water" | "earth";
  children: ReactNode;
}) {
  return (
    <article className={`home-widget${tone ? ` home-widget--${tone}` : ""}`}>
      <span>{title}</span>
      {children}
    </article>
  );
}
