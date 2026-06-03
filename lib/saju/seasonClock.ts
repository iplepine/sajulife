/**
 * 사주의 계절 시계 — 시각화용 데이터/지오메트리 모듈.
 *
 * 음양·한열의 2축 좌표를 시계 모양 1D 원형(봄·여름·가을·겨울)으로 변환하고,
 * 10 천간(일간)과 12 지지(대운/월지)에 한국어 메타포와 풀이 문구를 부여한다.
 *
 * LifeCircle.tsx가 렌더링을, balance.ts가 점수 계산을 담당하고,
 * 이 모듈은 둘을 잇는 "이름·위치" 데이터만 가진다.
 */

import type { DaewoonPillar } from "./calculator";

// ============================================================
// 10 천간 — 일간 메타포
// ============================================================

export type StemMeta = {
  ko: string;        // 갑목
  emoji: string;     // 🌳
  short: string;     // 큰 나무 — 시계 중앙에 표시
  metaphor: string;  // 우직한 거목 — 부제
};

export const STEM_META: Record<string, StemMeta> = {
  甲: { ko: "갑목", emoji: "🌳", short: "큰 나무", metaphor: "우직한 거목" },
  乙: { ko: "을목", emoji: "🌿", short: "화초", metaphor: "부드러운 풀잎과 덩굴" },
  丙: { ko: "병화", emoji: "☀️", short: "태양", metaphor: "한낮을 비추는 빛" },
  丁: { ko: "정화", emoji: "🕯️", short: "등불", metaphor: "따뜻한 촛불" },
  戊: { ko: "무토", emoji: "⛰️", short: "큰 산", metaphor: "묵직한 너른 대지" },
  己: { ko: "기토", emoji: "🌾", short: "들판", metaphor: "포근한 흙과 논" },
  庚: { ko: "경금", emoji: "⚒️", short: "무쇠", metaphor: "단단한 강철" },
  辛: { ko: "신금", emoji: "💎", short: "보석", metaphor: "다듬어진 금속" },
  壬: { ko: "임수", emoji: "🌊", short: "큰 강", metaphor: "넓은 바다와 큰 강" },
  癸: { ko: "계수", emoji: "💧", short: "이슬", metaphor: "맑은 빗물·시냇물" },
};

export function stemMeta(hanja: string): StemMeta {
  return STEM_META[hanja] ?? { ko: hanja, emoji: "✨", short: hanja, metaphor: "" };
}

// ============================================================
// 12 지지 — 계절·시계 위치·풀이
// ============================================================

export type Season = "봄" | "여름" | "가을" | "겨울";

export type BranchMeta = {
  ko: string;
  season: Season;
  /** 시계상 위치 인덱스. 0 = 12시(여름 정점·오), 인덱스가 커질수록 반시계방향. */
  clockIndex: number;
  /** 자연어 풀이 — 칩이나 본문에 직접 사용. */
  phrase: string;
};

export const BRANCH_META: Record<string, BranchMeta> = {
  午: { ko: "오", season: "여름", clockIndex: 0,  phrase: "한낮의 한여름" },
  未: { ko: "미", season: "여름", clockIndex: 1,  phrase: "익어가는 늦여름" },
  申: { ko: "신", season: "가을", clockIndex: 2,  phrase: "선선해진 초가을" },
  酉: { ko: "유", season: "가을", clockIndex: 3,  phrase: "단풍 든 가을" },
  戌: { ko: "술", season: "가을", clockIndex: 4,  phrase: "거두는 늦가을" },
  亥: { ko: "해", season: "겨울", clockIndex: 5,  phrase: "찬바람 부는 초겨울" },
  子: { ko: "자", season: "겨울", clockIndex: 6,  phrase: "한밤의 한겨울" },
  丑: { ko: "축", season: "겨울", clockIndex: 7,  phrase: "얼어붙은 늦겨울" },
  寅: { ko: "인", season: "봄",   clockIndex: 8,  phrase: "막 깨어나는 초봄" },
  卯: { ko: "묘", season: "봄",   clockIndex: 9,  phrase: "꽃 피는 봄" },
  辰: { ko: "진", season: "봄",   clockIndex: 10, phrase: "푸르른 늦봄" },
  巳: { ko: "사", season: "여름", clockIndex: 11, phrase: "햇살 좋은 초여름" },
};

export function branchMeta(hanja: string): BranchMeta {
  return BRANCH_META[hanja] ?? { ko: hanja, season: "봄", clockIndex: 0, phrase: hanja };
}

// ============================================================
// 좌표 변환 — 음양/한열 → 시계 위치
// ============================================================

const DEG_TO_RAD = Math.PI / 180;

/** 지지의 수학 각도(°). +x축 기준 반시계 방향. 12시=오=90°, 3시=묘=0°. */
export function branchAngleDeg(hanja: string): number {
  return 90 + branchMeta(hanja).clockIndex * 30;
}

/** 지지를 시계 위 (cx, cy) 중심, 반지름 r 원 위 좌표로. */
export function branchPosition(
  hanja: string,
  cx: number,
  cy: number,
  r: number,
): { x: number; y: number } {
  const a = branchAngleDeg(hanja) * DEG_TO_RAD;
  return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
}

/**
 * balance의 (음양, 한열) → 시계 좌표 매핑.
 *
 * 균형 평면을 45° CCW 회전해서 사사분면이 시계의 사방위(여름=상, 봄=우, 겨울=하, 가을=좌)로
 * 정렬되도록 한다. 균형이 강한 사주(magnitude → 0)는 중앙 일간 emoji와 겹치지 않도록
 * 최소 거리(rMax × MIN_FRAC)를 강제한다.
 */
const NATAL_MIN_FRAC = 0.55;
export function balanceToPosition(
  yinYang: number,
  hanYeol: number,
  cx: number,
  cy: number,
  rMax: number,
): { x: number; y: number } {
  const nx = (yinYang - hanYeol) / 2;
  const ny = (yinYang + hanYeol) / 2;
  const mag = Math.hypot(nx, ny);
  if (mag < 1e-4) {
    // 완전 균형 — 위쪽(여름)으로 약간 띄움
    return { x: cx, y: cy - rMax * NATAL_MIN_FRAC };
  }
  const r = (NATAL_MIN_FRAC + (1 - NATAL_MIN_FRAC) * Math.min(1, mag)) * rMax;
  return {
    x: cx + (nx / mag) * r,
    y: cy - (ny / mag) * r,
  };
}

/** 오행(한글) → CSS 변수 이름. 일간 색을 모듈 사용처에서 동적으로 쓰기 위함. */
export const WUXING_VAR: Record<string, string> = {
  목: "var(--el-wood)",
  화: "var(--el-fire)",
  토: "var(--el-earth)",
  금: "var(--el-metal)",
  수: "var(--el-water)",
};

// ============================================================
// 대운 진행 방향 — 순행(CCW) / 역행(CW)
// ============================================================

export type DayunDirection = "ccw" | "cw";

/**
 * 대운 배열의 첫 두 칸 지지 차이로 진행 방향을 추론한다.
 * - clockIndex가 +1로 증가 → CCW(순행)
 * - 그 외(clockIndex가 -1) → CW(역행)
 *
 * 출생년 음양·성별 규칙을 직접 따지지 않아도 calculator가 만든 순서가 진실의 원천.
 */
export function dayunDirection(daewoon: DaewoonPillar[]): DayunDirection | null {
  if (daewoon.length < 2) return null;
  const i0 = branchMeta(daewoon[0].zhi.hanja).clockIndex;
  const i1 = branchMeta(daewoon[1].zhi.hanja).clockIndex;
  const diff = (i1 - i0 + 12) % 12;
  return diff === 1 ? "ccw" : "cw";
}

// ============================================================
// 라이프라인 — 현재 나이가 어느 대운에 속하는지
// ============================================================

export type LifelineNow = {
  /** 현재 속한 대운 인덱스 (0..8). */
  activeIdx: number;
  /** 이 대운 내에서의 진행 비율 [0, 1). */
  ageFrac: number;
  /** SVG 좌표 — 라이프라인 링 위 현재 위치. */
  position: { x: number; y: number };
};

/**
 * 현재 나이가 어느 대운 칸에 위치하는지 + 다음 칸과의 사이를 보간해 시계 위치를 돌려준다.
 */
export function lifelineNow(
  daewoon: DaewoonPillar[],
  currentAge: number,
  direction: DayunDirection,
  cx: number,
  cy: number,
  r: number,
): LifelineNow | null {
  if (daewoon.length === 0) return null;
  let activeIdx = 0;
  for (let i = 0; i < daewoon.length; i++) {
    if (daewoon[i].startAge <= currentAge) activeIdx = i;
  }
  const cur = daewoon[activeIdx];
  const next = daewoon[activeIdx + 1] ?? null;
  const span = next ? next.startAge - cur.startAge : 10;
  const frac = Math.min(1, Math.max(0, (currentAge - cur.startAge) / span));

  const a0 = branchAngleDeg(cur.zhi.hanja);
  const step = direction === "ccw" ? 30 : -30;
  const a = (a0 + step * frac) * DEG_TO_RAD;

  return {
    activeIdx,
    ageFrac: frac,
    position: { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) },
  };
}

// ============================================================
// 일간 친화도 — 대운별 결의 맞물림 점수
// ============================================================

const WUXING_ORDER = ["목", "화", "토", "금", "수"] as const;
type Wuxing = (typeof WUXING_ORDER)[number];

function isWuxing(s: string): s is Wuxing {
  return (WUXING_ORDER as readonly string[]).includes(s);
}

/** 상생: a가 b를 생함 (a → b). 목→화→토→금→수→목 */
function generates(a: Wuxing, b: Wuxing): boolean {
  const ai = WUXING_ORDER.indexOf(a);
  const bi = WUXING_ORDER.indexOf(b);
  return (ai + 1) % 5 === bi;
}

/** 상극: a가 b를 극함 (a → b). 목→토, 토→수, 수→화, 화→금, 금→목 */
function controls(a: Wuxing, b: Wuxing): boolean {
  const ai = WUXING_ORDER.indexOf(a);
  const bi = WUXING_ORDER.indexOf(b);
  return (ai + 2) % 5 === bi;
}

/**
 * 일간 vs 대운 한 글자의 십성적 친화도.
 *   +2: 인성 (other가 self를 생함, 도움)
 *   +1: 비견·겁재 (같은 결)
 *    0: 식상 (self가 other를 생함, 표현·소모)
 *   -1: 재성 (self가 other를 극, 노력 필요)
 *   -2: 관성 (other가 self를 극, 단련·압박)
 */
function elementCompat(self: Wuxing, other: Wuxing): number {
  if (self === other) return 1;
  if (generates(other, self)) return 2;
  if (generates(self, other)) return 0;
  if (controls(self, other)) return -1;
  if (controls(other, self)) return -2;
  return 0;
}

/**
 * 대운(천간+지지)의 일간 친화도. 천간·지지 평균으로 -2 ~ +2 점수.
 * 점선 0 기준선 위(↑)에 그릴지 아래(↓)에 그릴지의 입력이 된다.
 */
export function dayunCompatScore(dayMasterWuxing: string, dayun: DaewoonPillar): number {
  if (!isWuxing(dayMasterWuxing)) return 0;
  const dm = dayMasterWuxing;
  const ganW = dayun.gan.wuxing;
  const zhiW = dayun.zhi.wuxing;
  const ganScore = isWuxing(ganW) ? elementCompat(dm, ganW) : 0;
  const zhiScore = isWuxing(zhiW) ? elementCompat(dm, zhiW) : 0;
  return (ganScore + zhiScore) / 2;
}

// ============================================================
// 곡선 path — 9 대운 점을 부드럽게 잇기 (Catmull-Rom → Bezier)
// ============================================================

/**
 * 점 배열을 부드러운 곡선으로 잇는 SVG path d 속성을 반환.
 * Catmull-Rom spline을 cubic Bezier로 변환. 양 끝은 자기 자신으로 반사.
 */
export function smoothCurvePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

// ============================================================
// 라벨 헬퍼 — 칩/본문에서 자주 쓰는 문구
// ============================================================

export type SeasonLabel = { season: Season; phrase: string };

/** 월지(또는 임의 지지) → 계절 + 풀이 문구. */
export function seasonOfBranch(hanja: string): SeasonLabel {
  const m = branchMeta(hanja);
  return { season: m.season, phrase: m.phrase };
}

// ============================================================
// 계절별 색 토큰 — CSS 변수명
// ============================================================

export const SEASON_VARS: Record<Season, { bg: string; deep: string }> = {
  봄:   { bg: "var(--season-spring-bg)", deep: "var(--season-spring-deep)" },
  여름: { bg: "var(--season-summer-bg)", deep: "var(--season-summer-deep)" },
  가을: { bg: "var(--season-autumn-bg)", deep: "var(--season-autumn-deep)" },
  겨울: { bg: "var(--season-winter-bg)", deep: "var(--season-winter-deep)" },
};

export const SEASON_EMOJI: Record<Season, string> = {
  봄: "🌱",
  여름: "☀",
  가을: "🍂",
  겨울: "❄",
};

export const SEASON_SUBTITLE: Record<Season, string> = {
  봄: "새싹 돋는",
  여름: "한낮의 햇살",
  가을: "거두는 들판",
  겨울: "잠든 씨앗",
};

/** 각 계절에 잘 맞는 특성 — 사주 명리의 오행 인격 키워드. */
export const SEASON_TRAITS: Record<Season, string[]> = {
  봄: ["호기심", "성장", "시작"],
  여름: ["정열", "표현", "밝음"],
  가을: ["결단", "원칙", "정리"],
  겨울: ["지혜", "인내", "깊이"],
};
