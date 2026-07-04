// 격국(格局) 판정 — 사주의 '틀·그릇' 타입.
//
// 월지(월령)의 지장간 중 천간에 투출(透出)한 것의 십신으로 격을 정한다.
// 투출이 없으면 월지 정기(본기)의 십신으로 잡는다(= 월령 본기격).
// 월지가 일간과 같은 오행(비겁)이면 정격이 안 서므로 건록/양인 계열로 본다.
//
// ★결정론 계산 — 격 이름·설명은 확정.★
// 격국용신(상신) 추천 오행은 유파마다 갈리므로 "참고" 라벨을 반드시 붙인다.
import type { SajuResult } from "./calculator";
import {
  ZHI_HIDDEN_STEMS,
  tenSpiritFromStem,
  categoryOf,
  type TenSpirit,
  type FiveCategory,
} from "./tenSpirits";
import type { BodyStrength } from "./yongsin";

export type Element = "목" | "화" | "토" | "금" | "수";

/** D를 생하는 오행(인성). */
const SHENG_PREV: Record<Element, Element> = { 화: "목", 토: "화", 금: "토", 수: "금", 목: "수" };
/** D가 생하는 오행(식상). */
const SHENG_NEXT: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
/** D가 극하는 오행(재). */
const KE_NEXT: Record<Element, Element> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
/** D를 극하는 오행(관). */
const KE_PREV: Record<Element, Element> = { 토: "목", 금: "화", 수: "토", 목: "금", 화: "수" };

/** 십신 → 격 이름. 비겁(비견·겁재)은 정격이 아니라 건록/양인격. */
const GYEOK_NAME: Record<TenSpirit, string> = {
  정관: "정관격", 편관: "편관격",
  정재: "정재격", 편재: "편재격",
  식신: "식신격", 상관: "상관격",
  정인: "정인격", 편인: "편인격",
  비견: "건록격", 겁재: "양인격",
};

/** 격별 일상어 별명 + 반말 풀이. 한자·명리어는 이름에만 두고 본문은 자연어. */
const GYEOK_COPY: Record<TenSpirit, { title: string; description: string }> = {
  정관: {
    title: "곧은 관리자형",
    description:
      "규칙·책임·명예를 중히 여기는 '반듯한 그릇'이야. 자리 잡고 인정받는 길에서 제일 빛나. 대신 융통성 없단 소리 들을 수 있으니 가끔은 힘 빼도 돼.",
  },
  편관: {
    title: "돌파하는 장수형",
    description:
      "압박·경쟁·큰 판을 정면으로 뚫는 '센 그릇'이야. 위기에서 오히려 강해지는 타입이지. 다만 너무 몰아치면 스스로 갈리니까 완급 조절이 관건이야.",
  },
  정재: {
    title: "차곡차곡 실속형",
    description:
      "성실하게 모으고 관리하는 '안정 그릇'이야. 꾸준함으로 결국 쌓아 올리는 사람. 너무 아끼다 기회 놓치지 않게, 가끔은 질러도 돼.",
  },
  편재: {
    title: "판 키우는 승부사형",
    description:
      "큰 흐름·기회·사업 감각의 '통 큰 그릇'이야. 돈과 사람을 크게 굴리는 손을 타고났어. 대신 벌린 판 수습하는 힘을 같이 챙겨야 안 샌다.",
  },
  식신: {
    title: "느긋한 장인형",
    description:
      "좋아하는 걸 깊게 파고 표현하는 '여유 그릇'이야. 재능이 자연스럽게 흘러나오는 타입이지. 게을러 보일 때도 있지만 그게 네 페이스야.",
  },
  상관: {
    title: "날 세운 창작가형",
    description:
      "기존 틀을 비틀고 새로 만드는 '예리한 그릇'이야. 말·재능·표현이 곧 네 무기지. 대신 튀는 만큼 부딪힘도 많으니 방향만 잘 골라.",
  },
  정인: {
    title: "배움 깊은 학자형",
    description:
      "배우고 받아들이고 지키는 '든든한 그릇'이야. 지식·자격·부모 덕이 네 밑천이지. 생각만 길어지지 않게 실행 한 스푼만 얹으면 돼.",
  },
  편인: {
    title: "직관 예민한 탐구형",
    description:
      "남다른 시선·직관·특수 분야의 '독특한 그릇'이야. 영감으로 승부 보는 타입이지. 꽂히는 것만 파는 편이라 꾸준함을 곁들이면 완성돼.",
  },
  비견: {
    title: "뿌리 깊은 독립형",
    description:
      "제 힘으로 서는 '단단한 그릇'이야. 누구 밑에서보다 내 판에서 강한 사람. 혼자 다 짊어지려다 지치지 않게 곁을 두는 게 포인트야.",
  },
  겁재: {
    title: "기세 센 돌격형",
    description:
      "폭발력·추진력이 남다른 '강한 그릇'이야. 한번 붙으면 끝을 보는 타입이지. 그 힘을 쏟을 '자리'만 잘 잡으면 무섭게 커.",
  },
};

export type GyeokgukResult = {
  /** 격 이름 (예: "정관격") */
  name: string;
  /** 격을 정한 십신 */
  spirit: TenSpirit;
  category: FiveCategory;
  /** 월지 지장간이 천간에 투출해 잡혔는지(아니면 월령 본기격) */
  revealed: boolean;
  /** 비겁격(건록·양인)이라 정격이 아닌지 */
  isPeer: boolean;
  /** 일상어 별명 */
  title: string;
  /** 반말 풀이 */
  description: string;
  /** 격을 정한 근거(월지·투출) 한 줄 */
  basis: string;
  /** 상신(격국용신) 추천 오행 — 유파 갈림, 참고용 */
  sangsin: Element[];
  /** 상신 근거 한 줄(반말) */
  sangsinReason: string;
};

/**
 * 격국 판정. 신강/신약(body)은 억부(computeYongsin)에서 받아 상신 방향을 정한다.
 */
export function computeGyeokguk(saju: SajuResult, body: BodyStrength): GyeokgukResult {
  const dm = saju.pillars.day.gan.hanja; // 일간 천간(한자)
  const dmEl = saju.dayMaster.wuxing as Element;
  const monthZhi = saju.pillars.month.zhi.hanja;
  const hidden = ZHI_HIDDEN_STEMS[monthZhi] ?? [];

  // 일간을 제외한 천간(연간·월간·시간)에 월지 지장간이 투출했는지 본다.
  const openStems: string[] = [
    saju.pillars.year.gan.hanja,
    saju.pillars.month.gan.hanja,
    ...(saju.pillars.time ? [saju.pillars.time.gan.hanja] : []),
  ];

  // 투출 우선순위: 정기(hidden[0]) → 중기 → 여기. 없으면 월령 본기.
  let chosenStem: string | null = null;
  let revealed = false;
  for (const h of hidden) {
    if (openStems.includes(h)) {
      chosenStem = h;
      revealed = true;
      break;
    }
  }
  if (!chosenStem) chosenStem = hidden[0] ?? dm;

  const spirit = tenSpiritFromStem(dm, chosenStem) ?? "비견";
  const category = categoryOf(spirit);
  const isPeer = category === "비겁";
  const copy = GYEOK_COPY[spirit];

  const { sangsin, sangsinReason } = computeSangsin(dmEl, category, body);

  const basis = revealed
    ? `월지(태어난 달의 뿌리)의 기운이 천간까지 뚜렷하게 올라와 이 결로 굳었어.`
    : `천간에 크게 드러나진 않았지만, 태어난 달의 본바탕 기운이 이 결이야.`;

  return {
    name: GYEOK_NAME[spirit],
    spirit,
    category,
    revealed,
    isPeer,
    title: copy.title,
    description: copy.description,
    basis,
    sangsin,
    sangsinReason,
  };
}

/**
 * 상신(격국용신) — 격이라는 '그릇'을 완성시키는 재료 오행.
 * 신강/신약에 따라 격을 살리는 방향이 달라진다. (유파마다 갈리는 영역 — 참고용)
 */
function computeSangsin(
  dmEl: Element,
  category: FiveCategory,
  body: BodyStrength,
): { sangsin: Element[]; sangsinReason: string } {
  const inseong = SHENG_PREV[dmEl]; // 나를 돕는
  const bigyeop = dmEl; // 나와 같은
  const siksang = SHENG_NEXT[dmEl]; // 내가 내보내는
  const jae = KE_NEXT[dmEl]; // 내가 다루는(재물)
  const gwan = KE_PREV[dmEl]; // 나를 조이는(책임·자리)
  const weak = body === "신약";

  switch (category) {
    case "재성":
      return weak
        ? { sangsin: [bigyeop, inseong], sangsinReason: "재물 그릇이 큰데 담을 내 힘이 얇으면 새. 내 편·밑천(비겁·인성)이 먼저 받쳐줘야 온전히 담아." }
        : { sangsin: [siksang, jae], sangsinReason: "내 힘은 충분하니, 재물을 '만들어내는' 흐름(식상)과 재물 자체가 살아날 때 그릇이 완성돼." };
    case "관성":
      return weak
        ? { sangsin: [inseong, bigyeop], sangsinReason: "책임·자리를 감당하려면 나를 받쳐줄 배움·기반(인성)이 그 무게를 나한테 잘 이어줘야 안 눌려." }
        : { sangsin: [jae, gwan], sangsinReason: "내 힘이 받쳐주니, 자리·명예를 키워주는 흐름(재→관)이 곧 이 그릇을 완성해." };
    case "식상":
      return weak
        ? { sangsin: [inseong], sangsinReason: "재능·표현이 앞서는데 밑천이 얇으면 방전돼. 배움·안정(인성)이 브레이크이자 보약이야." }
        : { sangsin: [jae], sangsinReason: "타고난 재능을 결과물·돈(재)으로 연결할 때 이 그릇이 제일 빛나." };
    case "인성":
      if (body === "신강")
        return { sangsin: [jae], sangsinReason: "받쳐주는 힘이 넘쳐 늘어질 수 있어. 현실·재물(재)이 적당한 긴장을 줘야 굴러가." };
      if (weak)
        return { sangsin: [inseong, bigyeop], sangsinReason: "아직 밑천이 얇으니, 배움·내 편(인성·비겁)을 더 채우는 게 먼저야." };
      return { sangsin: [siksang, jae], sangsinReason: "쌓인 밑천을 표현·결과(식상·재)로 꺼내 쓸 때 완성돼." };
    default: // 비겁 — 건록/양인
      return weak
        ? { sangsin: [inseong], sangsinReason: "드물게 힘이 부족한 경우라, 배움·기반(인성)을 더 채우면 단단해져." }
        : { sangsin: [gwan, jae, siksang], sangsinReason: "내 기운이 뿌리 깊게 강하니, 그 힘을 자리·재물·표현(관·재·식상)으로 '써먹을' 때 그릇이 완성돼." };
  }
}
