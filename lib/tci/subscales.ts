/**
 * 확장판(140문항)의 28 하위척도 라벨·설명.
 *
 * 코드(NS1, HA2 등)와 한국어 라벨은 Cloninger 7요인 모형의 공개 학술 구성개념을
 * 따른다. 설명문은 Sajulife가 학술 정의에서 새로 쓴 짧은 한국어 요약.
 *
 * 약식판(35문항)에는 하위척도가 없으므로 이 맵은 확장판 전용.
 */

import type { TciDimension } from "./questions";

export type SubscaleMeta = {
  code: string;          // "NS1"
  dimension: TciDimension;
  label: string;         // "탐색적 흥분"
  description: string;   // 한 줄 요약
};

export const TCI_RS_SUBSCALE_META: Record<string, SubscaleMeta> = {
  // NS 자극추구
  NS1: { code: "NS1", dimension: "NS", label: "탐색적 흥분", description: "새로움·자극에 끌리는 정도" },
  NS2: { code: "NS2", dimension: "NS", label: "충동성",     description: "즉흥적으로 결정·행동하는 정도" },
  NS3: { code: "NS3", dimension: "NS", label: "무절제",     description: "감정·자원을 절제 없이 쓰는 정도" },
  NS4: { code: "NS4", dimension: "NS", label: "자유분방",   description: "규칙·질서에서 벗어나려는 정도" },

  // HA 위험회피
  HA1: { code: "HA1", dimension: "HA", label: "예기불안",       description: "앞으로 닥칠 일을 미리 걱정하는 정도" },
  HA2: { code: "HA2", dimension: "HA", label: "불확실성 공포",  description: "결과가 불확실한 상황을 피하려는 정도" },
  HA3: { code: "HA3", dimension: "HA", label: "수줍음",         description: "낯선 사람·상황에서 위축되는 정도" },
  HA4: { code: "HA4", dimension: "HA", label: "쉽게 지침",      description: "에너지가 빨리 고갈되는 정도" },

  // RD 사회적 민감성
  RD1: { code: "RD1", dimension: "RD", label: "정서적 감수성", description: "감정 자극에 민감하게 반응하는 정도" },
  RD3: { code: "RD3", dimension: "RD", label: "애착",         description: "정서적 유대를 깊고 길게 유지하려는 정도" },
  RD4: { code: "RD4", dimension: "RD", label: "의존",         description: "타인의 인정·동조에 기대는 정도" },

  // PS 인내력
  PS1: { code: "PS1", dimension: "PS", label: "노력 추구",    description: "어렵고 긴 일에 자발적으로 매달리는 정도" },
  PS2: { code: "PS2", dimension: "PS", label: "작업 끈기",    description: "좌절·반복에도 멈추지 않는 정도" },
  PS3: { code: "PS3", dimension: "PS", label: "야망",         description: "더 높은 성취·지위를 지향하는 정도" },
  PS4: { code: "PS4", dimension: "PS", label: "완벽주의",     description: "결과를 끝까지 다듬으려는 정도" },

  // SD 자율성
  SD1: { code: "SD1", dimension: "SD", label: "책임감",     description: "선택의 결과를 자기 몫으로 받아들이는 정도" },
  SD2: { code: "SD2", dimension: "SD", label: "목적성",     description: "행동에 목표·방향이 분명한 정도" },
  SD3: { code: "SD3", dimension: "SD", label: "자원동원",   description: "막힌 상황에 대처 방안을 찾아내는 정도" },
  SD4: { code: "SD4", dimension: "SD", label: "자기수용",   description: "자기 한계·단점을 받아들이는 정도" },
  SD5: { code: "SD5", dimension: "SD", label: "자기일치",   description: "행동이 자기 가치와 일관되게 흐르는 정도" },

  // CO 연대감
  CO1: { code: "CO1", dimension: "CO", label: "사회적 수용", description: "다른 결의 사람·의견을 그대로 받아들이는 정도" },
  CO2: { code: "CO2", dimension: "CO", label: "공감",        description: "타인의 감정·맥락을 읽고 함께 느끼는 정도" },
  CO3: { code: "CO3", dimension: "CO", label: "도움 행동",   description: "필요한 자리에 자발적으로 나서는 정도" },
  CO4: { code: "CO4", dimension: "CO", label: "연민",        description: "잘못·약함에 대해 너그러워지는 정도" },
  CO5: { code: "CO5", dimension: "CO", label: "순수 원칙",   description: "이해득실보다 양심·원칙을 우선하는 정도" },

  // ST 자기초월
  ST1: { code: "ST1", dimension: "ST", label: "자기망각·몰입", description: "일·체험 속에서 자기 감각이 옅어질 만큼 빠져드는 정도" },
  ST2: { code: "ST2", dimension: "ST", label: "초개인적 동일시", description: "자기를 넘어선 흐름·관계에 자신을 잇는 정도" },
  ST3: { code: "ST3", dimension: "ST", label: "영적 수용",     description: "통제 너머의 영역을 받아들이는 정도" },
};

export function getSubscaleMeta(code: string): SubscaleMeta | null {
  return TCI_RS_SUBSCALE_META[code] ?? null;
}
