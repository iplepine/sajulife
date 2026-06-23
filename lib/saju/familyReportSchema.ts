import { Type, type Schema } from "@google/genai";

/**
 * 가족 사주 리포트의 Gemini responseSchema — 구조를 강제해 JSON으로 받는다.
 * 클라이언트 타입은 lib/report/types.ts(FamilyReport)의 새 sections 구조와 맞춘다.
 *
 * 상단 리포트 기준 정보/제노그램은 UI가 렌더하고, AI는 가족 한 문장(title)과
 * 하단 6개 섹션, 코칭 액션, 면책 문구만 만든다.
 */
export const FAMILY_REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "이 가족의 결을 표현한 한 문장. 본인 중심 + 가족 전체 분위기를 자연어로.",
    },
    sections: {
      type: Type.ARRAY,
      description:
        "하단 리포트 섹션 6개. 순서는 기본성향, 가족분위기, 가족건강운, 가족금전운, 가족대운 별 비교, 올해 실행전략.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "섹션 이름. 지정된 6개 이름 중 하나.",
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
        "코칭 액션 플랜 — 본인이 가족 관계를 위해 직접 실천할 액션 3개. 오늘/이번 주/이번 달 하나씩.",
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
      description: "사주는 가족의 결을 비추는 거울일 뿐, 관계는 매일의 대화가 만든다는 한 줄.",
    },
  },
  propertyOrdering: ["title", "sections", "actionPlan", "disclaimer"],
  required: ["title", "sections", "actionPlan", "disclaimer"],
};
