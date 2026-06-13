// 검증용 페르소나 fixture.
// 실제 사용자 데이터(KV) 대신 이 합성 프로필로 프롬프트를 렌더한다.
// 각 페르소나는 (1) 사주 프로필과 (2) TCI 7차원 목표 퍼센트를 가지며,
// 목표 퍼센트에 맞춰 35문항 응답을 합성해 채점까지 재현한다.
//
// 다양성 의도:
// - 아침/야자시(23시대)/조자시(0시대)/시각모름/음력 — 만세력 경계 케이스 망라
// - 극단 기질 / 평탄 기질(바넘 테스트) — 프롬프트가 무너지는 지점 확인
import { getItemsForScoring } from "../../lib/tci/questions";
import type { FamilyMember, SajuProfile } from "../../lib/store/types";

export type Persona = {
  id: string;
  desc: string;
  profile: SajuProfile;
  /** 차원별 목표 퍼센트(0~100). 이 패턴으로 1~5 응답을 합성한다. */
  tciTarget: Record<string, number>;
  /** 가족 사주(family-saju) 렌더용. 없으면 family 종류는 건너뛴다. */
  family?: FamilyMember[];
  /** AI 상담(consult) 렌더용 질문. 없으면 consult 종류는 건너뛴다. */
  consultQuestion?: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "p1-jiyu",
    desc: "29~35세 도전적 창업가형 여성, 아침생",
    profile: { name: "지유", birthDate: "1991-03-08", birthTime: "07:30", gender: "female", calendar: "solar" },
    tciTarget: { NS: 84, HA: 28, RD: 55, PS: 62, SD: 80, CO: 58, ST: 40 },
    family: [
      { id: "f1", relation: "어머니", profile: { name: "정순", birthDate: "1963-11-02", birthTime: "05:20", gender: "female", calendar: "solar" } },
      { id: "f2", relation: "남동생", profile: { name: "지훈", birthDate: "1995-06-21", birthTime: "", gender: "male", calendar: "solar" } },
    ],
    consultQuestion: "요즘 이직을 진지하게 고민 중이에요. 지금 옮기는 게 맞을까요, 더 버텨야 할까요?",
  },
  {
    id: "p2-minjun",
    desc: "신중한 관리자형 남성, 야자시 경계(23:40)",
    profile: { name: "민준", birthDate: "1985-12-31", birthTime: "23:40", gender: "male", calendar: "solar" },
    tciTarget: { NS: 30, HA: 78, RD: 48, PS: 82, SD: 60, CO: 64, ST: 25 },
  },
  {
    id: "p3-seoyeon",
    desc: "관계중심 20대 여성, 출생시각 모름",
    profile: { name: "서연", birthDate: "2001-07-15", birthTime: "", gender: "female", calendar: "solar" },
    tciTarget: { NS: 55, HA: 52, RD: 86, PS: 45, SD: 42, CO: 82, ST: 70 },
  },
  {
    id: "p4-yeongho",
    desc: "50대 남성, 음력 생일 — 바넘 테스트용 평탄 기질",
    profile: { name: "영호", birthDate: "1972-01-25", birthTime: "14:00", gender: "male", calendar: "lunar" },
    tciTarget: { NS: 50, HA: 50, RD: 50, PS: 52, SD: 50, CO: 48, ST: 50 },
  },
  {
    id: "p5-harin",
    desc: "몽상가형 20대 여성, 조자시(00:20)",
    profile: { name: "하린", birthDate: "1996-09-09", birthTime: "00:20", gender: "female", calendar: "solar" },
    tciTarget: { NS: 72, HA: 45, RD: 60, PS: 30, SD: 38, CO: 50, ST: 88 },
  },
];

/**
 * 목표 퍼센트에 맞춰 약식판(35문항) 1~5 응답을 합성한다.
 * 차원 내에서 ±1 변주를 줘 자연스러운 응답 분포를 만든다.
 * (역채점 문항은 raw 저장값을 6-v로 되돌려, 실제 입력 응답과 동일한 형태로 둔다.)
 */
export async function synthesizeAnswers(target: Record<string, number>): Promise<Record<string, number>> {
  const items = await getItemsForScoring("short");
  const answers: Record<string, number> = {};
  const dimSeen: Record<string, number> = {};
  for (const item of items) {
    const t = target[item.dimension] ?? 50;
    const base = 1 + (t / 100) * 4; // 1~5 연속값
    const n = (dimSeen[item.dimension] = (dimSeen[item.dimension] ?? 0) + 1);
    const jitter = [0, 0.6, -0.6, 0.3, -0.3][n % 5];
    let v = Math.round(base + jitter);
    v = Math.max(1, Math.min(5, v));
    answers[item.id] = item.reverse ? 6 - v : v;
  }
  return answers;
}
