// 용신 보기 화면의 뷰 모델 — 격국·억부·조후 세 방법을 한자리에 모으고,
// 세 방법이 겹치는 오행을 '종합 용신'으로 뽑은 뒤, 대운·세운 생애 흐름에
// 좋은 시기/버거운 시기를 색칠할 재료까지 만든다.
//
// ★전부 결정론 계산 — AI 호출 없음. SajuResult(만세력)만 있으면 클라에서 완결.★
import type { SajuResult } from "./calculator";
import { computeYongsin, type YongsinResult, type BodyStrength } from "./yongsin";
import { computeGyeokguk, type GyeokgukResult, type Element } from "./gyeokguk";
import { computeJohu, type JohuResult } from "./johu";
import { branchMeta } from "./seasonClock";

export type { Element } from "./gyeokguk";

export const ELEMENTS: Element[] = ["목", "화", "토", "금", "수"];

/** 오행별 일상어 메타 — 이모지·한글 이름·한 줄 결·CSS 색 변수. */
export const ELEMENT_META: Record<Element, { emoji: string; label: string; gist: string; cssVar: string }> = {
  목: { emoji: "🌳", label: "나무", gist: "뻗어나가는 성장·기획", cssVar: "--el-wood" },
  화: { emoji: "🔥", label: "불", gist: "빛나는 표현·열정", cssVar: "--el-fire" },
  토: { emoji: "⛰️", label: "흙", gist: "든든한 안정·중심", cssVar: "--el-earth" },
  금: { emoji: "⚔️", label: "쇠", gist: "다듬는 결단·규율", cssVar: "--el-metal" },
  수: { emoji: "💧", label: "물", gist: "흐르는 지혜·유연", cssVar: "--el-water" },
};

/** 생애 흐름 한 칸의 판정. */
export type Verdict = "용신" | "도움" | "중립" | "기신";

export type FlowCell = {
  kind: "대운" | "세운";
  /** 큰 라벨 — "31세" 또는 "2028" */
  label: string;
  /** 시작 연도 — 대운은 그 대운이 시작하는 해, 세운은 그 해. */
  year: number;
  /** 간지 한글 — "무신" */
  ganzhi: string;
  /** 대표 기운(천간 오행) */
  element: Element;
  /** 지지 오행 */
  branchElement: Element;
  /** 지지 계절 풀이 — "선선해진 초가을" */
  season: string;
  verdict: Verdict;
  /** 지금 지나는 칸인지 */
  isNow: boolean;
  /** 대운 전용 — 이 칸이 시작/끝나는 만 나이. 끝 = 다음 대운 시작(마지막 칸은 +10 근사). 연대기 막대의 폭 계산용. */
  ageStart?: number;
  ageEnd?: number;
  /** 대운 전용 — 이 칸이 끝나는 연도(다음 대운 시작 해). */
  yearEnd?: number;
};

export type YongsinView = {
  ilgan: { emoji: string; ko: string; metaphor: string; element: Element };
  body: BodyStrength;
  eokbu: YongsinResult;
  gyeokguk: GyeokgukResult;
  johu: JohuResult;
  /** 오행별 득표 — 세 방법 중 몇 개가 '용신'으로 꼽았나(+억부 기신 표시). */
  tally: Record<Element, { yong: number; gi: boolean }>;
  /** 두 방법 이상이 겹친 '종합 용신'. */
  primaryYong: Element[];
  /** 한 방법이라도 도움으로 꼽은 오행(종합 용신 제외). */
  helperYong: Element[];
  /** 억부가 과부하로 본 기신. */
  gisin: Element[];
  flow: FlowCell[];
  /** 지금 만 나이 — 연대기 막대의 '지금' 바늘 위치용(없으면 바늘 생략). */
  currentAge?: number;
};

const STEM_META_MIN: Record<string, { emoji: string; metaphor: string }> = {
  甲: { emoji: "🌳", metaphor: "우직한 거목" },
  乙: { emoji: "🌿", metaphor: "부드러운 풀잎과 덩굴" },
  丙: { emoji: "☀️", metaphor: "한낮을 비추는 빛" },
  丁: { emoji: "🕯️", metaphor: "따뜻한 촛불" },
  戊: { emoji: "⛰️", metaphor: "묵직한 너른 대지" },
  己: { emoji: "🌾", metaphor: "포근한 흙과 논" },
  庚: { emoji: "⚒️", metaphor: "단단한 강철" },
  辛: { emoji: "💎", metaphor: "다듬어진 금속" },
  壬: { emoji: "🌊", metaphor: "넓은 바다와 큰 강" },
  癸: { emoji: "💧", metaphor: "맑은 빗물·시냇물" },
};

// 60갑자 — 연도 → 간지. (year - 4)를 10/12로 나눈 나머지. 서기 4년 = 갑자.
// 세운은 입춘 기준이지만, 달력 해 단위 흐름 개관에는 해당 연도의 간지로 충분하다.
const GAN_KO_ORDER = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const GAN_EL_ORDER: Element[] = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const ZHI_KO_ORDER = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const ZHI_HANJA_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZHI_EL_ORDER: Element[] = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

function yearGanZhi(year: number) {
  const gi = ((year - 4) % 10 + 10) % 10;
  const zi = ((year - 4) % 12 + 12) % 12;
  return {
    ganKo: GAN_KO_ORDER[gi],
    ganEl: GAN_EL_ORDER[gi],
    zhiKo: ZHI_KO_ORDER[zi],
    zhiHanja: ZHI_HANJA_ORDER[zi],
    zhiEl: ZHI_EL_ORDER[zi],
  };
}

/** 오행 한 칸의 판정. 종합 용신 > 억부 기신 > 보조 용신 > 중립 순으로 본다. */
function verdictFor(el: Element, primary: Element[], helper: Element[], gisin: Element[]): Verdict {
  if (primary.includes(el)) return "용신";
  if (gisin.includes(el)) return "기신";
  if (helper.includes(el)) return "도움";
  return "중립";
}

export function buildYongsinView(
  saju: SajuResult,
  currentAge: number | undefined,
  currentYear: number,
): YongsinView {
  const eokbu = computeYongsin(saju);
  const gyeokguk = computeGyeokguk(saju, eokbu.body);
  const johu = computeJohu(saju);

  const ilganHanja = saju.dayMaster.hanja;
  const sm = STEM_META_MIN[ilganHanja] ?? { emoji: "✨", metaphor: "" };

  // 세 방법의 용신 집합. 격국 상신·억부 용신·조후용신.
  const methodSets: Element[][] = [gyeokguk.sangsin, eokbu.yongsin, johu.johu];
  const tally: Record<Element, { yong: number; gi: boolean }> = {
    목: { yong: 0, gi: false }, 화: { yong: 0, gi: false }, 토: { yong: 0, gi: false },
    금: { yong: 0, gi: false }, 수: { yong: 0, gi: false },
  };
  for (const set of methodSets) {
    // 한 방법 안에서 중복 오행은 1표로만 센다.
    for (const el of new Set(set)) tally[el].yong += 1;
  }
  for (const el of eokbu.gisin) tally[el].gi = true;

  const primaryYong = ELEMENTS.filter((e) => tally[e].yong >= 2);
  const helperYong = ELEMENTS.filter((e) => tally[e].yong === 1 && !primaryYong.includes(e));
  // 기신은 종합 용신과 겹치면(방법 간 상충) 용신 쪽을 우선해 기신에서 뺀다.
  const gisin = eokbu.gisin.filter((e) => !primaryYong.includes(e) && !helperYong.includes(e));

  const flow: FlowCell[] = [];

  // 대운 — 10년 단위. calculator가 만든 순서(startAge 오름차순)를 그대로 쓴다.
  const dae = saju.daewoon ?? [];
  dae.forEach((d, i) => {
    // isNow 판정용 상한은 Infinity(마지막 칸 열림)지만, 막대 폭은 유한한 근사(+10)로 그린다.
    const nextAgeOpen = dae[i + 1]?.startAge ?? Infinity;
    const ageEnd = dae[i + 1]?.startAge ?? d.startAge + 10;
    const yearEnd = dae[i + 1]?.startYear ?? d.startYear + 10;
    const el = d.gan.wuxing as Element;
    flow.push({
      kind: "대운",
      label: `${d.startAge}세`,
      year: d.startYear,
      ganzhi: `${d.gan.ko}${d.zhi.ko}`,
      element: el,
      branchElement: d.zhi.wuxing as Element,
      season: branchMeta(d.zhi.hanja).phrase,
      verdict: verdictFor(el, primaryYong, helperYong, gisin),
      isNow: currentAge != null && d.startAge <= currentAge && currentAge < nextAgeOpen,
      ageStart: d.startAge,
      ageEnd,
      yearEnd,
    });
  });

  // 세운 — 올해부터 10년.
  for (let y = currentYear; y < currentYear + 10; y++) {
    const gz = yearGanZhi(y);
    flow.push({
      kind: "세운",
      label: `${y}`,
      year: y,
      ganzhi: `${gz.ganKo}${gz.zhiKo}`,
      element: gz.ganEl,
      branchElement: gz.zhiEl,
      season: branchMeta(gz.zhiHanja).phrase,
      verdict: verdictFor(gz.ganEl, primaryYong, helperYong, gisin),
      isNow: y === currentYear,
    });
  }

  return {
    ilgan: { emoji: sm.emoji, ko: saju.dayMaster.ko, metaphor: sm.metaphor, element: saju.dayMaster.wuxing as Element },
    body: eokbu.body,
    eokbu,
    gyeokguk,
    johu,
    tally,
    primaryYong,
    helperYong,
    gisin,
    flow,
    currentAge,
  };
}

const VERDICT_KO: Record<Verdict, string> = {
  용신: "좋음(순풍)",
  도움: "무난",
  중립: "보통",
  기신: "버거움(역풍)",
};

/**
 * LLM 용신 풀이 프롬프트에 주입할 내부 근거 텍스트.
 * ★결정론 계산값을 사실로 주입 — LLM은 계산하지 말고 이걸 해석만★.
 * 유파 갈림·'운명 등급 아님' 라벨을 포함한다.
 */
export function formatYongsinReadingForPrompt(view: YongsinView): string {
  const { ilgan, body, gyeokguk, eokbu, johu, primaryYong, helperYong, gisin, flow } = view;
  const els = (arr: Element[]) => (arr.length ? arr.join("·") : "—");
  const kigi = (el: Element) => `${ELEMENT_META[el].emoji} ${ELEMENT_META[el].label} 기운`;

  const dae = flow.filter((c) => c.kind === "대운");
  const seun = flow.filter((c) => c.kind === "세운");
  const nowYear = seun.find((c) => c.isNow)?.year ?? seun[0]?.year ?? 0;
  // '다가오는' 창은 지금 지나는 칸 + 앞으로만 (이미 지난 대운은 뺀다).
  const upcoming = (c: FlowCell) => c.isNow || c.year >= nowYear;
  const whenLabel = (c: FlowCell) =>
    c.kind === "대운" ? `${c.label}부터 대운(${c.year}년~)` : `${c.year}년 세운`;

  // 대운 — 한 칸당 한 줄. 지나간 칸엔 '지남' 표시(미래 순풍과 헷갈리지 않게).
  const daeLines = dae.length
    ? dae.map((c) => {
        const tag = c.isNow ? " ←지금 지나는 대운" : c.year < nowYear ? " (이미 지남)" : "";
        return `  - ${c.label}부터(${c.year}년~): ${kigi(c.element)} · ${c.season}${tag} → ${VERDICT_KO[c.verdict]}`;
      })
    : ["  - 정보 없음"];

  // 세운 — 올해부터 10년, 해마다.
  const seunLines = seun.length
    ? seun.map((c) => `  - ${c.year}년${c.isNow ? "(지금)" : ""}: ${kigi(c.element)} → ${VERDICT_KO[c.verdict]}`)
    : ["  - 정보 없음"];

  // 다가오는 '보약 기운' 창 — 순풍(용신)·무난(도움) 판정 중 지금+앞으로만 오행별로 묶어, '기다렸다 밀 시기'를 또렷이.
  const goodByEl = new Map<Element, string[]>();
  for (const c of flow) {
    if ((c.verdict !== "용신" && c.verdict !== "도움") || !upcoming(c)) continue;
    const arr = goodByEl.get(c.element) ?? [];
    arr.push(whenLabel(c));
    goodByEl.set(c.element, arr);
  }
  const windowLines = goodByEl.size
    ? [...goodByEl.entries()].map(([el, when]) => `  - ${kigi(el)}: ${when.join(", ")}`)
    : ["  - 앞으로 10년(세운)·대운에 뚜렷한 순풍 칸이 적음 — 지금 가진 기운을 잘 쓰는 쪽으로 방향 잡기"];

  // 과부하 기운이 들어오는 역풍 시기 — 지금+앞으로만, 힘 빼고 정리할 구간.
  const badWindows = flow.filter((c) => c.verdict === "기신" && upcoming(c)).map(whenLabel);

  return [
    `[용신 — 코드로 계산된 내부 근거. ★유파에 따라 갈릴 수 있는 추정이며 '운명 등급'이 아님★]`,
    `본질(일간): ${ilgan.ko} ${ilgan.emoji} (${ilgan.metaphor}) · 대표 오행 ${ilgan.element} · 세기 ${body}`,
    `기준: 지금 만 ${view.flow.find((c) => c.isNow && c.kind === "세운")?.year ?? ""}년 · ${dae.find((c) => c.isNow)?.label ?? "?"} 대운 지나는 중`,
    ``,
    `── 3가지 용신(보약 기운을 잡는 세 관점) ──`,
    `■ 격국(타고난 그릇/틀): ${gyeokguk.name} — "${gyeokguk.title}"`,
    `  · 그릇 설명: ${gyeokguk.description}`,
    `  · 판정 근거: ${gyeokguk.basis}`,
    `  · 상신 = 이 그릇을 완성시키는 보약 기운: ${els(gyeokguk.sangsin)} — ${gyeokguk.sangsinReason}`,
    ``,
    `■ 억부(세기 균형): ${body}`,
    `  · 보약(용신) 기운: ${els(eokbu.yongsin)} / 과부하(기신) 기운: ${els(eokbu.gisin)}`,
    `  · 근거: ${eokbu.reasoning}`,
    ``,
    `■ 조후(온도 균형): ${johu.season} · ${johu.hanYeolLabel} · 시급도 [${johu.urgency}]`,
    `  · 온도를 맞추는 보약 기운: ${els(johu.johu)}`,
    `  · ${johu.reason}`,
    ``,
    `■ 종합(세 방법 교차):`,
    `  · '보약 기운'(둘 이상 방법이 겹침, 제일 확실) = ${els(primaryYong)}`,
    `  · '보조 보약 기운'(한 방법만) = ${els(helperYong)}`,
    `  · '과부하 기운'(기신) = ${els(gisin)}`,
    ``,
    `── 언제 어떤 기운이 들어오나 (★이 리포트의 핵심 — 아래 흐름을 미래지향으로 풀어라★) ──`,
    `【대운 · 10년 단위】`,
    ...daeLines,
    ``,
    `【세운 · 해마다(올해부터 10년)】`,
    ...seunLines,
    ``,
    `■ 다가오는 '보약 기운' 창 — 기다렸다 밀어붙일 시기(순풍·무난 칸만 추림, 오행별):`,
    ...windowLines,
    ``,
    `■ 과부하(기신) 기운 들어오는 역풍 시기 — 힘 빼고 정리할 구간: ${badWindows.length ? badWindows.join(", ") : "앞 10년/대운엔 뚜렷한 역풍 칸 적음"}`,
  ].join("\n");
}
