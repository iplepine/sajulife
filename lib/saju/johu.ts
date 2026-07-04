// 조후용신(調候用神) — 사주의 '기후(춥고 더움)'를 맞추는 기운.
//
// 억부가 '세기 균형'이라면 조후는 '온도 균형'이다. 태어난 달(월지)의 계절을
// 1차 기준으로 삼고, 원국 전체의 한열 좌표(balance.ts)로 강도를 조정한다.
// - 한겨울생 → 데워줄 불(火)
// - 한여름생 → 식혀줄 물(水)
// ★결정론 계산. LifeCircle·억부와 같은 한열 좌표를 공유한다.★
import type { SajuResult } from "./calculator";
import { computeNatalBalance, hanYeolLabel } from "./balance";
import { branchMeta, type Season } from "./seasonClock";
import type { Element } from "./gyeokguk";

export type JohuUrgency = "급함" | "도움" | "균형";

export type JohuResult = {
  season: Season;
  /** 월지 자연어 풀이 (예: "한밤의 한겨울") */
  seasonPhrase: string;
  hanYeol: number;
  hanYeolLabel: string;
  /** 조후용신 오행 — 온도를 맞추는 기운. 균형이면 빈 배열. */
  johu: Element[];
  urgency: JohuUrgency;
  /** 반말 풀이 */
  reason: string;
};

export function computeJohu(saju: SajuResult): JohuResult {
  const monthZhi = saju.pillars.month.zhi.hanja;
  const meta = branchMeta(monthZhi);
  const hy = computeNatalBalance(saju).natal.hanYeol; // -1 차가움 ~ +1 뜨거움

  let johu: Element[] = [];
  let urgency: JohuUrgency = "균형";
  let reason = "";

  switch (meta.season) {
    case "겨울":
      johu = hy <= -0.35 ? ["화", "목"] : ["화"];
      urgency = "급함";
      reason = "추운 달에 태어나 사주가 얼기 쉬워. 데워줄 불(그리고 불을 살리는 나무) 기운이 들어오면 확 풀려 — 조후에선 이게 최우선이야.";
      break;
    case "여름":
      johu = hy >= 0.35 ? ["수", "금"] : ["수"];
      urgency = "급함";
      reason = "더운 달에 태어나 사주가 달아오르기 쉬워. 식혀줄 물(그리고 물을 만드는 쇠) 기운이 들어오면 숨통 트여 — 조후에선 이게 최우선이야.";
      break;
    case "봄":
      if (hy <= -0.15) {
        johu = ["화"];
        urgency = "도움";
        reason = "봄이라도 아직 냉기가 남아 있어. 살짝 데워줄 불 기운이 곁들면 기지개가 잘 펴져.";
      } else {
        urgency = "균형";
        reason = "봄에 태어나 온도는 무난한 편이야. 조후는 급하지 않으니 세기 균형(억부) 쪽을 더 챙기면 돼.";
      }
      break;
    default: // 가을
      if (hy >= 0.15) {
        johu = ["수"];
        urgency = "도움";
        reason = "가을이라도 아직 열기가 남아 있어. 살짝 식혀줄 물 기운이 곁들면 결이 맑아져.";
      } else if (hy <= -0.35) {
        johu = ["화"];
        urgency = "도움";
        reason = "가을이 깊어 서늘함이 강해. 데워줄 불 기운이 곁들면 움츠러들지 않아.";
      } else {
        urgency = "균형";
        reason = "가을에 태어나 온도는 무난한 편이야. 조후는 급하지 않으니 세기 균형(억부) 쪽을 더 챙기면 돼.";
      }
  }

  return {
    season: meta.season,
    seasonPhrase: meta.phrase,
    hanYeol: hy,
    hanYeolLabel: hanYeolLabel(hy),
    johu,
    urgency,
    reason,
  };
}
