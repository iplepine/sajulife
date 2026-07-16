// 오늘의 흐름(데일리 훅) — ★일진(오늘의 간지) × 원국 × 용신/기신★을 결정론으로 계산한다.
// AI 호출 없이 매 요청마다 즉시 계산(비용 0). ★LLM이 오늘 운을 추측하지 못하게★ 코드가
// 먼저 뽑고, 화면은 반말 톤 한마디로만 옮긴다(공포 조장·운명 단정 금지, 한자 비노출).
//
// 무엇을 겹치나:
//   1) 오늘 천간/지지의 십신(일간 기준) → '오늘 결의 테마'(사람/표현/돈/책임/배움)
//   2) 오늘 천간·지지 오행이 용신(보약)인지 기신(과부하)인지 → 기운 게이지
//   3) 오늘 지지가 원국 일지(나 자신)·월지(뿌리)와 충/형/파/해인지 → '오늘 조심' 신호
import { Solar } from "lunar-javascript";
import type { SajuResult } from "./calculator";
import { GAN_KO, ZHI_KO, GAN_TO_WUXING, ZHI_TO_WUXING, WUXING_KO } from "./readings";
import { computeYongsin, type YongsinResult } from "./yongsin";
import {
  categoryOf,
  tenSpiritFromStem,
  tenSpiritFromZhi,
  type FiveCategory,
  type TenSpirit,
} from "./tenSpirits";
import { relationBetween } from "./cautionMonths";
import { stemMeta } from "./seasonClock";

type Role = "용신" | "기신" | "중립";

/** 오늘 결의 테마(십신 5카테고리) → 일상어 코칭 재료. 한자·명리어 비노출. */
const CATEGORY_THEME: Record<
  FiveCategory,
  { emoji: string; keyword: string; good: string; overload: string }
> = {
  비겁: {
    emoji: "🤝",
    keyword: "사람·나",
    good: "사람 만나고 손잡고 같이 굴리는 일",
    overload: "괜한 경쟁심·고집에 욱하는 거",
  },
  식상: {
    emoji: "💬",
    keyword: "표현·시도",
    good: "말하고 만들고 새거 던져보는 일",
    overload: "말이 앞서서 툭 뱉고 수습 안 되는 거",
  },
  재성: {
    emoji: "💰",
    keyword: "돈·실속",
    good: "돈·숫자 챙기고 계획을 실행에 옮기는 일",
    overload: "욕심에 무리한 지출·베팅 지르는 거",
  },
  관성: {
    emoji: "🎯",
    keyword: "책임·인정",
    good: "중요한 거 매듭짓고 인정받는 일",
    overload: "눈치·압박에 눌려 나를 갈아넣는 거",
  },
  인성: {
    emoji: "📚",
    keyword: "배움·충전",
    good: "배우고 정리하고 푹 쉬며 채우는 일",
    overload: "생각만 많아지고 늘어져서 미루는 거",
  },
};

const ENERGY_LABEL: Record<DailyFlow["energy"], string> = {
  보약: "기운 차오르는 날",
  평이: "무난하게 흐르는 날",
  과부하: "기운 좀 새는 날",
};

export type DailyFlow = {
  /** 계산 기준 날짜 "YYYY-MM-DD". */
  date: string;
  /** 오늘 일진 한글("경오") — UI 앞면엔 안 쓰고 메타포로 대체, 근거 표기용. */
  ganjiKo: string;
  ganjiHanja: string;
  /** 오늘 천간 메타포(⚒️ 무쇠) — 앞면 칩. */
  dayStem: { emoji: string; short: string };
  /** 원국에서 계산한 보약 기운. 오늘 기운과 사용자의 기준을 한 화면에서 구분해 보여준다. */
  yongsin: string[];
  /** 프로필 생년월일을 기준으로 계산한 만 나이. 홈의 올해 흐름 표시에만 쓴다. */
  currentAge?: number;
  category: FiveCategory;
  spirit: TenSpirit;
  themeKeyword: string;
  themeEmoji: string;
  /** 기운 방향 — 보약(용신)/과부하(기신)/평이. */
  energy: "보약" | "평이" | "과부하";
  energyLabel: string;
  /** 1~5 게이지(3=평이). */
  score: number;
  /** 반말 한마디. */
  headline: string;
  /** 오늘 잘 맞는 것. */
  good: string;
  /** 오늘 조심(원국 충/형 또는 과부하) — 없으면 null. */
  caution: string | null;
  /** 오늘 지지가 원국 일지/월지와 부딪치나. */
  clash: boolean;
};

function roleOf(ys: YongsinResult, el: string): Role {
  if (!el) return "중립";
  return ys.yongsin.includes(el as never)
    ? "용신"
    : ys.gisin.includes(el as never)
      ? "기신"
      : "중립";
}

/** 그 날 일주(일진)의 천간·지지(한자). 정오 기준으로 뽑아 자정/야자시 경계 흔들림을 피한다. */
function dayPillarOf(dateStr: string): { gan: string; zhi: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const raw = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar().getEightChar().getDay();
  return { gan: raw[0], zhi: raw[1] };
}

function buildHeadline(energy: DailyFlow["energy"], keyword: string): string {
  if (energy === "보약") return `오늘은 기운이 네 편이야 — ‘${keyword}’ 쪽 일이 술술 풀려`;
  if (energy === "과부하") return `오늘은 기운 좀 새는 날 — 무리 말고 ‘${keyword}’만 가볍게 가`;
  return `오늘은 무난하게 흐르는 날 — ‘${keyword}’ 페이스로 꾸준히만 해`;
}

/** 오늘의 흐름 계산. 시주가 없어도 원국 일지·월지만으로 동작한다. */
export function computeDailyFlow(saju: SajuResult, dateStr: string): DailyFlow {
  const { gan, zhi } = dayPillarOf(dateStr);
  const dm = saju.dayMaster.hanja;
  const ys = computeYongsin(saju);

  const spirit = tenSpiritFromStem(dm, gan) ?? tenSpiritFromZhi(dm, zhi) ?? "비견";
  const category = categoryOf(spirit);
  const theme = CATEGORY_THEME[category];

  const stemEl = WUXING_KO[GAN_TO_WUXING[gan] ?? ""] ?? "";
  const branchEl = WUXING_KO[ZHI_TO_WUXING[zhi] ?? ""] ?? "";

  // 용신 +2 / 기신 -2 로 오늘 들어오는 기운의 방향을 잡는다.
  let raw = 0;
  for (const el of [stemEl, branchEl]) {
    const r = roleOf(ys, el);
    raw += r === "용신" ? 2 : r === "기신" ? -2 : 0;
  }

  // 오늘 지지가 원국 일지(나)·월지(뿌리)와 부딪치나 — 충/삼형은 강, 나머지는 약.
  const dayBranch = saju.pillars.day.zhi.hanja;
  const monthBranch = saju.pillars.month.zhi.hanja;
  const clashDay = relationBetween(zhi, dayBranch);
  const clashMonth = relationBetween(zhi, monthBranch);
  const strongClash =
    clashDay === "충" || clashDay === "삼형" || clashMonth === "충" || clashMonth === "삼형";
  if (strongClash) raw -= 2;
  else if (clashDay || clashMonth) raw -= 1;

  const energy: DailyFlow["energy"] = raw >= 2 ? "보약" : raw <= -2 ? "과부하" : "평이";
  const score = Math.max(1, Math.min(5, 3 + Math.round(raw / 2)));

  const caution = strongClash
    ? "오늘은 좀 덜컹거릴 수 있어 — 급하게 몰아붙이지 말고 한 박자 늦춰"
    : clashDay || clashMonth
      ? "야금야금 소모되기 쉬운 날이야 — 잔일·구설에 에너지 뺏기지 마"
      : energy === "과부하"
        ? `${theme.overload} — 오늘은 이것만 덜어내도 반은 성공이야`
        : null;

  const meta = stemMeta(gan);
  return {
    date: dateStr,
    ganjiKo: `${GAN_KO[gan] ?? gan}${ZHI_KO[zhi] ?? zhi}`,
    ganjiHanja: `${gan}${zhi}`,
    dayStem: { emoji: meta.emoji, short: meta.short },
    yongsin: ys.yongsin,
    category,
    spirit,
    themeKeyword: theme.keyword,
    themeEmoji: theme.emoji,
    energy,
    energyLabel: ENERGY_LABEL[energy],
    score,
    headline: buildHeadline(energy, theme.keyword),
    good: theme.good,
    caution,
    clash: !!(clashDay || clashMonth),
  };
}
