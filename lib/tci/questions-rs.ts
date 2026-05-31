/**
 * 확장판(140문항) — Sajulife 자체 제작 한국어 문항.
 *
 * Cloninger의 7요인 기질-성격 모형(NS/HA/RD/PS/SD/CO/ST)과 그 하위척도
 * 분류는 학술 공개 영역의 모형이다. 이 파일의 문항 텍스트는 그 학술 모형의
 * 구성개념 정의에 따라 새로 작성한 **완전 오리지널 한국어 문항**이며,
 * 마음사랑(주)의 TCI-RS 정식판 문항을 옮기거나 일부 변경한 것이 아니다.
 *
 * 운영팀이 정식 TCI-RS 라이선스를 보유하고 있고, 정식 문항으로 교체하고
 * 싶다면 아래 `TCI_RS_ITEMS` 배열의 `text`만 라이선스 자료에 맞춰 한 줄씩
 * 교체하면 된다(구조·id·차원·하위척도·역채점은 이미 자리잡혀 있음).
 *
 * 채점은 5점 척도(1=그렇지 않다 ~ 5=매우 그렇다). `reverse: true` 항목은
 * `scoreTciByVariant`에서 자동으로 6-v 환산.
 */

import type { TciDimension, TciItem } from "./questions";
import { interleaveByDimension } from "./questions";

/**
 * 7차원 → 하위척도 매핑.
 * 각 하위척도에 5문항씩 = 28척도 × 5 = 140.
 */
export const TCI_RS_SUBSCALES: Record<TciDimension, readonly string[]> = {
  NS: ["NS1", "NS2", "NS3", "NS4"],            // 탐색 흥분, 충동성, 무절제, 자유분방
  HA: ["HA1", "HA2", "HA3", "HA4"],            // 예기불안, 불확실성 공포, 수줍음, 쉽게 지침
  RD: ["RD1", "RD3", "RD4"],                   // 정서적 감수성, 애착, 의존
  PS: ["PS1", "PS2", "PS3", "PS4"],            // 노력 추구, 작업 끈기, 야망, 완벽주의
  SD: ["SD1", "SD2", "SD3", "SD4", "SD5"],     // 책임감, 목적성, 자원동원, 자기수용, 자기일치
  CO: ["CO1", "CO2", "CO3", "CO4", "CO5"],     // 사회적 수용, 공감, 도움 행동, 연민, 순수 원칙
  ST: ["ST1", "ST2", "ST3"],                   // 자기망각·몰입, 초개인적 동일시, 영적 수용
} as const;

export const TCI_RS_EXPECTED_COUNTS: Record<TciDimension, number> = {
  NS: 20, HA: 20, RD: 15, PS: 20, SD: 25, CO: 25, ST: 15,
};

/**
 * 확장판 140문항.
 * - 각 항목은 학술 모형의 하위척도 정의에 기반한 행동·태도 진술.
 * - 일상 한국어, 1인칭, 현재형 — 약식판 스타일과 일관.
 * - 역채점 항목은 reverse: true.
 */
export const TCI_RS_ITEMS: TciItem[] = [
  // ── NS · 자극추구 ────────────────────────────────────────
  // NS1 탐색적 흥분
  { id: "rs001", dimension: "NS", subscale: "NS1", text: "처음 가는 동네는 일정 없이 둘러보는 게 즐겁다." },
  { id: "rs002", dimension: "NS", subscale: "NS1", text: "새로 생긴 장소나 메뉴를 보면 일단 가보고 싶다." },
  { id: "rs003", dimension: "NS", subscale: "NS1", text: "같은 일과가 며칠 반복되면 답답함이 생긴다." },
  { id: "rs004", dimension: "NS", subscale: "NS1", text: "여행 계획을 완전히 짜지 않아도 일단 떠나는 편이다." },
  { id: "rs005", dimension: "NS", subscale: "NS1", text: "예상치 못한 변화가 오히려 흥미롭게 느껴진다." },
  // NS2 충동성
  { id: "rs006", dimension: "NS", subscale: "NS2", text: "마음에 드는 물건은 충분히 비교하지 않고 사기도 한다." },
  { id: "rs007", dimension: "NS", subscale: "NS2", text: "결정은 길게 따져보기보다 직감으로 빠르게 내린다." },
  { id: "rs008", dimension: "NS", subscale: "NS2", text: "한번 결정하면 곧장 행동으로 옮긴다." },
  { id: "rs009", dimension: "NS", subscale: "NS2", text: "충분히 생각하기 전에 말이 먼저 나올 때가 있다." },
  { id: "rs010", dimension: "NS", subscale: "NS2", text: "그 자리에서 즉흥적으로 일정을 정하는 일이 잦다." },
  // NS3 무절제
  { id: "rs011", dimension: "NS", subscale: "NS3", text: "좋아하는 일에는 예산을 넉넉히 잡는 편이다." },
  { id: "rs012", dimension: "NS", subscale: "NS3", text: "의미 있다고 느끼면 비용을 아끼지 않는다." },
  { id: "rs013", dimension: "NS", subscale: "NS3", text: "물건보다 경험에 돈 쓰는 게 자연스럽다." },
  { id: "rs014", dimension: "NS", subscale: "NS3", text: "친한 사람들과 있을 땐 한턱내는 일이 많다." },
  { id: "rs015", dimension: "NS", subscale: "NS3", text: "기분이 좋으면 예산보다 더 많이 쓰게 된다." },
  // NS4 자유분방
  { id: "rs016", dimension: "NS", subscale: "NS4", text: "규칙이 너무 빡빡하면 답답함을 자주 느낀다." },
  { id: "rs017", dimension: "NS", subscale: "NS4", text: "정해진 절차보다 그때그때 흐름을 따라가는 게 좋다." },
  { id: "rs018", dimension: "NS", subscale: "NS4", text: "주변 정리가 흐트러져 있어도 크게 신경 쓰지 않는다." },
  { id: "rs019", dimension: "NS", subscale: "NS4", text: "체크리스트대로 움직이는 일이 잘 맞지 않는다." },
  { id: "rs020", dimension: "NS", subscale: "NS4", text: "즉흥 만남이 미리 잡은 약속보다 더 즐거울 때가 많다." },

  // ── HA · 위험회피 ────────────────────────────────────────
  // HA1 예기불안
  { id: "rs021", dimension: "HA", subscale: "HA1", text: "큰 일을 앞두고 일어날 수 있는 문제부터 떠올린다." },
  { id: "rs022", dimension: "HA", subscale: "HA1", text: "새로 시작하는 일 앞에서 걱정이 오래 이어진다." },
  { id: "rs023", dimension: "HA", subscale: "HA1", text: "결과를 모르는 상황은 미리부터 마음이 무겁다." },
  { id: "rs024", dimension: "HA", subscale: "HA1", text: "내일 일이 마음에 걸려 잠들기 어려울 때가 있다." },
  { id: "rs025", dimension: "HA", subscale: "HA1", text: "일이 잘 풀려도 다음에 닥칠 어려움부터 생각한다." },
  // HA2 불확실성 공포
  { id: "rs026", dimension: "HA", subscale: "HA2", text: "결과를 예측할 수 없는 일은 가능하면 피하고 싶다." },
  { id: "rs027", dimension: "HA", subscale: "HA2", text: "정보가 충분하지 않으면 결정을 뒤로 미룬다." },
  { id: "rs028", dimension: "HA", subscale: "HA2", text: "잘 모르는 분야의 제안은 거절부터 떠오른다." },
  { id: "rs029", dimension: "HA", subscale: "HA2", text: "안정적인 길과 불확실한 길 중에선 안정 쪽을 택한다." },
  { id: "rs030", dimension: "HA", subscale: "HA2", text: "계획에 변수가 끼면 마음이 크게 불편해진다." },
  // HA3 수줍음
  { id: "rs031", dimension: "HA", subscale: "HA3", text: "처음 보는 사람 앞에서는 말이 잘 안 나온다." },
  { id: "rs032", dimension: "HA", subscale: "HA3", text: "모르는 사람과의 자리에서 긴장이 오래 남는다." },
  { id: "rs033", dimension: "HA", subscale: "HA3", text: "잘 모르는 사람들 속에 있는 게 부담스럽다." },
  { id: "rs034", dimension: "HA", subscale: "HA3", text: "새 모임에서 먼저 말을 거는 게 어렵다." },
  { id: "rs035", dimension: "HA", subscale: "HA3", text: "발표·면접 같은 상황이 다른 일보다 훨씬 부담스럽다." },
  // HA4 쉽게 지침
  { id: "rs036", dimension: "HA", subscale: "HA4", text: "같은 자극이 이어지면 보통보다 빨리 지친다." },
  { id: "rs037", dimension: "HA", subscale: "HA4", text: "신경 쓸 일이 늘면 몸이 먼저 무거워진다." },
  { id: "rs038", dimension: "HA", subscale: "HA4", text: "평소에 체력이 부족하다고 느낄 때가 많다." },
  { id: "rs039", dimension: "HA", subscale: "HA4", text: "조금만 무리해도 회복에 시간이 오래 걸린다." },
  { id: "rs040", dimension: "HA", subscale: "HA4", text: "일이 끝나면 사람을 만나기보다 혼자 쉬고 싶다." },

  // ── RD · 사회적 민감성 ──────────────────────────────────
  // RD1 정서적 감수성
  { id: "rs041", dimension: "RD", subscale: "RD1", text: "영화나 음악에 쉽게 마음이 울컥하는 편이다." },
  { id: "rs042", dimension: "RD", subscale: "RD1", text: "가까운 사람의 표정 변화가 빠르게 눈에 들어온다." },
  { id: "rs043", dimension: "RD", subscale: "RD1", text: "작은 친절도 마음에 오래 남는다." },
  { id: "rs044", dimension: "RD", subscale: "RD1", text: "슬픈 이야기를 들으면 그 감정이 한참 가시지 않는다." },
  { id: "rs045", dimension: "RD", subscale: "RD1", text: "예전에 느낀 감정이 종종 다시 떠올라 머문다." },
  // RD3 애착
  { id: "rs046", dimension: "RD", subscale: "RD3", text: "친해진 사람과의 관계는 오래 이어가려 한다." },
  { id: "rs047", dimension: "RD", subscale: "RD3", text: "마음을 나누는 시간이 가장 만족스럽게 느껴진다." },
  { id: "rs048", dimension: "RD", subscale: "RD3", text: "함께 보낸 시간이 떠오를 때마다 마음이 따뜻해진다." },
  { id: "rs049", dimension: "RD", subscale: "RD3", text: "가족·친구에게 자주 안부를 묻는 편이다." },
  { id: "rs050", dimension: "RD", subscale: "RD3", text: "외로움은 일이 잘 풀려도 잘 가시지 않는 부분이 있다." },
  // RD4 의존
  { id: "rs051", dimension: "RD", subscale: "RD4", text: "큰 결정 앞에서 가까운 사람의 의견을 비중 있게 듣는다." },
  { id: "rs052", dimension: "RD", subscale: "RD4", text: "혼자 결정하기보다 함께 정하는 게 마음이 편하다." },
  { id: "rs053", dimension: "RD", subscale: "RD4", text: "다른 사람의 반응이 내 기분에 크게 영향을 준다." },
  { id: "rs054", dimension: "RD", subscale: "RD4", text: "인정받았다는 말 한 마디에 힘이 많이 난다." },
  { id: "rs055", dimension: "RD", subscale: "RD4", text: "갈등 상황에선 내 입장보다 상대 의견을 먼저 받아들이는 편이다." },

  // ── PS · 인내력 ──────────────────────────────────────────
  // PS1 노력 추구
  { id: "rs056", dimension: "PS", subscale: "PS1", text: "어려운 과제일수록 한번 해보고 싶어진다." },
  { id: "rs057", dimension: "PS", subscale: "PS1", text: "한 번 시작한 일은 마무리까지 끌고 가는 편이다." },
  { id: "rs058", dimension: "PS", subscale: "PS1", text: "결과가 더디게 나와도 멈추지 않고 계속 시도한다." },
  { id: "rs059", dimension: "PS", subscale: "PS1", text: "일에 몰입하고 나면 다른 일정도 미루게 된다." },
  { id: "rs060", dimension: "PS", subscale: "PS1", text: "매일 일정 시간 자기 일에 쏟는 게 자연스럽다." },
  // PS2 작업 끈기
  { id: "rs061", dimension: "PS", subscale: "PS2", text: "실패한 뒤에도 비슷한 과제에 다시 도전한다." },
  { id: "rs062", dimension: "PS", subscale: "PS2", text: "비판이나 좌절을 겪으면 오히려 더 매달리게 된다." },
  { id: "rs063", dimension: "PS", subscale: "PS2", text: "같은 일을 반복해도 질리지 않고 다듬는 편이다." },
  { id: "rs064", dimension: "PS", subscale: "PS2", text: "단기 보상이 없어도 오래 끌어가는 일이 있다." },
  { id: "rs065", dimension: "PS", subscale: "PS2", text: "한 영역을 깊게 파고드는 데서 만족을 얻는다." },
  // PS3 야망
  { id: "rs066", dimension: "PS", subscale: "PS3", text: "평균을 넘는 결과를 기준으로 삼는 편이다." },
  { id: "rs067", dimension: "PS", subscale: "PS3", text: "또래보다 한 단계 더 가는 걸 목표로 한다." },
  { id: "rs068", dimension: "PS", subscale: "PS3", text: "인정받는 위치에 오르고 싶은 마음이 분명히 있다." },
  { id: "rs069", dimension: "PS", subscale: "PS3", text: "다른 사람보다 빨리 성장하고 싶은 욕심이 있다." },
  { id: "rs070", dimension: "PS", subscale: "PS3", text: "평범한 수준에 머무는 건 답답하게 느껴진다." },
  // PS4 완벽주의
  { id: "rs071", dimension: "PS", subscale: "PS4", text: "내 기준에 못 미친 결과물은 끝까지 다시 손보고 싶다." },
  { id: "rs072", dimension: "PS", subscale: "PS4", text: "마무리 단계의 세부에 신경을 많이 쓰는 편이다." },
  { id: "rs073", dimension: "PS", subscale: "PS4", text: "'대충 됐다'는 느낌으로 일을 끝내기 어렵다." },
  { id: "rs074", dimension: "PS", subscale: "PS4", text: "잘했어도 부족했던 부분이 먼저 눈에 들어온다." },
  { id: "rs075", dimension: "PS", subscale: "PS4", text: "내가 한 일은 두세 번 다시 점검해야 마음이 놓인다." },

  // ── SD · 자율성 ──────────────────────────────────────────
  // SD1 책임감
  { id: "rs076", dimension: "SD", subscale: "SD1", text: "약속한 일은 어떤 방식으로든 끝까지 책임진다." },
  { id: "rs077", dimension: "SD", subscale: "SD1", text: "결과가 좋지 않아도 내 몫을 핑계로 돌리지 않는다." },
  { id: "rs078", dimension: "SD", subscale: "SD1", text: "내 선택의 결과는 내가 감당하려 한다." },
  { id: "rs079", dimension: "SD", subscale: "SD1", text: "일이 틀어졌을 때 가장 먼저 내 행동부터 살핀다." },
  { id: "rs080", dimension: "SD", subscale: "SD1", text: "맡은 일을 미루는 건 스스로 용납이 잘 안 된다." },
  // SD2 목적성
  { id: "rs081", dimension: "SD", subscale: "SD2", text: "일상 속 행동이 큰 방향과 연결돼 있다고 느낀다." },
  { id: "rs082", dimension: "SD", subscale: "SD2", text: "시간을 무엇에 쓸지 분명히 정하는 편이다." },
  { id: "rs083", dimension: "SD", subscale: "SD2", text: "매주 또는 매달 챙기는 자기 목표가 있다." },
  { id: "rs084", dimension: "SD", subscale: "SD2", text: "어떤 행동을 시작할 때 그 의미를 한번 짚는다." },
  { id: "rs085", dimension: "SD", subscale: "SD2", text: "흩어진 일정 사이에서도 우선순위가 분명한 편이다." },
  // SD3 자원동원
  { id: "rs086", dimension: "SD", subscale: "SD3", text: "막힌 상황에서 새로운 방법을 찾아내는 편이다." },
  { id: "rs087", dimension: "SD", subscale: "SD3", text: "도구가 부족해도 가용한 자원을 활용해 해낸다." },
  { id: "rs088", dimension: "SD", subscale: "SD3", text: "어려운 문제를 만나면 풀어볼 의욕이 먼저 생긴다." },
  { id: "rs089", dimension: "SD", subscale: "SD3", text: "막힐 때 다른 사람에게 도움 청하는 것도 자연스럽다." },
  { id: "rs090", dimension: "SD", subscale: "SD3", text: "위기 상황에서 평소보다 더 차분해지는 편이다." },
  // SD4 자기수용
  { id: "rs091", dimension: "SD", subscale: "SD4", text: "내 단점도 어느 정도 받아들이고 살아간다." },
  { id: "rs092", dimension: "SD", subscale: "SD4", text: "내가 어떤 사람인지에 대해 큰 갈등이 없다." },
  { id: "rs093", dimension: "SD", subscale: "SD4", text: "남과 비교해도 내가 가진 것에 만족하는 편이다." },
  { id: "rs094", dimension: "SD", subscale: "SD4", text: "과거의 실수를 떠올려도 크게 흔들리지 않는다." },
  { id: "rs095", dimension: "SD", subscale: "SD4", text: "내 몸과 외모에 대해서도 비교적 평온하다." },
  // SD5 자기일치
  { id: "rs096", dimension: "SD", subscale: "SD5", text: "내가 옳다고 믿는 가치대로 자연스럽게 행동한다." },
  { id: "rs097", dimension: "SD", subscale: "SD5", text: "일관된 행동이 따로 노력 없이도 이어진다." },
  { id: "rs098", dimension: "SD", subscale: "SD5", text: "누가 보든 보지 않든 같은 모습으로 움직인다." },
  { id: "rs099", dimension: "SD", subscale: "SD5", text: "평소 행동이 내 가치와 일치한다고 느낀다." },
  { id: "rs100", dimension: "SD", subscale: "SD5", text: "결정을 내릴 때 내 원칙이 거의 흔들리지 않는다." },

  // ── CO · 연대감 ──────────────────────────────────────────
  // CO1 사회적 수용
  { id: "rs101", dimension: "CO", subscale: "CO1", text: "결이 다른 사람과도 같은 공간에서 잘 지낸다." },
  { id: "rs102", dimension: "CO", subscale: "CO1", text: "의견이 갈리는 사람도 그 자체로 인정한다." },
  { id: "rs103", dimension: "CO", subscale: "CO1", text: "사람마다 다른 방식이 있다는 걸 자연스럽게 받아들인다." },
  { id: "rs104", dimension: "CO", subscale: "CO1", text: "처음 만난 사람도 편견 없이 대하려 한다." },
  { id: "rs105", dimension: "CO", subscale: "CO1", text: "비판보다 이해를 먼저 시도하는 편이다." },
  // CO2 공감
  { id: "rs106", dimension: "CO", subscale: "CO2", text: "상대의 표정만 봐도 기분을 어느 정도 가늠한다." },
  { id: "rs107", dimension: "CO", subscale: "CO2", text: "친구의 고민을 들으면 내 일처럼 마음이 쓰인다." },
  { id: "rs108", dimension: "CO", subscale: "CO2", text: "다른 사람 입장에서 한 번 더 생각하는 습관이 있다." },
  { id: "rs109", dimension: "CO", subscale: "CO2", text: "누군가의 슬픔에 같이 가라앉는 일이 잦다." },
  { id: "rs110", dimension: "CO", subscale: "CO2", text: "침묵 속의 분위기를 읽어내는 편이다." },
  // CO3 도움 행동
  { id: "rs111", dimension: "CO", subscale: "CO3", text: "어려움을 겪는 사람을 보면 먼저 다가가는 편이다." },
  { id: "rs112", dimension: "CO", subscale: "CO3", text: "비어 있는 자리는 자연스럽게 메우려 한다." },
  { id: "rs113", dimension: "CO", subscale: "CO3", text: "내가 가진 것을 주변과 나누는 데 부담이 적다." },
  { id: "rs114", dimension: "CO", subscale: "CO3", text: "동료의 부탁은 가능하면 응하려 한다." },
  { id: "rs115", dimension: "CO", subscale: "CO3", text: "누군가에게 작은 도움이라도 되면 기운이 난다." },
  // CO4 연민
  { id: "rs116", dimension: "CO", subscale: "CO4", text: "누군가 실수했을 때 따지기 전에 사정부터 생각한다." },
  { id: "rs117", dimension: "CO", subscale: "CO4", text: "사과한 사람을 끝까지 몰아붙이지 않는다." },
  { id: "rs118", dimension: "CO", subscale: "CO4", text: "나에게 잘못한 사람도 시간이 지나면 풀어주는 편이다." },
  { id: "rs119", dimension: "CO", subscale: "CO4", text: "약자를 보호하려는 마음이 평소에도 잘 든다." },
  { id: "rs120", dimension: "CO", subscale: "CO4", text: "처벌보다 회복을 우선시하는 편이다." },
  // CO5 순수 원칙
  { id: "rs121", dimension: "CO", subscale: "CO5", text: "손해를 보더라도 정직하게 일을 처리한다." },
  { id: "rs122", dimension: "CO", subscale: "CO5", text: "작은 약속도 가볍게 어기지 않는다." },
  { id: "rs123", dimension: "CO", subscale: "CO5", text: "보는 사람이 없어도 규칙을 지킨다." },
  { id: "rs124", dimension: "CO", subscale: "CO5", text: "이익과 양심 사이에서 양심을 택하는 일이 많다." },
  { id: "rs125", dimension: "CO", subscale: "CO5", text: "내가 옳다고 믿는 일에는 잘 흔들리지 않는다." },

  // ── ST · 자기초월 ────────────────────────────────────────
  // ST1 자기망각·몰입
  { id: "rs126", dimension: "ST", subscale: "ST1", text: "좋아하는 일에 빠지면 시간 가는 줄 모른다." },
  { id: "rs127", dimension: "ST", subscale: "ST1", text: "깊이 집중할 때 주변 자극이 잘 들리지 않는다." },
  { id: "rs128", dimension: "ST", subscale: "ST1", text: "몰입하면 식사·휴식도 잊는 편이다." },
  { id: "rs129", dimension: "ST", subscale: "ST1", text: "어떤 순간에는 '나'라는 감각이 잠시 옅어진다." },
  { id: "rs130", dimension: "ST", subscale: "ST1", text: "몰입의 끝에서 잔잔한 평온을 자주 느낀다." },
  // ST2 초개인적 동일시
  { id: "rs131", dimension: "ST", subscale: "ST2", text: "내 삶이 큰 흐름의 일부라는 감각이 있다." },
  { id: "rs132", dimension: "ST", subscale: "ST2", text: "자연이나 우주와 연결돼 있다는 느낌을 받을 때가 있다." },
  { id: "rs133", dimension: "ST", subscale: "ST2", text: "모든 존재가 어떤 식으로든 이어져 있다고 느낀다." },
  { id: "rs134", dimension: "ST", subscale: "ST2", text: "사회·세대 전체의 흐름이 내 안에서도 흐른다고 느낀다." },
  { id: "rs135", dimension: "ST", subscale: "ST2", text: "다른 생명체에서도 자신과 닮은 면을 본다." },
  // ST3 영적 수용
  { id: "rs136", dimension: "ST", subscale: "ST3", text: "내가 통제할 수 없는 일이 있다는 사실을 받아들이는 편이다." },
  { id: "rs137", dimension: "ST", subscale: "ST3", text: "설명되지 않는 일이 일어날 수 있다고 생각한다." },
  { id: "rs138", dimension: "ST", subscale: "ST3", text: "물질적 성공만으로 채워지지 않는 부분이 있다고 느낀다." },
  { id: "rs139", dimension: "ST", subscale: "ST3", text: "보이지 않는 가치를 따라 살아가려 한다." },
  { id: "rs140", dimension: "ST", subscale: "ST3", text: "더 큰 이치 앞에서 내 한계를 인정하는 편이다." },
];

/** 확장판 진열 순서 (차원 라운드로빈). */
export const INTERLEAVED_TCI_ITEMS_FULL: TciItem[] = interleaveByDimension(TCI_RS_ITEMS);
