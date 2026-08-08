// 용신 보기 화면의 뷰 모델 — 격국·억부·조후 세 방법을 한자리에 모으고,
// 세 방법이 겹치는 오행을 '종합 용신'으로 뽑은 뒤, 대운·세운 생애 흐름에
// 좋은 시기/버거운 시기를 색칠할 재료까지 만든다.
//
// ★전부 결정론 계산 — AI 호출 없음. SajuResult(만세력)만 있으면 클라에서 완결.★
import { Solar } from "lunar-javascript";
import type { SajuResult } from "./calculator";
import { computeYongsin, type YongsinResult, type BodyStrength } from "./yongsin";
import { computeGyeokguk, type GyeokgukResult, type Element } from "./gyeokguk";
import { computeJohu, type JohuResult } from "./johu";
import { branchMeta } from "./seasonClock";
import { GAN_KO, ZHI_KO, GAN_TO_WUXING, ZHI_TO_WUXING, WUXING_KO, GAN_YINYANG, ZHI_YINYANG } from "./readings";

export type { Element } from "./gyeokguk";

export const ELEMENTS: Element[] = ["목", "화", "토", "금", "수"];

/**
 * 오행별 일상어 메타 — 이모지·한글 이름·한 줄 결·CSS 색 변수·구슬 그림.
 *
 * `orb`은 ★히어로의 계절 구슬과 같은 유리알★을 오행 색으로 물들여 구운 256px 투명 PNG.
 * 구슬 원본은 계절 4종뿐이라 오행 5종(특히 토)이 없어서, 봄 구슬 한 장을 밑그림으로
 * 색상만 바꿔 다섯 개를 만들었다 — 광택·구름결·테두리는 원본 그대로라 히어로와 같은 재질로 보인다.
 */
export const ELEMENT_META: Record<Element, { emoji: string; label: string; hanja: string; gist: string; cssVar: string; orb: string }> = {
  목: { emoji: "🌳", label: "나무", hanja: "木", gist: "뻗어나가는 성장·기획", cssVar: "--el-wood", orb: "/hero-art/orbs/element-orb-wood-v1.png" },
  화: { emoji: "🔥", label: "불", hanja: "火", gist: "빛나는 표현·열정", cssVar: "--el-fire", orb: "/hero-art/orbs/element-orb-fire-v1.png" },
  토: { emoji: "⛰️", label: "흙", hanja: "土", gist: "든든한 안정·중심", cssVar: "--el-earth", orb: "/hero-art/orbs/element-orb-earth-v1.png" },
  금: { emoji: "⚔️", label: "쇠", hanja: "金", gist: "다듬는 결단·규율", cssVar: "--el-metal", orb: "/hero-art/orbs/element-orb-metal-v1.png" },
  수: { emoji: "💧", label: "물", hanja: "水", gist: "흐르는 지혜·유연", cssVar: "--el-water", orb: "/hero-art/orbs/element-orb-water-v1.png" },
};

/**
 * 오행별 '몸에서 먼저 티 나는 곳'과 ★건강검진에서 그냥 넘기지 말 칸★.
 *
 * ★이 표의 목적은 진단이 아니라 관심 유도다.★ 사주가 장부를 진단할 수는 없다.
 * 다만 사람들은 어차피 회사·국가 검진을 받고, 결과지의 대부분을 안 보고 넘긴다.
 * "너는 이 칸만은 보고 넘겨" 한 줄이 리포트에서 유일하게 행동으로 떨어지는 건강 조언이라
 * 오행에 대응하는 ★표준 검진 항목만★ 고정 문구로 적어둔다 — 해서 손해 볼 항목이 없는 것들이다.
 *
 * ★AI가 고르지 않는다.★ 항목을 모델이 지어내기 시작하면 병명 단정으로 번지므로,
 * 프롬프트에는 여기 값만 주입하고 "주입된 것 외 금지"를 명시한다(defaults.ts 6번 [건강운]).
 * `system`은 한의 용어(간·담, 비위) 대신 일반인이 아는 계통어로 쓴다.
 */
export const ELEMENT_BODY: Record<Element, { system: string; checks: string }> = {
  목: { system: "해독·눈", checks: "간수치(AST·ALT), 시력" },
  화: { system: "심장·혈압", checks: "혈압, 콜레스테롤, 심전도" },
  토: { system: "소화·위장", checks: "위내시경, 공복혈당" },
  금: { system: "호흡·피부", checks: "흉부 X-ray, 폐기능" },
  수: { system: "신장·호르몬", checks: "신장수치(크레아티닌), 갑상선" },
};

/** 생애 흐름 한 칸의 판정. */
export type Verdict = "용신" | "도움" | "중립" | "기신";

export type FlowCell = {
  kind: "대운" | "세운" | "월운";
  /** 큰 라벨 — "31세" 또는 "2028" */
  label: string;
  /** 시작 연도 — 대운은 그 대운이 시작하는 해, 세운은 그 해. */
  year: number;
  /** 간지 한글 — "무신" */
  ganzhi: string;
  /** 천간 한자 — "戊". 만세력 카드 표기용. */
  ganHanja: string;
  /** 지지 한자 — "申". 만세력 카드 표기용. */
  zhiHanja: string;
  ganYinYang: "양" | "음";
  zhiYinYang: "양" | "음";
  /** 대표 기운(천간 오행) */
  element: Element;
  /** 지지 오행 */
  branchElement: Element;
  /** 지지 오행까지 따로 본 판정 — 한 칸 안에 순풍/역풍이 섞이는지 표시할 때 쓴다. */
  branchVerdict: Verdict;
  /** 지지 계절 풀이 — "선선해진 초가을" */
  season: string;
  verdict: Verdict;
  /** 지금 지나는 칸인지 */
  isNow: boolean;
  /** 대운 전용 — 이 칸이 시작하는 만 나이. 연대기 리본의 축 위치에 쓴다. */
  startAge?: number;
  /** 대운 전용 — 이 칸이 끝나는(다음 대운 시작) 만 나이. */
  endAge?: number;
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
  /** 사주 여덟 글자의 오행 개수 — 0개인(원래 얇은) 기운을 짚을 때 쓴다. */
  wuxingCount: Record<Element, number>;
  /** 지금 만 나이 — 연대기 리본의 '지금' 마커 위치. 태어난 시각이 없으면 undefined. */
  currentAge?: number;
};

/**
 * 현재 대운이 종합 용신과 직접 맞물렸는지 판별한다.
 *
 * 보조 용신(\"도움\")은 대운을 탈 준비가 되는 배경으로는 보되, 리포트의
 * \"지금 순풍을 탄다\"라는 강한 표현은 두 관점 이상이 겹친 종합 용신에만 쓴다.
 */
export type CurrentDayunStrategy = {
  mode: "synergy" | "prepare";
  current: FlowCell | null;
  matched: Element[];
  mixed: boolean;
};

export function getCurrentDayunStrategy(view: YongsinView): CurrentDayunStrategy {
  const current = view.flow.find((cell) => cell.kind === "대운" && cell.isNow) ?? null;
  if (!current) return { mode: "prepare", current: null, matched: [], mixed: false };

  const matched = [...new Set([current.element, current.branchElement])].filter((el) =>
    view.primaryYong.includes(el),
  );
  const hasGisin = [current.element, current.branchElement].some((el) => view.gisin.includes(el));

  return {
    mode: matched.length ? "synergy" : "prepare",
    current,
    matched,
    mixed: matched.length > 0 && hasGisin,
  };
}

/**
 * 용신 리포트의 실행 섹션을 현재 대운 상태에 맞춰 갈라 주는 프롬프트 지시문.
 * 순풍 대운에는 \"기운을 끌어오는 법\"을 강요하지 않고, 이미 열린 판을
 * 집중·연결·반복으로 실제 성과에 번역하는 구성으로 전환한다.
 */
export function formatCurrentDayunStrategyForPrompt(view: YongsinView): string {
  const strategy = getCurrentDayunStrategy(view);

  if (strategy.mode === "synergy" && strategy.current) {
    const current = strategy.current;
    const matched = strategy.matched.map((el) => `${ELEMENT_META[el].label} 기운`).join("·");
    const timing = `${current.label}부터 대운(${current.year}년~)`;
    const brake = strategy.mixed
      ? "현재 대운 안에 과부하 기운도 함께 있어. 확장은 하되 무리하게 여러 판을 동시에 벌이지 않는 안전장치를 한 항목으로 꼭 넣어."
      : "현재 대운은 순풍 쪽이므로, 겁주기보다 선택과 반복의 밀도를 높이는 방향으로 쓴다.";

    return `【현재 대운에 맞춘 실행 섹션 — 순풍 시너지형】
코드 판정상 지금은 ${timing}이고, ${matched}이 종합 용신과 직접 맞물려 있다. 이미 대운을 타고 있으니 "때 안 기다리고 끌어오는 법", 색·소품·액세서리 처방, 먼 미래를 위한 예행연습을 이 섹션의 중심으로 쓰지 마라.

반드시 아래 제목과 순서로 새 섹션을 구성해.
▣ 지금 탄 대운, 이렇게 시너지를 키워
● 지금 열린 판: 현재 대운이 정확히 어느 보약 기운과 맞물렸는지 나이·연도로 한 번만 짚고, 이 시기에 특히 힘이 실릴 한두 영역을 그 기운의 십성 역할에 맞춰 구체 장면으로 말해. 전방위 만능 호재처럼 부풀리면 안 돼.
● 한 축에 몰기: 그 기운의 십성 역할에 맞는 90일짜리 목표 하나를 제안해. "무엇을/어디까지/어떤 결과물 또는 기준으로"가 보이게 쓰고, 새 일을 여러 개 벌이는 처방은 금지야.
● 사람과 자원 연결: 이 시기에 붙여야 할 사람·팀·제도·채널을 한 가지로 좁히고, 실제 첫 접점(예: 제안할 자리, 참여할 프로젝트, 정리할 문서)을 적어. 인성은 스승·문서·시스템, 비겁은 동료·협업, 식상은 발표·산출, 관성은 역할·규율, 재성은 고객·예산·운영이라는 역할을 섞지 마.
● 반복으로 굳히기: 주간 또는 월간 리듬 하나와 확인 지표 하나를 준다. 기운이 좋다는 말만 하지 말고, 이 시기를 지나도 남을 습관·관계·포트폴리오·운영 장치 중 하나로 번역해.
● 과열 방지선: ${brake} 실패했을 때의 불안 조장이 아니라, "이 신호가 보이면 범위를 줄여라"처럼 현실적인 중단 기준 하나를 준다.

이 섹션은 보약 기운 하나당 사람·색·소품을 나열하는 처방전이 아니라, 지금의 순풍을 성과와 기반으로 남기는 실행 설계여야 해.`;
  }

  return `【현재 대운에 맞춘 실행 섹션 — 선행 준비형】
코드 판정상 현재 대운은 종합 용신과 직접 맞물린 순풍 구간이 아니다. 이때는 대운을 기다리기만 하라는 말 대신, 다음 순풍이 왔을 때 바로 탈 수 있도록 지금 환경과 행동을 설계해 주는 게 핵심이야.

반드시 아래 제목과 순서로 섹션을 구성해.
▣ 다음 순풍을 앞당겨 준비하는 법
● 먼저 만들 판: 보약 기운 하나당 그 기운의 십성 역할에 맞는 작은 프로젝트 또는 역할 하나를 제안해. "이번 달에 시작할 한 가지"와 첫 결과물이 보이게 써.
● 사람과 환경 붙이기: 그 기운에 맞는 사람 유형·채널·공간 또는 시스템을 하나로 좁히고, 이번 주에 밟을 첫 접점을 적어. 색·소품·액세서리 나열은 하지 마.
● 반복 연습: 주간 리듬 하나와 남길 기록 또는 산출물 하나를 준다. 순풍이 오면 새로 시작하는 게 아니라, 이미 해 오던 일을 더 크게 밀 수 있게 만드는 방향이어야 해.
● 미리 정리할 것: 과부하 기운이 튀어나올 때 줄일 일 하나와 경계선 하나를 준다. 겁주지 말고 "이만큼만 지키면 된다"는 톤으로.

각 레버는 반드시 그 기운의 십성 역할대로 써. 인성은 배움·자격·문서·스승·시스템, 비겁은 동료·자립·협업, 식상은 표현·창작·산출, 관성은 책임·규율·자리, 재성은 고객·돈·성과·관리 쪽으로 연결하고 서로 섞지 마.`;
}

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
const GAN_HANJA_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const GAN_EL_ORDER: Element[] = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const ZHI_KO_ORDER = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const ZHI_HANJA_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZHI_EL_ORDER: Element[] = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

function yearGanZhi(year: number) {
  const gi = ((year - 4) % 10 + 10) % 10;
  const zi = ((year - 4) % 12 + 12) % 12;
  return {
    ganKo: GAN_KO_ORDER[gi],
    ganHanja: GAN_HANJA_ORDER[gi],
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

  // 대운 — 10년 단위. ★calculator(lunar-javascript)의 startAge는 세는나이(虚岁)라, 화면·근거가 쓰는
  // 만 나이(currentAge)와 1~2년 어긋난다. currentAge 앵커(currentAge + (연도 - currentYear))로
  // 만 나이로 정규화해, 같은 연도에 대운·세운·현재 나이가 어긋나지 않게 한다.★
  const dae = saju.daewoon ?? [];
  const manAgeAt = (year: number): number | null =>
    currentAge != null ? currentAge + (year - currentYear) : null;
  dae.forEach((d, i) => {
    const nextStartYear = dae[i + 1]?.startYear;
    const start = manAgeAt(d.startYear) ?? d.startAge;
    const end =
      nextStartYear != null
        ? (manAgeAt(nextStartYear) ?? start + (nextStartYear - d.startYear))
        : start + 10;
    const el = d.gan.wuxing as Element;
    const branchElement = d.zhi.wuxing as Element;
    flow.push({
      kind: "대운",
      label: `${start}세`,
      year: d.startYear,
      ganzhi: `${d.gan.ko}${d.zhi.ko}`,
      ganHanja: d.gan.hanja,
      zhiHanja: d.zhi.hanja,
      ganYinYang: d.gan.yinyang,
      zhiYinYang: d.zhi.yinyang,
      element: el,
      branchElement,
      branchVerdict: verdictFor(branchElement, primaryYong, helperYong, gisin),
      season: branchMeta(d.zhi.hanja).phrase,
      verdict: verdictFor(el, primaryYong, helperYong, gisin),
      isNow: currentAge != null && start <= currentAge && currentAge < end,
      startAge: start,
      endAge: end,
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
      ganHanja: gz.ganHanja,
      zhiHanja: gz.zhiHanja,
      ganYinYang: GAN_YINYANG[gz.ganHanja] ?? "양",
      zhiYinYang: ZHI_YINYANG[gz.zhiHanja] ?? "양",
      element: gz.ganEl,
      branchElement: gz.zhiEl,
      branchVerdict: verdictFor(gz.zhiEl, primaryYong, helperYong, gisin),
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
    wuxingCount: saju.wuxingCount,
    currentAge,
  };
}

/**
 * 특정 해의 월운(12개월) — 세운 칸을 펼쳤을 때 '그 해 몇 월에 이 기운이 드나'를 보여주는 용도.
 * 월주는 그 해·그 달의 절기로만 정해져 원국(saju)과 무관하다 — cautionMonths.ts의 monthZhiOf와 동일 계산.
 * goodEls/badEls는 이 화면(격국·억부·조후 카드)이 각자 꼽은 기운으로, 호출부에서 그때그때 넘긴다.
 */
export function computeMonthFlow(year: number, goodEls: Element[], badEls: Element[] = []): FlowCell[] {
  const months: FlowCell[] = [];
  for (let m = 1; m <= 12; m++) {
    const pillar = Solar.fromYmdHms(year, m, 15, 12, 0, 0).getLunar().getEightChar().getMonth();
    const ganHanja = pillar[0];
    const zhiHanja = pillar[1];
    const element = (WUXING_KO[GAN_TO_WUXING[ganHanja]] ?? "토") as Element;
    const branchElement = (WUXING_KO[ZHI_TO_WUXING[zhiHanja]] ?? "토") as Element;
    months.push({
      kind: "월운",
      label: `${m}월`,
      year,
      ganzhi: `${GAN_KO[ganHanja] ?? ganHanja}${ZHI_KO[zhiHanja] ?? zhiHanja}`,
      ganHanja,
      zhiHanja,
      ganYinYang: GAN_YINYANG[ganHanja] ?? "양",
      zhiYinYang: ZHI_YINYANG[zhiHanja] ?? "양",
      element,
      branchElement,
      branchVerdict: verdictFor(branchElement, goodEls, [], badEls),
      season: branchMeta(zhiHanja).phrase,
      verdict: verdictFor(element, goodEls, [], badEls),
      isNow: false,
    });
  }
  return months;
}

const VERDICT_KO: Record<Verdict, string> = {
  용신: "좋음(순풍)",
  도움: "무난",
  중립: "보통",
  기신: "버거움(역풍)",
};

// 오행 상생·상극. 일간 오행 기준으로 보약 기운의 십성 역할을 잡아, 개운 레버가 엉뚱한 십성으로 새지 않게 한다.
const OHENG_SHENG: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const OHENG_KE: Record<Element, Element> = { 목: "토", 화: "금", 토: "수", 금: "목", 수: "화" };
/** 일간 오행 기준, 대상 오행의 십성 역할(일상어). 배움·자격=인성, 동료·자립=비겁 식으로 개운 방향을 못 박는다. */
function sipsinRole(day: Element, x: Element): string {
  if (x === day) return "비겁(동료·자립·확장 — 어깨 나란히 할 사람·팀·나를 밀어주는 또래)";
  if (OHENG_SHENG[x] === day) return "인성(배움·자격·문서·후원·스승 — 나를 받쳐 키우는 것)";
  if (OHENG_SHENG[day] === x) return "식상(표현·창작·산출 — 내가 내보내는 것)";
  if (OHENG_KE[x] === day) return "관성(책임·규율·자리 — 나를 다잡는 것)";
  return "재성(돈·성과·관리 — 내가 다루는 것)";
}

/**
 * LLM 용신 풀이 프롬프트에 주입할 내부 근거 텍스트.
 * ★결정론 계산값을 사실로 주입 — LLM은 계산하지 말고 이걸 해석만★.
 * 유파 갈림·'운명 등급 아님' 라벨을 포함한다.
 */
export function formatYongsinReadingForPrompt(view: YongsinView): string {
  const { ilgan, body, gyeokguk, eokbu, johu, primaryYong, helperYong, gisin, flow } = view;
  const els = (arr: Element[]) => (arr.length ? arr.join("·") : "—");
  const kigi = (el: Element) => `${ELEMENT_META[el].label} 기운`;
  const hasGood = (c: FlowCell) => c.verdict === "용신" || c.verdict === "도움" || c.branchVerdict === "용신" || c.branchVerdict === "도움";
  const hasBad = (c: FlowCell) => c.verdict === "기신" || c.branchVerdict === "기신";
  const isMixed = (c: FlowCell) => hasGood(c) && hasBad(c);
  const flowKigi = (c: FlowCell) =>
    c.element === c.branchElement ? kigi(c.element) : `${kigi(c.element)}(천간) + ${kigi(c.branchElement)}(지지)`;
  const flowVerdict = (c: FlowCell) =>
    isMixed(c)
      ? `혼재(천간 ${VERDICT_KO[c.verdict]} / 지지 ${VERDICT_KO[c.branchVerdict]})`
      : `${VERDICT_KO[c.verdict]}${c.branchVerdict !== c.verdict ? ` / 지지 ${VERDICT_KO[c.branchVerdict]}` : ""}`;

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
        return `  - ${c.label}부터(${c.year}년~): ${flowKigi(c)} · ${c.season}${tag} → ${flowVerdict(c)}`;
      })
    : ["  - 정보 없음"];

  // 세운 — 올해부터 10년, 해마다.
  const seunLines = seun.length
    ? seun.map((c) => `  - ${c.year}년${c.isNow ? "(지금)" : ""}: ${flowKigi(c)} → ${flowVerdict(c)}`)
    : ["  - 정보 없음"];

  // 다가오는 '보약 기운' 창 — 순풍(용신)·무난(도움) 판정 중 지금+앞으로만 오행별로 묶어, '기다렸다 밀 시기'를 또렷이.
  const goodByEl = new Map<Element, string[]>();
  for (const c of flow) {
    if (!hasGood(c) || !upcoming(c)) continue;
    const goodEls = new Set<Element>();
    if (c.verdict === "용신" || c.verdict === "도움") goodEls.add(c.element);
    if (c.branchVerdict === "용신" || c.branchVerdict === "도움") goodEls.add(c.branchElement);
    for (const el of goodEls) {
      const arr = goodByEl.get(el) ?? [];
      arr.push(whenLabel(c));
      goodByEl.set(el, arr);
    }
  }
  const windowLines = goodByEl.size
    ? [...goodByEl.entries()].map(([el, when]) => `  - ${kigi(el)}: ${when.join(", ")}`)
    : ["  - 앞으로 10년(세운)·대운에 뚜렷한 순풍 칸이 적음 — 지금 가진 기운을 잘 쓰는 쪽으로 방향 잡기"];

  // 과부하 기운이 들어오는 역풍 시기 — 지금+앞으로만, 힘 빼고 정리할 구간.
  const badWindows = flow.filter((c) => hasBad(c) && upcoming(c)).map(whenLabel);
  const mixedWindows = flow.filter((c) => isMixed(c) && upcoming(c)).map(whenLabel);

  return [
    `[용신 — 코드로 계산된 내부 근거. ★유파에 따라 갈릴 수 있는 추정이며 '운명 등급'이 아님★]`,
    `본질(일간): ${ilgan.ko} (${ilgan.metaphor}) · 대표 오행 ${ilgan.element} · 세기 ${body}`,
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
    ...(primaryYong.length + helperYong.length > 0
      ? [
          `  · 보약 기운의 십성 역할(일간 ${ilgan.element} 기준 — ★개운 레버를 이 역할대로 배치하고 섞지 말 것★):`,
          ...[...primaryYong, ...helperYong].map(
            (e) => `      · ${ELEMENT_META[e].label} 기운 = ${sipsinRole(ilgan.element, e)}`,
          ),
        ]
      : []),
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
    `■ 보약과 과부하가 같이 들어오는 혼재 시기 — 밀되 무리수를 줄일 구간: ${mixedWindows.length ? mixedWindows.join(", ") : "앞 10년/대운엔 뚜렷한 혼재 칸 적음"}`,
  ].join("\n");
}

/**
 * 개인 사주 리포트 프롬프트에 주입할 '배경 렌즈'용 압축 근거.
 *
 * 용신 풀이용(formatYongsinReadingForPrompt)과 달리 대운·세운 표를 통째로 싣지 않는다 —
 * 개인 리포트엔 [시기 9구간] 표(format.ts의 formatDayunForPrompt)가 따로 주입되므로,
 * 여기서는 ★그 표에 없는 것(구간별 순풍/역풍 판정)만★ 얹어 lifeline 9구간의 근거로 쓰게 한다.
 *
 * ★나이를 싣지 않는 이유★: 이 뷰의 대운 나이는 만 나이로 정규화돼 있고 [시기 9구간] 표는
 * 계산기 원본(세는나이)이라 서로 1~2년 어긋난다. 나이를 같이 주면 모델이 상충하는 숫자를
 * 받으므로, 표와 같은 순서의 '몇 번째 칸'으로만 대응시킨다.
 */
export function formatYongsinBasisForPrompt(view: YongsinView): string {
  const { ilgan, body, eokbu, johu, primaryYong, helperYong, gisin, flow } = view;
  const kigi = (el: Element) => `${ELEMENT_META[el].label} 기운`;
  const els = (arr: Element[]) => (arr.length ? arr.map(kigi).join("·") : "—");
  const hasGood = (c: FlowCell) =>
    c.verdict === "용신" || c.verdict === "도움" || c.branchVerdict === "용신" || c.branchVerdict === "도움";
  const hasBad = (c: FlowCell) => c.verdict === "기신" || c.branchVerdict === "기신";
  const tone = (c: FlowCell) =>
    hasGood(c) && hasBad(c)
      ? "혼재 — 밀되 무리수는 줄일 구간"
      : hasGood(c)
        ? "순풍 — 밀어붙일 구간"
        : hasBad(c)
          ? "역풍 — 힘 빼고 정리할 구간"
          : "보통 — 큰 변수 적은 구간";

  const dae = flow.filter((c) => c.kind === "대운");
  const daeLines = dae.length
    ? dae.map((c, i) => {
        const gi =
          c.element === c.branchElement ? kigi(c.element) : `${kigi(c.element)} + ${kigi(c.branchElement)}`;
        return `  ${i + 1}번째 칸: ${gi} 들어옴 → ${tone(c)}${c.isNow ? "  ←지금 지나는 구간" : ""}`;
      })
    : ["  - 대운 계산 불가(출생 시각 미입력 등)"];

  // 헤더는 주입되는 프롬프트 쪽 블록(═══ [용신 …] ═══)이 이미 달고 있으므로 여기선 붙이지 않는다.
  const lines = [
    `세기(억부): ${body} — ${eokbu.reasoning}`,
    ``,
    `■ 보약 기운(세 관점 중 둘 이상이 겹침 — 제일 확실): ${els(primaryYong)}`,
    `■ 보조 보약 기운(한 관점만 꼽음): ${els(helperYong)}`,
    `■ 과부하 기운(들어오면 버거워지는 쪽): ${els(gisin)}`,
    `■ 온도(조후): ${johu.season} · ${johu.hanYeolLabel} → 맞춰줄 기운 ${els(johu.johu)}`,
  ];

  const levers = [...primaryYong, ...helperYong];
  if (levers.length) {
    lines.push(
      ``,
      `■ 보약 기운의 역할(일간 ${ilgan.element} 기준 — ★처방을 이 역할대로 배치하고 섞지 말 것★):`,
      ...levers.map((e) => `  · ${kigi(e)} = ${sipsinRole(ilgan.element, e)}`),
    );
  } else {
    lines.push(``, `■ 균형형이라 뚜렷한 보약 기운이 없음 — 한쪽으로 단정하지 말고 균형 유지 쪽으로 풀 것.`);
  }

  lines.push(
    ``,
    `■ 10년 흐름별 순풍/역풍 — ★위 [시기 9구간] 표와 같은 순서의 같은 칸이다. 나이는 그 표를 그대로 쓰고, 여기서는 판정만 가져가라.★`,
    ...daeLines,
  );

  lines.push(``, ...bodyWatchLines(view));

  return lines.join("\n");
}

/**
 * 건강운 섹션에 줄 '검진 때 그냥 넘기지 말 칸' 재료.
 *
 * 두 축으로만 뽑는다 — 둘 다 이미 결정론으로 계산된 값이라 모델이 지어낼 여지가 없다.
 *   ① 과부하(기신) 기운 → 들어오면 버거워지는 쪽. 먼저 삐걱대는 자리.
 *   ② 사주에 0개인 기운 → 원래 얇아서 오래 방치되는 자리.
 * 겹치면 하나로 합치고, 둘 다 없으면 '균형형'이라 특정 칸을 짚지 않는다(억지로 만들지 않는다).
 */
function bodyWatchLines(view: YongsinView): string[] {
  const { gisin, wuxingCount } = view;
  const empty = ELEMENTS.filter((el) => (wuxingCount[el] ?? 0) === 0);
  const picked: Array<{ el: Element; why: string }> = [];
  for (const el of gisin) {
    // 과부하이면서 개수까지 0이면 "들어오면 버거워진다"만으로는 앞뒤가 안 맞는다 — 두 이유를 같이 준다.
    picked.push({
      el,
      why: empty.includes(el)
        ? "과부하 기운인데 사주에 아예 없기까지 함 — 평소엔 잊고 살다가 들어오면 한 번에 버거워지는 자리"
        : "과부하 기운 — 들어오면 제일 먼저 버거워지는 자리",
    });
  }
  for (const el of empty) {
    if (picked.some((p) => p.el === el)) continue;
    picked.push({ el, why: "사주에 아예 없는 기운 — 원래 얇아서 오래 방치되는 자리" });
  }

  const head = [
    `■ 몸에서 먼저 티 나는 곳 / 검진 때 그냥 넘기지 말 칸 — ★[건강운] 섹션 전용 재료★`,
    `  ★아래 항목 외의 검사·병명을 지어내지 마라. 진단·단정 금지("너 간 나빠" ✗ / "간수치 칸은 보고 넘겨" ○).★`,
  ];
  if (!picked.length) {
    return [
      ...head,
      `  · 과부하 기운도 없고 빠진 기운도 없는 균형형 — ★특정 검진 항목을 억지로 짚지 마라.★`,
      `    "딱히 약한 데가 없으니 기본 검진만 제때 받으면 된다"는 쪽으로 담백하게 풀 것.`,
    ];
  }
  return [
    ...head,
    ...picked.slice(0, 2).flatMap(({ el, why }) => {
      const m = ELEMENT_BODY[el];
      return [
        `  · ${ELEMENT_META[el].label} 기운 (${why})`,
        `      → 먼저 티 나는 곳: ${m.system} / 검진에서 볼 칸: ${m.checks}`,
      ];
    }),
  ];
}
