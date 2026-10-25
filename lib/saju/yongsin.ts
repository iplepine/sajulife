// 용신·기신 자동 추정 (억부 + 조후). ★결정론 계산 → LLM에 사실로 주입★.
// 명리에서 용신 잡는 법은 유파마다 갈리므로(억부·조후·격국·통관…), 여기서는
// 가장 자동화하기 쉬운 ★억부(신강/신약)★를 기준으로 잡고, 한열이 극단이면
// ★조후★를 메모로 덧붙인다. "유파에 따라 다를 수 있는 추정"임을 라벨로 명시한다.
//
// 용신 = 나를 이롭게 하는 기운(보약), 기신 = 나를 힘들게 하는 기운(과부하/독).
import { computeNatalBalance } from "./balance";
import type { SajuResult } from "./calculator";
import { ZHI_HIDDEN_STEMS } from "./tenSpirits";

type Element = "목" | "화" | "토" | "금" | "수";
const ELEMENTS: Element[] = ["목", "화", "토", "금", "수"];

/** D가 생하는 오행(식상). 목→화→토→금→수→목. */
const SHENG_NEXT: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
/** D를 생하는 오행(인성). */
const SHENG_PREV: Record<Element, Element> = { 화: "목", 토: "화", 금: "토", 수: "금", 목: "수" };
/** D가 극하는 오행(재). 목→토→수→화→금→목. */
const KE_NEXT: Record<Element, Element> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
/** D를 극하는 오행(관). */
const KE_PREV: Record<Element, Element> = { 토: "목", 금: "화", 수: "토", 목: "금", 화: "수" };

/** 천간 → 오행. 지지 속 지장간을 오행으로 바꿀 때 쓴다. */
const STEM_EL: Record<string, Element> = {
  甲: "목", 乙: "목", 丙: "화", 丁: "화", 戊: "토", 己: "토", 庚: "금", 辛: "금", 壬: "수", 癸: "수",
};
/**
 * 지장간 비중 — 정기(첫 번째)가 대부분이고 중기·여기는 일부(ZHI_HIDDEN_STEMS 순서: 정기 → 중기 → 여기).
 * 2026-10-25 점검: 예전엔 지지를 겉 오행 하나로만 세서, 寅(나무) 속 丙(불)·午 속 己(흙)처럼 일간을 받치는
 * 숨은 기운이 빠졌다 — 전문가 견본(甲午 丙寅 己未 丁卯)이 "木火土 기세가 다 강하다"고 본 사주를 4.0 대 4.0 '중화'로 봤다.
 */
const HIDDEN_WEIGHTS: Record<number, number[]> = { 1: [1], 2: [0.7, 0.3], 3: [0.6, 0.3, 0.1] };

/** 마지막 글자에 받침이 있으면 앞, 없으면 뒤 조사("목이"/"수가", "금은"/"화는"). */
function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasBatchim ? withBatchim : without}`;
}

export type TenGodGroup = "비겁" | "인성" | "식상" | "재" | "관";

/** 일간 세력 판정 — 억부·격국이 공유. */
export type BodyStrength = "신강" | "중화" | "신약";

/** 일간 오행 기준 각 오행이 어떤 십성군인지. */
export function tenGodGroupOf(ilgan: Element, el: Element): TenGodGroup {
  if (el === ilgan) return "비겁";
  if (el === SHENG_PREV[ilgan]) return "인성";
  if (el === SHENG_NEXT[ilgan]) return "식상";
  if (el === KE_NEXT[ilgan]) return "재";
  return "관"; // KE_PREV
}

export type YongsinResult = {
  ilgan: Element;
  /** 오행별 세력 점수(일간 자신 제외, 월지 ×2 가중, 지지는 지장간 비중대로 나눠 셈) */
  strength: Record<Element, number>;
  support: number; // 비겁+인성
  drain: number;   // 식상+재+관
  deukRyeong: boolean; // 월지가 비겁/인성(득령)
  body: BodyStrength;
  /** 억부 기준 용신군/기신군(오행). */
  yongsin: Element[];
  gisin: Element[];
  /** 조후 메모(한열 극단일 때만). */
  johu: string | null;
  hanYeol: number;
  reasoning: string;
};

function strengthScores(saju: SajuResult): Record<Element, number> {
  const s: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const p = saju.pillars;
  const add = (el: string, w: number) => { if (el in s) s[el as Element] += w; };
  // 지지는 속에 든 지장간을 비중대로 나눠 센다. 지장간 표에 없는 글자면 겉 오행으로 센다.
  const addBranch = (zhi: { hanja: string; wuxing: string }, w: number) => {
    const hidden = ZHI_HIDDEN_STEMS[zhi.hanja];
    const weights = hidden ? HIDDEN_WEIGHTS[hidden.length] : undefined;
    if (!hidden || !weights) return add(zhi.wuxing, w);
    hidden.forEach((stem, i) => add(STEM_EL[stem], w * weights[i]));
  };
  // 일간(일주 천간) 자신은 세력 계산에서 제외 — '나를 돕는/빼는' 나머지 글자만 본다.
  if (p.year) { add(p.year.gan.wuxing, 1); addBranch(p.year.zhi, 1); }
  if (p.month) { add(p.month.gan.wuxing, 1); addBranch(p.month.zhi, 2); } // 월지=월령, ×2
  if (p.day) { addBranch(p.day.zhi, 1); } // 일지만(일간 제외)
  if (p.time) { add(p.time.gan.wuxing, 1); addBranch(p.time.zhi, 1); }
  // 비중을 곱하며 생기는 부동소수 찌꺼기(3.5999…)를 정리한다.
  for (const el of ELEMENTS) s[el] = Math.round(s[el] * 100) / 100;
  return s;
}

export function computeYongsin(saju: SajuResult): YongsinResult {
  const ilgan = (saju.dayMaster.wuxing as Element);
  const strength = strengthScores(saju);

  const inseong = SHENG_PREV[ilgan];
  const siksang = SHENG_NEXT[ilgan];
  const jae = KE_NEXT[ilgan];
  const gwan = KE_PREV[ilgan];

  const support = strength[ilgan] + strength[inseong];           // 비겁 + 인성
  const drain = strength[siksang] + strength[jae] + strength[gwan]; // 식상 + 재 + 관
  const deukRyeong = saju.pillars.month
    ? (saju.pillars.month.zhi.wuxing === ilgan || saju.pillars.month.zhi.wuxing === inseong)
    : false;

  const ratio = support + drain > 0 ? support / (support + drain) : 0.5;
  const body: YongsinResult["body"] = ratio >= 0.55 ? "신강" : ratio <= 0.45 ? "신약" : "중화";

  // 억부: 신강이면 빼주는 쪽(식상·재·관)이 용신, 신약이면 돕는 쪽(인성·비겁)이 용신.
  let yongsin: Element[];
  let gisin: Element[];
  // 신강이면 '무엇 때문에 센지'에 따라 덜어낼 길이 다르다. 나를 돕는 기운(인성)이 넘쳐 세면 그 인성을 눌러줄
  // 재와 힘을 빼줄 식상이 약이고, 관은 인성을 더 키워(관→인성→나) 오히려 부풀리므로 용신에서 뺀다.
  // 나와 같은 기운(비겁)이 넘쳐 세면 식상·재·관 모두 약이다.
  const inseongHeavy = body === "신강" && strength[inseong] > strength[ilgan];
  if (body === "신강") {
    yongsin = inseongHeavy ? [jae, siksang] : [siksang, jae, gwan];
    gisin = [ilgan, inseong];
  } else if (body === "신약") {
    yongsin = [inseong, ilgan];
    gisin = [siksang, jae, gwan];
  } else {
    // 중화 — 억부 용신 뚜렷하지 않음. 조후로만 본다(아래).
    yongsin = [];
    gisin = [];
  }

  // 조후: 한열이 극단이면 식히거나 데우는 기운을 보탠다.
  const bal = computeNatalBalance(saju);
  const hy = bal.natal.hanYeol; // -1 차가움 ~ +1 뜨거움
  let johu: string | null = null;
  if (hy >= 0.4) johu = "사주가 뜨거운 편이라 식혀줄 물·금 기운이 들어오면 더 좋다(조후).";
  else if (hy <= -0.4) johu = "사주가 차가운 편이라 데워줄 불·나무 기운이 들어오면 더 좋다(조후).";

  const reasoning =
    `일간 ${ilgan} 기준 세력 — 돕는 힘(비겁+인성) ${support.toFixed(1)} vs 빼는 힘(식상+재+관) ${drain.toFixed(1)}, ` +
    `${deukRyeong ? "월령 얻음(득령)" : "월령 못 얻음(실령)"} → ${body}. ` +
    (body === "중화"
      ? "균형형이라 억부 용신은 뚜렷하지 않다."
      : `${body}이라 ${body === "신강" ? "빼주는" : "돕는"} ${josa(yongsin.join("·"), "이", "가")} 용신, ${josa(gisin.join("·"), "은", "는")} 기신.` +
        (inseongHeavy ? ` 돕는 힘 중 인성(${inseong} ${strength[inseong].toFixed(1)})이 비겁보다 커서, 인성을 더 키우는 관(${gwan})은 용신에서 뺐다.` : ""));

  return { ilgan, strength, support, drain, deukRyeong, body, yongsin, gisin, johu, hanYeol: hy, reasoning };
}

/** 프롬프트 주입용. 내부 근거 — 본문은 자연어로(한자·명리어 비노출). */
export function formatYongsinForPrompt(y: YongsinResult): string {
  const order = ELEMENTS.map((e) => `${e} ${y.strength[e].toFixed(1)}`).join(" / ");
  const lines = [
    `용신·기신(억부+조후 기준 자동 추정 — 유파에 따라 다를 수 있음):`,
    `- 오행 세력(일간 제외, 월지 가중): ${order}`,
    `- 신강/신약: ${y.body} (${y.reasoning})`,
  ];
  if (y.yongsin.length) {
    lines.push(`- 용신(나를 이롭게, 보약): ${y.yongsin.join("·")} / 기신(나를 힘들게, 과부하): ${y.gisin.join("·")}`);
  } else {
    lines.push(`- 균형형이라 뚜렷한 용신·기신은 없음. 한쪽으로 단정하지 말 것.`);
  }
  if (y.johu) lines.push(`- 조후: ${y.johu}`);
  lines.push(
    `해석 규칙: 용신/기신은 "운명 등급"이 아니라 "나한테 약 되는 기운 / 과부하 되는 기운"이다. ` +
    `한자·명리어(용신·기신·인성 등)를 본문에 쓰지 말고 "너를 살리는 기운은 ~", "과부하 걸리는 기운은 ~"처럼 자연어로 풀어라.`,
  );
  return lines.join("\n");
}
