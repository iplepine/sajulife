// 개인 타이밍 캘린더 — ★그 해 12개월의 흐름을 '지금→미래' 순서로★ 결정론 계산한다.
// 기존 '조심할 달'(computeCautionMonths)의 원국×대운×세운×월운 계산을 재사용하되,
// '주의'만 뽑던 걸 넘어 ★기회(보약 기운 드는 달)·정리(과부하 빠지는 달)까지★ 4색으로 분류한다.
// AI 없이 즉시 계산. 화면은 반말 톤으로만 옮긴다(한자·명리어 비노출, 공포 조장 금지).
import type { SajuResult } from "./calculator";
import { computeCautionMonths, type CautionMonth } from "./cautionMonths";
import { seasonOfBranch, type Season } from "./seasonClock";

export type TimingTone = "기회" | "정리" | "주의" | "평이";

/** 그 달 들어오는 오행 기운 → 일상어 결. */
const ELEMENT_VIBE: Record<string, string> = {
  목: "새로 벌이고 뻗어나가는",
  화: "드러내고 표현하는",
  토: "다지고 안정시키는",
  금: "정리하고 매듭짓는",
  수: "궁리하고 깊어지는",
};

const TONE_HEADLINE: Record<TimingTone, string> = {
  기회: "밀어붙이기 좋은 달 — 기운이 네 편이야",
  정리: "묵은 거 흘려보내는 달 — 움켜쥐지 말고 비워",
  주의: "템포 줄일 달 — 급하게 굴지 마",
  평이: "무난한 달 — 하던 거 꾸준히",
};

export type TimingMonth = {
  month: number;          // 1~12 (양력)
  monthLabel: string;     // "7월"
  season: Season;
  seasonPhrase: string;   // "한낮의 한여름"
  tone: TimingTone;
  /** 속도 줄이기 권장도 0~5(조심할 달과 동일 척도). */
  cautionLevel: number;
  /** 기회 점수 0~5(보약 기운 + 과부하 빠짐). */
  opportunity: number;
  isPast: boolean;
  isCurrent: boolean;
  headline: string;
  detail: string;
};

export type TimingCalendar = {
  year: number;
  currentMonth: number;
  /** 양력 1~12월 순. */
  months: TimingMonth[];
  /** ★지금 달→연말→(지난 달)★ 순으로 재배열 — 화면 레일용. */
  ordered: TimingMonth[];
  /** 지금 이후 첫 '기회' 달. */
  nextOpportunity: TimingMonth | null;
  /** 지금 이후 첫 '주의' 달. */
  nextCaution: TimingMonth | null;
  summary: string;
};

/** 조심할-달 데이터에서 '기회 점수' 산출 — 보약(용신) 기운 유입 + 과부하 빠짐. */
function opportunityOf(c: CautionMonth): number {
  let s = c.inflowRole === "용신" ? 3 : c.inflowRole === "중립" ? 1 : 0;
  if (c.direction === "정리·전환") s += 1;
  // 흔들림이 크면(권장도 높음) 순수 기회로 보기 어렵다 — 살짝 깎는다.
  if (c.level >= 4) s -= 1;
  return Math.max(0, Math.min(5, s));
}

/** 4색 분류 — 진짜 조심(살리는 기운 흔들림) > 기회 > 정리 > 흔들림 큰 달 > 평이. */
function toneOf(c: CautionMonth, opportunity: number): TimingTone {
  if (c.level >= 3 && c.direction === "주의") return "주의";
  if (c.inflowRole === "용신" && c.level <= 2) return "기회";
  if (c.direction === "정리·전환" && c.level >= 2) return "정리";
  if (c.level >= 3) return "주의";
  if (opportunity >= 3) return "기회";
  return "평이";
}

function detailOf(c: CautionMonth, tone: TimingTone, seasonPhrase: string): string {
  if (tone === "기회") {
    const vibe = ELEMENT_VIBE[c.inflowElement] ?? "기운 좋게 흐르는";
    return `${vibe} 기운이 들어와 — 시작·확장에 힘 실려`;
  }
  if (tone === "정리") {
    return "과부하 걸리던 게 빠지는 달 — 비우면 오히려 가벼워져";
  }
  if (tone === "주의") {
    const dom = c.hits[0]?.domain?.split(" — ")[0];
    return dom ? `${dom} 조심 — 급할수록 천천히` : "무리하면 탈나는 흐름 — 템포만 늦춰";
  }
  return `${seasonPhrase} 결 — 큰 변수 없이 무난해`;
}

/** {year}년 타이밍 캘린더. currentMonth(1~12)로 지난 달/이번 달을 표시하고 지금→미래로 정렬. */
export function computeTimingCalendar(
  saju: SajuResult,
  year: number,
  currentMonth: number,
): TimingCalendar {
  const caution = computeCautionMonths(saju, year);
  const months: TimingMonth[] = caution.map((c) => {
    const { season, phrase } = seasonOfBranch(c.monthZhi);
    const opportunity = opportunityOf(c);
    const tone = toneOf(c, opportunity);
    return {
      month: c.month,
      monthLabel: `${c.month}월`,
      season,
      seasonPhrase: phrase,
      tone,
      cautionLevel: c.level,
      opportunity,
      isPast: c.month < currentMonth,
      isCurrent: c.month === currentMonth,
      headline: TONE_HEADLINE[tone],
      detail: detailOf(c, tone, phrase),
    };
  });

  const upcoming = months.filter((m) => !m.isPast);
  const past = months.filter((m) => m.isPast);
  const ordered = [...upcoming, ...past];

  const nextOpportunity = upcoming.find((m) => m.tone === "기회") ?? null;
  const nextCaution = upcoming.find((m) => m.tone === "주의") ?? null;

  return {
    year,
    currentMonth,
    months,
    ordered,
    nextOpportunity,
    nextCaution,
    summary: buildSummary(nextOpportunity, nextCaution),
  };
}

function buildSummary(
  nextOpportunity: TimingMonth | null,
  nextCaution: TimingMonth | null,
): string {
  const parts: string[] = [];
  if (nextOpportunity) parts.push(`다음 좋은 타이밍은 ${nextOpportunity.monthLabel}`);
  if (nextCaution) parts.push(`템포 줄일 달은 ${nextCaution.monthLabel}`);
  if (parts.length === 0) return "올해 남은 달은 큰 변수 없이 무난하게 흘러 — 하던 거 꾸준히 밀어.";
  return `${parts.join(", ")}. 미리 알고 있으면 안 흔들려.`;
}
