// 조심할 달(시기별 주의) 계산 — 원국 지지 vs 그 해 월운(월지)의 충/형/파/해를
// 결정론으로 계산한다. ★LLM이 위험한 달을 추측하지 못하게★ 코드가 먼저 뽑고,
// 프롬프트는 이 결과를 자연어 코칭으로만 번역한다(공포 조장 금지, 한자 비노출).
//
// 위험도는 '사고 예언'이 아니라 '속도 줄이기 권장도'다 — 흉운 단정이 아닌
// "이 달엔 템포를 늦추면 좋다" 수준의 준비 신호로 쓴다.
import { Solar } from "lunar-javascript";
import { ZHI_KO, ZHI_TO_WUXING, WUXING_KO } from "./readings";
import type { SajuResult } from "./calculator";
import { computeYongsin } from "./yongsin";

type Role = "용신" | "기신" | "중립";
/** 지지(한자) → 오행 한글("수"). */
function elementOfZhi(zhi: string): string {
  return WUXING_KO[ZHI_TO_WUXING[zhi] ?? ""] ?? "";
}

/** 지지 6충(沖) — 정면 충돌. 급변·이동·사고. */
const CHUNG: ReadonlyArray<readonly [string, string]> = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];
/** 삼형(三刑) 그룹 — 둘만 만나도 형 기운(시비·관재·사고·수술). */
const SAMHYEONG: ReadonlyArray<readonly string[]> = [["寅", "巳", "申"], ["丑", "戌", "未"]];
/** 상형(相刑) 子卯 — 무례지형. */
const SANGHYEONG: readonly [string, string] = ["子", "卯"];
/** 자형(自刑) — 같은 글자끼리. 자기소모·자책. */
const JAHYEONG: ReadonlySet<string> = new Set(["辰", "午", "酉", "亥"]);
/** 파(破) — 깨짐·중단·계획 틀어짐. */
const PA: ReadonlyArray<readonly [string, string]> = [
  ["子", "酉"], ["午", "卯"], ["申", "巳"], ["寅", "亥"], ["辰", "丑"], ["戌", "未"],
];
/** 해(害) — 소모·잔병·구설. */
const HAE: ReadonlyArray<readonly [string, string]> = [
  ["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"],
];

export type CautionRelation =
  | "충" | "삼형" | "상형" | "자형" | "파" | "해";

/** 관계별 가중치(강도)와 일상 도메인 힌트(LLM이 자연어로 풀 재료). */
const RELATION_META: Record<CautionRelation, { weight: number; domain: string }> = {
  충: { weight: 3, domain: "급변·이동·안전사고 — 서두르다 부딪치는 흐름" },
  삼형: { weight: 2.5, domain: "충돌·시비·관재 — 무리하다 탈나는 흐름" },
  상형: { weight: 2, domain: "엇갈림·자존심 마찰 — 말과 태도가 부딪치는 흐름" },
  자형: { weight: 2, domain: "자기소모·과부하 — 혼자 끌어안다 지치는 흐름" },
  파: { weight: 1.5, domain: "깨짐·중단 — 계획이 틀어지거나 어그러지는 흐름" },
  해: { weight: 1, domain: "소모·잔병·구설 — 야금야금 새고 피곤해지는 흐름" },
};

/** 원국 자리별 가중치 — 일지(자기 몸)가 가장 민감, 월지(뿌리)·년지·시지 순. */
const POSITION_WEIGHT: Record<string, number> = { day: 1.6, month: 1.3, year: 1.0, time: 1.0 };
const POSITION_KO: Record<string, string> = { day: "일지(나 자신)", month: "월지(뿌리)", year: "년지(바탕)", time: "시지" };

function pairMatches(a: string, b: string, table: ReadonlyArray<readonly [string, string]>): boolean {
  return table.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** 월지(month)와 원국 지지(natal) 한 자리 사이의 가장 강한 관계 하나를 반환(없으면 null). */
function relationBetween(month: string, natal: string): CautionRelation | null {
  if (pairMatches(month, natal, CHUNG)) return "충";
  // 삼형: 둘이 같은 그룹의 서로 다른 글자
  if (SAMHYEONG.some((g) => g.includes(month) && g.includes(natal) && month !== natal)) return "삼형";
  if (pairMatches(month, natal, [SANGHYEONG])) return "상형";
  if (month === natal && JAHYEONG.has(month)) return "자형";
  if (pairMatches(month, natal, PA)) return "파";
  if (pairMatches(month, natal, HAE)) return "해";
  return null;
}

export type CautionLayer = "원국" | "대운" | "세운";

export type CautionHit = {
  relation: CautionRelation;
  /** 그 달 월운이 부딪치는 층 — 원국(타고난 자리)/대운(10년)/세운(올해) */
  layer: CautionLayer;
  /** 부딪치는 자리 라벨 — "일지(나 자신)" / "대운(10년 흐름)" / "올해 세운" */
  positionKo: string;
  targetZhi: string;       // 한자
  targetZhiKo: string;     // 한글
  /** 그 자리가 이미 세운/대운에 눌려 있어 가중됐는가 */
  reinforced: boolean;
  /** 부딪치는 자리의 오행 + 그게 용신/기신인지(기신을 흔들면 정리, 용신을 흔들면 주의) */
  targetElement: string;
  targetRole: Role;
  domain: string;
};

export type CautionMonth = {
  /** 양력 월 (1~12) */
  month: number;
  /** 그 달 월지(한자) */
  monthZhi: string;
  monthZhiKo: string;
  /** 속도 줄이기 권장도 0~5 (0 = 평이) */
  level: number;
  /** 가중 합산 원점수(내부) */
  rawScore: number;
  /** 그 달 들어오는 기운(월지 오행)과 그게 용신/기신인지 */
  inflowElement: string;
  inflowRole: Role;
  /** 용신/기신 방향: 주의(용신 흔듦/기신 유입) vs 정리·전환(기신 흔듦/용신 유입) */
  direction: "주의" | "정리·전환" | "혼재" | "중립";
  hits: CautionHit[];
};

/** 이미 세운/대운에 눌린 원국 자리를 그 달이 또 칠 때의 가중배수. */
const REINFORCE = 1.4;
/** 대운·세운 자리 자체 가중치(층 배경). */
const DAEWOON_WEIGHT = 1.1;
const SEWOON_WEIGHT = 1.2;

function scoreToLevel(s: number): number {
  if (s <= 0) return 0;
  if (s < 2.5) return 1;
  if (s < 4.5) return 2;
  if (s < 6.5) return 3;
  if (s < 9) return 4;
  return 5;
}

/** 그 해 양력 각 월(15일 기준 월주)의 월지를 lunar-javascript로 뽑는다. */
function monthZhiOf(year: number, month: number): string {
  const ec = Solar.fromYmdHms(year, month, 15, 12, 0, 0).getLunar().getEightChar();
  return ec.getMonth()[1]; // 월주 간지의 지지(한자)
}

/** {year}년 세운(년) 지지. */
function sewoonZhiOf(year: number): string {
  return Solar.fromYmdHms(year, 6, 1, 12, 0, 0).getLunar().getEightChar().getYear()[1];
}

/** {year}년에 활성인 대운 지지(시작연도가 그 해 이하인 마지막 칸). 없으면 null. */
function activeDaewoonZhi(saju: SajuResult, year: number): string | null {
  const active = saju.daewoon
    .filter((d) => d.startYear <= year)
    .sort((a, b) => b.startYear - a.startYear)[0];
  return active?.zhi.hanja ?? null;
}

type Target = { layer: CautionLayer; zhi: string; weight: number; positionKo: string; isNatal: boolean };

/**
 * '조심할 달' 계산 — ★원국 × 대운 × 세운 × 월운★ 네 층을 겹친다.
 * 그 달 월지가 (1) 원국 자리, (2) 그 해 세운, (3) 활성 대운과 충/형/파/해를 이루는지 보고,
 * 이미 세운·대운에 눌린 원국 자리를 또 치면 가중한다. 시주가 없으면 시지는 자동 제외.
 */
export function computeCautionMonths(saju: SajuResult, year: number): CautionMonth[] {
  const p = saju.pillars;
  const sewoonZhi = sewoonZhiOf(year);
  const daewoonZhi = activeDaewoonZhi(saju, year);
  const ys = computeYongsin(saju);
  const roleOf = (el: string): Role =>
    ys.yongsin.includes(el as never) ? "용신" : ys.gisin.includes(el as never) ? "기신" : "중립";

  // 비교 대상(층) 구성
  const targets: Target[] = [];
  const natalZhis: string[] = [];
  const pushNatal = (pos: string, zhi?: string) => {
    if (!zhi) return;
    targets.push({ layer: "원국", zhi, weight: POSITION_WEIGHT[pos] ?? 1, positionKo: POSITION_KO[pos] ?? pos, isNatal: true });
    natalZhis.push(zhi);
  };
  pushNatal("year", p.year?.zhi.hanja);
  pushNatal("month", p.month?.zhi.hanja);
  pushNatal("day", p.day?.zhi.hanja);
  pushNatal("time", p.time?.zhi.hanja);
  if (daewoonZhi) targets.push({ layer: "대운", zhi: daewoonZhi, weight: DAEWOON_WEIGHT, positionKo: "대운(10년 흐름)", isNatal: false });
  targets.push({ layer: "세운", zhi: sewoonZhi, weight: SEWOON_WEIGHT, positionKo: "올해 세운", isNatal: false });

  // 배경 압력: 세운·대운이 이미 부딪치고 있는 원국 지지(여기에 월운이 더 치면 가중)
  const pressured = new Set<string>();
  for (const z of natalZhis) {
    if (relationBetween(sewoonZhi, z) || (daewoonZhi && relationBetween(daewoonZhi, z))) pressured.add(z);
  }

  const out: CautionMonth[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthZhi = monthZhiOf(year, m);
    const hits: CautionHit[] = [];
    let raw = 0;
    let dirScore = 0; // + = 정리·전환(기신 흔듦/용신 유입), - = 주의(용신 흔듦/기신 유입)
    for (const t of targets) {
      const rel = relationBetween(monthZhi, t.zhi);
      if (!rel) continue;
      const reinforced = t.isNatal && pressured.has(t.zhi);
      raw += RELATION_META[rel].weight * t.weight * (reinforced ? REINFORCE : 1);
      const targetElement = elementOfZhi(t.zhi);
      const targetRole = roleOf(targetElement);
      // 원국 자리를 흔드는 경우만 방향에 반영(기신 흔듦=정리 +, 용신 흔듦=주의 -)
      if (t.isNatal) dirScore += targetRole === "기신" ? 1 : targetRole === "용신" ? -1 : 0;
      hits.push({
        relation: rel,
        layer: t.layer,
        positionKo: t.positionKo,
        targetZhi: t.zhi,
        targetZhiKo: ZHI_KO[t.zhi] ?? t.zhi,
        reinforced,
        targetElement,
        targetRole,
        domain: RELATION_META[rel].domain,
      });
    }
    // 강한 순(충>형>파>해)으로 정렬해 대표 관계가 앞에 오게
    hits.sort((a, b) => RELATION_META[b.relation].weight - RELATION_META[a.relation].weight);
    const inflowElement = elementOfZhi(monthZhi);
    const inflowRole = roleOf(inflowElement);
    dirScore += inflowRole === "용신" ? 1 : inflowRole === "기신" ? -1 : 0;
    const direction: CautionMonth["direction"] =
      ys.yongsin.length === 0 ? "중립" : dirScore > 0 ? "정리·전환" : dirScore < 0 ? "주의" : "혼재";
    out.push({
      month: m,
      monthZhi,
      monthZhiKo: ZHI_KO[monthZhi] ?? monthZhi,
      level: scoreToLevel(raw),
      rawScore: Math.round(raw * 10) / 10,
      inflowElement,
      inflowRole,
      direction,
      hits,
    });
  }
  return out;
}

/**
 * 프롬프트 주입용 텍스트. ★이 원자료는 내부 근거다 — 본문은 자연어로 번역하고
 * 충/형/파 같은 한자·명리 용어를 사용자에게 노출하지 않는다.★
 * level 2 이상(주의가 의미 있는 달)만 추려서 준다.
 */
export function formatCautionMonthsForPrompt(months: CautionMonth[], year: number): string {
  const notable = months.filter((m) => m.level >= 3).sort((a, b) => b.level - a.level || a.month - b.month);
  if (notable.length === 0) {
    return `${year}년은 원국과 크게 부딪치는 달이 두드러지지 않는다(전반적으로 평이). 특정 달을 위험으로 단정하지 말고, 무리한 시기만 가볍게 짚어라.`;
  }
  const dirNote: Record<CautionMonth["direction"], string> = {
    "주의": "주의(흔들리는 게 너를 살리는 기운이라 진짜 조심)",
    "정리·전환": "정리·전환(흔드는 게 너한테 과부하인 기운이라 잘 넘기면 오히려 풀리는 달)",
    "혼재": "혼재(좋고 나쁨이 섞임)",
    "중립": "중립",
  };
  const lines = notable.map((m) => {
    const rels = m.hits
      .map((h) => `${m.monthZhiKo}월↔${h.targetZhiKo}(${h.positionKo}, ${h.targetElement}=${h.targetRole}) ${h.relation}${h.reinforced ? "↑가중" : ""} → ${h.domain}`)
      .join(" / ");
    return `- 양력 ${m.month}월 (월지 ${m.monthZhiKo}, 들어오는 기운 ${m.inflowElement}=${m.inflowRole}): 권장도 ${m.level}/5 · 방향 ${dirNote[m.direction]} · ${rels}`;
  });
  return [
    `${year}년 '조심할 달'(원국 × 대운 × 세운 × 월운 + 용신/기신을 코드로 겹쳐 계산 — 권장도 3/5 이상만):`,
    ...lines,
    `해석 규칙: 별점(권장도)은 '흔들림 크기'고, 방향이 '좋은 흔들림/나쁜 흔들림'이다. ★기신(과부하 기운)을 흔드는 달은 겁주지 말고 "묵은 거 정리되는 전환점, 너무 움켜쥐지 마"로, 용신(살리는 기운)을 흔드는 달은 "이건 진짜 템포 낮춰"로 갈라서 써라.★ 충/형/파/해·용신·기신 같은 한자·명리 용어는 본문에 쓰지 말고 자연어로. 사고 예언·겁주기 금지, 끝은 응원으로.`,
  ].join("\n");
}

// (오행 보조 — 도메인 추론 확장 여지. 현재는 RELATION_META 고정.)
export { ZHI_TO_WUXING };
