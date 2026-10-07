// 사주+기질 '올해 운세'의 시간 재료 — ★코드가 먼저 계산하고 LLM은 자연어로만 옮긴다.★
//
// 2026-10-08 대표 결정: 사주만 있을 때(개인 사주 풀이)는 평생 흐름에, 사주+기질은 올해 운세에 집중한다.
// 기질 검사가 '요즘의 나'를 재는 최신 값이라, 올해·내년 이야기는 사주+기질 쪽이 맡는다.
// 그래서 지금 10년 흐름, 올해·내년 세운, 타고난 자리와의 부딪힘, 남은 달 주의를 여기서 한 덩어리로 만든다.
//
// 판정 기준은 용신 화면·개인 사주와 같은 출처(buildYongsinView, computeCautionMonths)다.
// 화면마다 다른 기준을 쓰면 같은 사람이 서로 모순된 말을 듣게 된다.
import type { SajuResult } from "@/lib/saju/calculator";
import {
  computeCautionMonths,
  formatCautionMonthsForPrompt,
  relationBetween,
  type CautionRelation,
} from "@/lib/saju/cautionMonths";
import { buildYongsinView, ELEMENT_META, type FlowCell, type YongsinView } from "@/lib/saju/yongsinView";

type Verdict = FlowCell["verdict"];

const VERDICT_WORD: Record<Verdict, string> = {
  용신: "보약 쪽(너를 살리는 기운)",
  도움: "도움 되는 쪽",
  기신: "과부하 쪽(많아지면 버거운 기운)",
  중립: "중립",
};

const RELATION_WORD: Record<CautionRelation, string> = {
  충: "정면으로 부딪힘 — 자리 이동·판 바뀜·급한 변화가 생기기 쉬움",
  삼형: "마찰 — 무리하면 시비나 탈이 나기 쉬움",
  상형: "엇갈림 — 말과 태도가 부딪치기 쉬움",
  자형: "같은 기운이 겹침 — 혼자 끌어안다 지치기 쉬움",
  파: "깨짐 — 계획이 틀어져 다시 짜게 되기 쉬움",
  해: "소모 — 야금야금 새고 피곤해지기 쉬움",
};

const POSITION_WORD: Record<"year" | "month" | "day" | "time", string> = {
  year: "바탕 자리(집안·어린 시절에서 온 것)",
  month: "뿌리 자리(일·사회에서 서 있는 자리)",
  day: "나 자신 자리(몸·가장 가까운 관계)",
  time: "결실 자리(결과물·자녀·앞날)",
};

function word(el: FlowCell["element"]): string {
  return `${ELEMENT_META[el].label} 기운`;
}

function isGood(v: Verdict): boolean {
  return v === "용신" || v === "도움";
}

/** 개인 사주의 10년 흐름 판정과 같은 규칙 — 위·아래 기운을 함께 본다. */
function windOf(cell: FlowCell, unit: "해" | "10년" = "해"): string {
  const good = isGood(cell.verdict) || isGood(cell.branchVerdict);
  const bad = cell.verdict === "기신" || cell.branchVerdict === "기신";
  if (good && bad) return `섞인 바람 — 밀되 무리수는 줄일 ${unit}`;
  if (good) return `순풍 쪽 — 밀어붙여도 받쳐주는 ${unit}`;
  if (bad) return `역풍 쪽 — 힘 빼고 정리하며 지나갈 ${unit}`;
  return `잔잔한 바람 — 큰 변수 없이 내 리듬이 드러나는 ${unit}`;
}

/** 그 해 들어오는 기운이 타고난 네 자리 중 어디와 부딪히는지(가장 센 관계만). */
function clashesOf(saju: SajuResult, yearZhiHanja: string): string[] {
  const p = saju.pillars;
  const seats: Array<["year" | "month" | "day" | "time", string | undefined]> = [
    ["day", p.day?.zhi.hanja],
    ["month", p.month?.zhi.hanja],
    ["year", p.year?.zhi.hanja],
    ["time", p.time?.zhi.hanja],
  ];
  const out: string[] = [];
  for (const [pos, zhi] of seats) {
    if (!zhi) continue;
    const rel = relationBetween(yearZhiHanja, zhi);
    if (rel) out.push(`${POSITION_WORD[pos]}와 ${RELATION_WORD[rel]}`);
  }
  return out;
}

function describeYear(saju: SajuResult, cell: FlowCell, heading: string): string[] {
  const clashes = clashesOf(saju, cell.zhiHanja);
  return [
    `${heading}`,
    `  · 들어오는 기운: 위쪽 ${word(cell.element)} = ${VERDICT_WORD[cell.verdict]} / 아래쪽 ${word(cell.branchElement)} = ${VERDICT_WORD[cell.branchVerdict]} · 계절감 ${cell.season}`,
    `  · 바람 방향: ${windOf(cell)}`,
    clashes.length
      ? `  · 타고난 자리와의 만남: ${clashes.join(" / ")}`
      : "  · 타고난 자리와의 만남: 정면으로 부딪히는 자리는 없음(판이 크게 흔들리기보다 내 선택이 결과를 가름)",
  ];
}

/**
 * 프롬프트 주입용 '올해 운세 재료'.
 * ★한자·간지 이름은 넣지 않는다★ — 본문 노출 금지 규칙과 같은 이유로, 재료부터 자연어로 준다.
 */
export function formatYearFortuneForPrompt(
  saju: SajuResult,
  currentAge: number,
  currentYear: number,
  currentMonth: number,
  view: YongsinView = buildYongsinView(saju, currentAge, currentYear),
): string {
  const lines: string[] = [];

  const dae = view.flow.find((c) => c.kind === "대운" && c.isNow);
  if (dae && dae.startAge != null && dae.endAge != null) {
    lines.push(
      `[지금 지나는 10년 흐름] 만 ${dae.startAge}~${dae.endAge - 1}세 구간(지금 만 ${currentAge}세)`,
      `  · 들어오는 기운: 위쪽 ${word(dae.element)} = ${VERDICT_WORD[dae.verdict]} / 아래쪽 ${word(dae.branchElement)} = ${VERDICT_WORD[dae.branchVerdict]} · 계절감 ${dae.season}`,
      `  · 바람 방향: ${windOf(dae, "10년")}`,
    );
  } else {
    lines.push("[지금 지나는 10년 흐름] 계산 불가(출생 정보 부족) — 10년 흐름은 언급하지 말고 올해·내년 재료로만 써라.");
  }

  const thisYear = view.flow.find((c) => c.kind === "세운" && c.year === currentYear);
  const nextYear = view.flow.find((c) => c.kind === "세운" && c.year === currentYear + 1);
  if (thisYear) lines.push("", ...describeYear(saju, thisYear, `[올해 ${currentYear}년 — 오늘은 ${currentMonth}월, 올해 남은 달 ${12 - currentMonth}개월]`));
  if (nextYear) lines.push("", ...describeYear(saju, nextYear, `[내년 ${currentYear + 1}년]`));

  if (thisYear && nextYear) {
    const shift = windOf(thisYear) === windOf(nextYear) ? "바람 방향이 비슷하게 이어짐" : "바람 방향이 바뀜";
    lines.push("", `[올해 → 내년] ${shift} — 올해 '${windOf(thisYear).split(" — ")[0]}'에서 내년 '${windOf(nextYear).split(" — ")[0]}'로.`);
  }

  lines.push(
    "",
    formatCautionMonthsForPrompt(computeCautionMonths(saju, currentYear), currentYear, currentMonth),
  );

  return lines.join("\n");
}
