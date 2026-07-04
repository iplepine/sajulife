/**
 * 십이운성(十二運星) — 일간(日干)이 어떤 지지 위에 있을 때의 '기운 세기 단계'.
 *
 * 사람 한 살이가 태어나(장생) 자라고(관대) 정점에 이르렀다가(제왕) 저무는(사·묘)
 * 12단계 리듬으로, 일간을 그 지지에 대입해 읽는다. 대운·세운·월운마다 이 단계가
 * 바뀌면서 "지금 내 기운이 오르막인지 내리막인지"를 가늠하는 축이 된다.
 *
 * 규칙: 각 일간의 장생(長生) 지지에서 출발해 양간(甲丙戊庚壬)은 순행, 음간(乙丁己辛癸)은
 * 역행. lunar-javascript의 地勢(getYearDiShi 등)와 28칸 교차검증 완료(불일치 0).
 */

export const TWELVE_STAGE_ORDER = [
  "장생", "목욕", "관대", "건록", "제왕", "쇠",
  "병", "사", "묘", "절", "태", "양",
] as const;

export type TwelveStage = (typeof TWELVE_STAGE_ORDER)[number];

const ZHI_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 각 일간의 장생(長生) 지지 — 여기서부터 순/역행으로 12단계를 센다. */
const CHANGSHENG_BRANCH: Record<string, string> = {
  甲: "亥", 乙: "午", 丙: "寅", 丁: "酉", 戊: "寅",
  己: "酉", 庚: "巳", 辛: "子", 壬: "申", 癸: "卯",
};

/** 양간은 순행(true), 음간은 역행(false). */
const FORWARD: Record<string, boolean> = {
  甲: true, 丙: true, 戊: true, 庚: true, 壬: true,
  乙: false, 丁: false, 己: false, 辛: false, 癸: false,
};

/** 일간(천간 한자) × 지지(한자) → 십이운성 단계. 매핑 불가 시 null. */
export function twelveStage(dayStem: string, branch: string): TwelveStage | null {
  const start = ZHI_ORDER.indexOf(CHANGSHENG_BRANCH[dayStem] ?? "");
  const bi = ZHI_ORDER.indexOf(branch);
  if (start < 0 || bi < 0) return null;
  const step = FORWARD[dayStem]
    ? (bi - start + 12) % 12
    : (start - bi + 12) % 12;
  return TWELVE_STAGE_ORDER[step];
}

/**
 * 십이운성 → 이모지 + 한 줄 일상어 풀이(반말 톤).
 * 표에서 한자 대신 이 이모지·풀이를 앞세워 일반인도 오르막/내리막을 바로 읽게 한다.
 */
export const TWELVE_STAGE_META: Record<TwelveStage, { hanja: string; emoji: string; gloss: string }> = {
  장생: { hanja: "長生", emoji: "🌱", gloss: "갓 돋은 새싹 — 시작·성장 기운이 붙어" },
  목욕: { hanja: "沐浴", emoji: "💦", gloss: "씻기고 다듬는 중 — 불안정·변덕이 큰 구간" },
  관대: { hanja: "冠帶", emoji: "🧥", gloss: "옷 갖춰 입고 나서는 청년 — 패기 만렙" },
  건록: { hanja: "建祿", emoji: "🏇", gloss: "제 힘으로 우뚝 — 왕성·독립의 절정 직전" },
  제왕: { hanja: "帝旺", emoji: "👑", gloss: "기운의 꼭대기 — 파워 최대치" },
  쇠: { hanja: "衰", emoji: "🍂", gloss: "정점 지나 한풀 꺾임 — 대신 노련·여유가 생겨" },
  병: { hanja: "病", emoji: "🤒", gloss: "기운이 앓는 구간 — 예민하고 쉬어가야 해" },
  사: { hanja: "死", emoji: "🌙", gloss: "활동 멈추고 정리 — 사색·마무리 모드" },
  묘: { hanja: "墓", emoji: "🏺", gloss: "거둬 갈무리 — 저장·수렴, 안으로 파고들어" },
  절: { hanja: "絕", emoji: "✂️", gloss: "완전히 끊긴 자리 — 단절이자 새 판의 전환점" },
  태: { hanja: "胎", emoji: "🥚", gloss: "새 씨앗 잉태 — 아직 잠재, 조용히 준비" },
  양: { hanja: "養", emoji: "🍼", gloss: "뱃속에서 자라는 중 — 양육받으며 대기" },
};
