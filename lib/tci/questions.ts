import type { TciVariant } from "@/lib/store/types";

export type TciDimension =
  | "NS"
  | "HA"
  | "RD"
  | "PS"
  | "SD"
  | "CO"
  | "ST";

export type TciItem = {
  id: string;
  dimension: TciDimension;
  /** 정식판 한정: 차원 안의 하위척도 코드 (예: "NS1"). 약식판은 undefined. */
  subscale?: string;
  text: string;
  reverse?: boolean;
};

export const TCI_DIMENSIONS: Record<TciDimension, { label: string; description: string }> = {
  // 라벨은 사주라이프 용어 체계(추진성·안정성…)로 재명명. 코드(NS 등)는 채점용 내부 키.
  NS: { label: "추진성", description: "새로 시작하고 움직이게 만드는 추진력" },
  HA: { label: "안정성", description: "위험을 미리 살피고 안정적으로 관리하는 성향" },
  RD: { label: "공감성", description: "타인의 정서에 감응하고 유대에 반응하는 성향" },
  PS: { label: "지속성", description: "끝까지 버티고 완수하는 힘" },
  SD: { label: "주도성", description: "스스로 선택·결정하고 책임지는 성향" },
  CO: { label: "연결성", description: "협력하고 소속·신뢰로 연결되는 성향" },
  ST: { label: "통찰성", description: "의미·직관·성찰로 자기를 넘어서는 성향" },
};

/**
 * 약식판(35문항) — 자체 제작 프로토타입 문항.
 * 실제 TCI 문항이 아니며, 차원 구조(7개)는 일반 기질-성격 모형 개념을 차용한다.
 * 정식 진단이 필요한 사용자는 정식판(`TCI_RS_ITEMS`, 140문항) 사용.
 */
export const TCI_ITEMS_SHORT: TciItem[] = [
  { id: "ns1", dimension: "NS", text: "처음 가는 동네를 지도 없이 그냥 걷는 게 즐겁다." },
  { id: "ns2", dimension: "NS", text: "익숙한 메뉴보다 한 번도 안 먹어본 메뉴를 골라본다." },
  { id: "ns3", dimension: "NS", text: "오래 고민하기보다 일단 해보고 판단한다." },
  { id: "ns4", dimension: "NS", text: "단조로운 일정이 며칠 이어지면 답답해진다." },
  { id: "ns5", dimension: "NS", text: "갑작스러운 계획 변경이 오히려 흥미롭다." },

  { id: "ha1", dimension: "HA", text: "최악의 상황을 미리 그려보는 편이다." },
  { id: "ha2", dimension: "HA", text: "낯선 사람들 앞에서 말하기 전에 긴장이 길게 남는다." },
  { id: "ha3", dimension: "HA", text: "결정을 내린 뒤에도 다른 가능성이 자꾸 떠오른다." },
  { id: "ha4", dimension: "HA", text: "예상치 못한 변수에 쉽게 지친다." },
  { id: "ha5", dimension: "HA", text: "잘 알지 못하는 일은 가능하면 피하고 싶다." },

  { id: "rd1", dimension: "RD", text: "주변 사람이 힘들어하면 내 기분도 함께 가라앉는다." },
  { id: "rd2", dimension: "RD", text: "오래된 친구의 사소한 일도 기억해 두는 편이다." },
  { id: "rd3", dimension: "RD", text: "내가 한 일이 누군가에게 도움이 됐다는 말을 들으면 오래 기억에 남는다." },
  { id: "rd4", dimension: "RD", text: "함께 있는 사람의 분위기를 자주 살핀다." },
  { id: "rd5", dimension: "RD", text: "혼자보다 누군가와 같이 시간을 보낼 때 회복된다." },

  { id: "ps1", dimension: "PS", text: "한 번 시작한 일은 결과가 나올 때까지 붙잡는 편이다." },
  { id: "ps2", dimension: "PS", text: "결과가 더디게 나와도 방법을 바꿔가며 계속 시도한다." },
  { id: "ps3", dimension: "PS", text: "내 기준을 채우지 못한 결과물은 다시 손보고 싶다." },
  { id: "ps4", dimension: "PS", text: "지치는 순간에도 마무리를 못 하면 마음이 불편하다." },
  { id: "ps5", dimension: "PS", text: "장기 계획을 세우고 단계별로 확인하는 게 자연스럽다." },

  { id: "sd1", dimension: "SD", text: "내가 무엇을 원하는지 비교적 분명히 안다." },
  { id: "sd2", dimension: "SD", text: "실수에 휘둘리기보다 다음 행동을 먼저 정한다." },
  { id: "sd3", dimension: "SD", text: "내 시간과 우선순위는 내가 정한다고 느낀다." },
  { id: "sd4", dimension: "SD", text: "어려운 상황에서도 내 역할을 스스로 찾는다." },
  { id: "sd5", dimension: "SD", text: "내 단점도 일부는 받아들이는 편이다." },

  { id: "co1", dimension: "CO", text: "의견이 달라도 상대 입장을 먼저 짚어본다." },
  { id: "co2", dimension: "CO", text: "내가 손해를 보더라도 약속은 지키려 한다." },
  { id: "co3", dimension: "CO", text: "팀에서 누군가의 몫이 비면 자연스럽게 메우게 된다." },
  { id: "co4", dimension: "CO", text: "나와 결이 다른 사람과도 협력할 수 있다." },
  { id: "co5", dimension: "CO", text: "타인의 사정 앞에서 비판보다 이해를 먼저 시도한다." },

  { id: "st1", dimension: "ST", text: "어떤 일에 몰입하면 시간 감각이 자주 사라진다." },
  { id: "st2", dimension: "ST", text: "내 인생이 나보다 큰 흐름과 연결돼 있다고 느낀다." },
  { id: "st3", dimension: "ST", text: "자연이나 예술 앞에서 마음이 조용히 가라앉는 순간이 있다." },
  { id: "st4", dimension: "ST", text: "내가 통제할 수 없는 일이 있다는 사실을 받아들이는 편이다." },
  { id: "st5", dimension: "ST", text: "물질적 성공만으로는 채워지지 않는 부분이 있다고 느낀다." },
];

export const LIKERT_SCALE = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통이다" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
];

/**
 * 응답자에게 노출할 때 사용하는 라운드로빈 순서.
 * TCI_ITEMS는 차원별로 묶여 있어서 그대로 보여주면 응답자가 패턴을 눈치채고
 * 답을 의식적으로 조정해버린다(사회적 바람직성 편향). 차원이 연속해서 등장하지
 * 않도록 [NS₁, HA₁, RD₁, PS₁, SD₁, CO₁, ST₁, NS₂, HA₂, ...] 식으로 인터리브한다.
 *
 * 결정적(deterministic) 순서이므로 다시 들어와도 문항 순서가 안 바뀐다 — 응답을
 * 이어서 채울 때 헷갈리지 않게.
 */
function interleaveByDimension(items: TciItem[]): TciItem[] {
  const byDim: Record<TciDimension, TciItem[]> = {
    NS: [], HA: [], RD: [], PS: [], SD: [], CO: [], ST: [],
  };
  for (const item of items) byDim[item.dimension].push(item);
  const dims = Object.keys(byDim) as TciDimension[];
  const maxLen = Math.max(0, ...dims.map((d) => byDim[d].length));
  const out: TciItem[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (const d of dims) {
      const it = byDim[d][i];
      if (it) out.push(it);
    }
  }
  return out;
}

/** 약식판 진열 순서 (차원 라운드로빈). */
export const INTERLEAVED_TCI_ITEMS_SHORT: TciItem[] = interleaveByDimension(TCI_ITEMS_SHORT);

// ── 호환용 별칭 (기존 임포트가 안 깨지게) ──
/** @deprecated `TCI_ITEMS_SHORT`을 쓰세요. */
export const TCI_ITEMS = TCI_ITEMS_SHORT;
/** @deprecated `INTERLEAVED_TCI_ITEMS_SHORT`을 쓰세요. */
export const INTERLEAVED_TCI_ITEMS = INTERLEAVED_TCI_ITEMS_SHORT;

export { interleaveByDimension };

/** variant → 문항 배열 (라운드로빈 적용된 진열 순서). */
export async function getInterleavedItems(variant: TciVariant): Promise<TciItem[]> {
  if (variant === "full") {
    const mod = await import("./questions-rs");
    return mod.INTERLEAVED_TCI_ITEMS_FULL;
  }
  return INTERLEAVED_TCI_ITEMS_SHORT;
}

/** variant → 채점용 원본 문항 배열. */
export async function getItemsForScoring(variant: TciVariant): Promise<TciItem[]> {
  if (variant === "full") {
    const mod = await import("./questions-rs");
    return mod.TCI_RS_ITEMS;
  }
  return TCI_ITEMS_SHORT;
}
