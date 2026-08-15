import { Type, type Schema } from "@google/genai";

/**
 * 궁합 리포트의 Gemini responseSchema — 구조를 강제해 JSON으로 받는다.
 * 파싱은 가족 리포트와 같은 { title, sections, actionPlan, disclaimer } 모양을 공유한다
 * (lib/report/types.ts의 parseFamilyReport 재사용).
 *
 * ★가족(9~10섹션)과 달리 7섹션으로 묶는다★ — 궁합은 등장인물이 둘뿐이라
 * 섹션을 잘게 쪼갤수록 같은 얘기를 표현만 바꿔 반복하게 된다(가족 리포트에서 확인된 천장).
 * 두 사람짜리 관계는 '케미·온도차·갈등' 세 축에 분량을 몰아주는 편이 밀도가 높다.
 */
export const COMPAT_REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "두 사람의 관계를 한 문장으로. 서로 다른 두 결이 만나 만드는 결을 자연어로.",
    },
    sections: {
      type: Type.ARRAY,
      description:
        "리포트 섹션 정확히 7개. 순서는 두 사람의 결, 케미 진단, 온도차, 갈등 시나리오, 관계 흐름, 현실 궁합, 실행전략.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "섹션 이름. 위 지정된 7개 이름 중 하나.",
          },
          summary: {
            type: Type.STRING,
            description: "섹션을 관통하는 한 문장 핵심 요약.",
          },
          body: {
            type: Type.STRING,
            description:
              "본문. 마커 규칙을 사용해 구조화한다: ─ 소제목, ◆ 묶음, • 항목, ▸ 세부. 한자/명리 전문용어 금지.",
          },
        },
        propertyOrdering: ["id", "summary", "body"],
        required: ["id", "summary", "body"],
      },
    },
    actionPlan: {
      type: Type.ARRAY,
      description:
        "코칭 액션 플랜 — 본인이 이 관계를 위해 직접 실천할 액션 3개. 오늘/이번 주/이번 달 하나씩.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "본인이 할 한 문장 행동. 반말 명령형, 구체적으로.",
          },
          timeframe: { type: Type.STRING, description: "오늘 / 이번 주 / 이번 달 중 하나." },
          hint: { type: Type.STRING, description: "어떤 관계·상황에 좋은지 짧은 한 줄." },
        },
        propertyOrdering: ["title", "timeframe", "hint"],
        required: ["title", "timeframe", "hint"],
      },
    },
    disclaimer: {
      type: Type.STRING,
      description: "사주는 두 사람의 결을 비추는 거울일 뿐, 관계는 매일의 선택이 만든다는 한 줄.",
    },
  },
  propertyOrdering: ["title", "sections", "actionPlan", "disclaimer"],
  required: ["title", "sections", "actionPlan", "disclaimer"],
};
