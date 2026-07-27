// 용신 검증 — "내가 좋았던 해"와 "코드가 계산한 보약 기운"을 대조한다.
//
// 사용자가 몸이 제일 좋았던 해를 몇 개 고르면, 그 해의 세운·대운에 실제로
// 보약 기운(종합 용신)이 들어와 있었는지 확인해준다. 맞으면 "봐, 맞지?",
// 안 맞으면 억지로 맞다고 우기지 않고 솔직하게 말한다.
//
// ★전부 결정론 계산 — AI 호출 없음.★
import { Solar } from "lunar-javascript";
import { GAN_KO, ZHI_KO, GAN_TO_WUXING, ZHI_TO_WUXING, WUXING_KO } from "./readings";
import { ELEMENT_META, type Element, type YongsinView } from "./yongsinView";

/** 그 해 세운 간지 — 입춘 기준이라 연중(7/1)을 샘플해 경계를 피한다(만세력과 동일 계산). */
function yearPillar(year: number): { ganKo: string; zhiKo: string; stemEl: Element; branchEl: Element } {
  const gz = Solar.fromYmdHms(year, 7, 1, 12, 0, 0).getLunar().getEightChar().getYear();
  const gan = gz[0];
  const zhi = gz[1];
  return {
    ganKo: GAN_KO[gan] ?? gan,
    zhiKo: ZHI_KO[zhi] ?? zhi,
    stemEl: (WUXING_KO[GAN_TO_WUXING[gan] ?? ""] ?? "토") as Element,
    branchEl: (WUXING_KO[ZHI_TO_WUXING[zhi] ?? ""] ?? "토") as Element,
  };
}

export type YearVerdict = "보약" | "혼재" | "보통" | "과부하";

export type YearCheck = {
  year: number;
  /** 그 해 만 나이. currentAge를 모르면 null. */
  age: number | null;
  /** 세운 간지 한글 — "병오" */
  ganzhi: string;
  stemEl: Element;
  branchEl: Element;
  /** 그 해를 지나던 대운의 기운(없으면 null) */
  daewoonEls: Element[];
  /** 세운·대운을 합쳐 보약 기운이 들어와 있었나 */
  hasGood: boolean;
  hasBad: boolean;
  verdict: YearVerdict;
  /** 화면에 그대로 쓰는 반말 한 줄 */
  note: string;
};

export type YongsinCheck = {
  /** 보약 기운(종합 용신 + 보조) */
  goodEls: Element[];
  /** 과부하 기운(기신) */
  badEls: Element[];
  years: YearCheck[];
  /** 보약/혼재로 판정된 해 수 */
  hitCount: number;
  /** 고른 해 수 */
  total: number;
  headline: string;
  body: string;
  tone: "strong" | "partial" | "weak";
};

const kigi = (el: Element) => `${ELEMENT_META[el].label} 기운`;
const listKigi = (els: Element[]) => els.map((e) => ELEMENT_META[e].label).join("·");

/** 한 해가 내 보약 기운이 들어온 해였는지 판정. */
export function checkYear(view: YongsinView, year: number, currentYear: number): YearCheck {
  const goodEls = [...view.primaryYong, ...view.helperYong];
  const badEls = view.gisin;
  const p = yearPillar(year);

  // 그 해를 지나던 대운 — startYear가 그 해 이하인 마지막 칸.
  const dae = view.flow.filter((c) => c.kind === "대운");
  const active = dae.filter((c) => c.year <= year).sort((a, b) => b.year - a.year)[0] ?? null;
  const daewoonEls: Element[] = active ? [active.element, active.branchElement] : [];

  // ★판정은 그 해 세운(간지)으로만 한다.★ 대운까지 '적중'에 넣으면 10년 내내 같은 판정이 깔려
  // 무슨 해를 골라도 맞는 것처럼 보인다(= 검증이 아니라 확증 편향). 대운은 배경 설명으로만 쓴다.
  const seunEls = [p.stemEl, p.branchEl];
  const seunGood = [...new Set(seunEls.filter((e) => goodEls.includes(e)))];
  const seunBad = seunEls.some((e) => badEls.includes(e));
  const hasGood = seunGood.length > 0;
  const verdict: YearVerdict = hasGood && seunBad ? "혼재" : hasGood ? "보약" : seunBad ? "과부하" : "보통";

  const daeGood = [...new Set(daewoonEls.filter((e) => goodEls.includes(e)))];
  // 적중한 해는 '게다가'로 얹고, 빗나간 해는 '대신'으로 받는다(안 들어왔는데 "~에도"로 이으면 말이 꼬인다).
  const daeAdd = daeGood.length ? ` 그때 지나던 10년 흐름에도 ${listKigi(daeGood)} 기운이 깔려 있었어.` : "";
  const daeBut = daeGood.length ? ` 대신 그때 지나던 10년 흐름엔 ${listKigi(daeGood)} 기운이 깔려 있었어.` : "";

  let note: string;
  if (verdict === "보약") {
    const head = seunGood.length === 2
      ? `위아래 둘 다 ${listKigi(seunGood)} 기운으로 채워진 해야.`
      : `${listKigi(seunGood)} 기운이 들어온 해야.`;
    note = `${head} 네 보약 기운 맞아.${daeAdd}`;
  } else if (verdict === "혼재") {
    note = `${listKigi(seunGood)} 기운은 들어왔는데 과부하 기운도 같이 껴 있었어. 좋은 쪽이 조금 이긴 해로 봐.${daeAdd}`;
  } else if (verdict === "과부하") {
    note = `이 해 자체엔 보약이 안 들어오고 과부하 쪽이 강했어. 그래도 좋았다면 기운보다 네 관리가 컸던 거야.${daeBut}`;
  } else {
    note = `이 해 자체엔 보약도 과부하도 안 들어왔어. 컨디션은 기운보다 생활 쪽 영향이 컸겠다.${daeBut}`;
  }

  return {
    year,
    age: view.currentAge != null ? view.currentAge + (year - currentYear) : null,
    ganzhi: `${p.ganKo}${p.zhiKo}`,
    stemEl: p.stemEl,
    branchEl: p.branchEl,
    daewoonEls,
    hasGood,
    hasBad: seunBad,
    verdict,
    note,
  };
}

/**
 * 고른 해들을 한꺼번에 대조하고 총평까지 만든다.
 * ★안 맞으면 맞다고 우기지 않는다 — 용신은 유파 갈리는 추정이라는 걸 그대로 말한다.★
 */
export function buildYongsinCheck(view: YongsinView, years: number[], currentYear: number): YongsinCheck {
  const goodEls = [...view.primaryYong, ...view.helperYong];
  const badEls = view.gisin;
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  const checks = sorted.map((y) => checkYear(view, y, currentYear));
  const hitCount = checks.filter((c) => c.verdict === "보약" || c.verdict === "혼재").length;
  const total = checks.length;

  const goodLabel = goodEls.length ? `${listKigi(goodEls)} 기운` : "뚜렷한 보약 기운";

  let headline: string;
  let body: string;
  let tone: YongsinCheck["tone"];

  if (!goodEls.length) {
    tone = "weak";
    headline = "네 사주는 균형형이라 대조할 보약 기운이 뚜렷하지 않아";
    body =
      "한쪽으로 안 쏠린 사주라 '이 기운이 들면 좋아진다'를 딱 집기 어려워. " +
      "그러니 좋았던 해는 기운 덕이라기보다 네가 만든 환경 덕이라고 보는 게 맞아.";
  } else if (total === 0) {
    tone = "weak";
    headline = "좋았던 해를 골라줘";
    body = `네 보약은 ${goodLabel}이야. 그 기운이 실제로 들어온 해였는지 맞춰볼게.`;
  } else if (hitCount === total) {
    tone = "strong";
    headline = `${total}개 다 맞았어 — 봐, 용신이 맞지?`;
    // ★보약 오행이 넓으면 웬만한 해가 걸린다 — 다 맞았다고 과장하지 말고 그 사실을 같이 알려준다.★
    const wide = goodEls.length >= 3
      ? ` 다만 솔직하게 하나 짚자면, 네 보약은 ${goodEls.length}갈래라 원래 걸치는 해가 많은 편이야. 그러니 이건 '역시 맞네' 정도로 보고 너무 신봉하진 마.`
      : "";
    body =
      `네가 고른 해가 전부 ${goodLabel}이 들어온 시기야. ` +
      `앞으로도 이 기운 들어오는 때를 노리면 돼.${wide}`;
  } else if (hitCount > 0) {
    tone = "partial";
    headline = `${total}개 중 ${hitCount}개가 맞았어`;
    body =
      `${goodLabel}이 들어온 해가 ${hitCount}개 겹쳤어. 나머지는 기운보다 네 생활·환경이 컸던 해로 보여. ` +
      `사람 컨디션이 기운 하나로만 굴러가는 건 아니니까 이 정도면 충분히 신호야.`;
  } else {
    tone = "weak";
    headline = "이번엔 딱 안 맞네";
    body =
      `네가 고른 해엔 ${goodLabel}이 뚜렷하게 안 들어왔어. 억지로 맞다고 우기진 않을게 — ` +
      `용신은 유파에 따라 갈리는 추정이고, 컨디션은 기운 말고도 변수가 많거든. ` +
      `다른 해로 한 번 더 맞춰보거나, 그냥 참고 정도로만 봐.`;
  }

  return { goodEls, badEls, years: checks, hitCount, total, headline, body, tone };
}

/** 검증에 고를 수 있는 연도 범위 — 기억이 남는 나이(만 10세)부터 올해까지. */
export function selectableYears(birthYear: number, currentYear: number): number[] {
  const from = Math.max(birthYear + 10, currentYear - 45);
  const out: number[] = [];
  for (let y = currentYear; y >= from; y--) out.push(y);
  return out;
}

export { kigi };
