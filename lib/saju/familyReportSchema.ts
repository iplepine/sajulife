import { Type, type Schema } from "@google/genai";

/**
 * 가족 사주 리포트의 Gemini responseSchema — 구조를 강제해 JSON으로 받는다.
 * 클라이언트 타입은 lib/report/types.ts(FamilyReport)와 1:1로 맞춘다.
 *
 * 모든 텍스트 필드는 한자·천간지지명·생극용어 없이 자연어 메타포로 채우도록
 * 프롬프트가 안내한다. propertyOrdering으로 작성 순서를 고정한다.
 */
export const FAMILY_REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "이 가족의 분위기를 한 문장으로(본인의 결 + 가족 전체 기운). 따옴표 없이.",
    },
    cast: {
      type: Type.ARRAY,
      description: "가족 캐스팅 — 본인 포함 모든 구성원을 한 명씩.",
      items: {
        type: Type.OBJECT,
        properties: {
          relation: { type: Type.STRING, description: "관계. 본인은 \"나\"." },
          name: { type: Type.STRING, description: "이름" },
          metaphor: { type: Type.STRING, description: "타고난 결을 자연어 한 메타포로. 한자 금지." },
          zodiac: { type: Type.STRING, description: "띠. 예: 토끼띠" },
          character: { type: Type.STRING, description: "한 문장 캐릭터 설명" },
        },
        propertyOrdering: ["relation", "name", "metaphor", "zodiac", "character"],
        required: ["relation", "name", "metaphor", "zodiac", "character"],
      },
    },
    compat: {
      type: Type.ARRAY,
      description:
        "1대1 케미 카드 — 본인과 각 구성원(본인 제외)의 관계를 한 명씩. 추상 묘사 금지, 실제 생활 장면에 닿게.",
      items: {
        type: Type.OBJECT,
        properties: {
          relation: { type: Type.STRING, description: "그 구성원과의 관계" },
          name: { type: Type.STRING, description: "그 구성원 이름" },
          bond: { type: Type.STRING, description: "관계의 결을 아주 짧은 한 마디 태그로. 예: 서로를 채워주는 사이" },
          meeting: { type: Type.STRING, description: "두 사람의 결이 끌리는지·부딪치는지 자연어 한 줄. 한자·생극용어 금지." },
          goodMoments: { type: Type.STRING, description: "잘 맞는 순간 — 구체 장면 하나로 2~3줄." },
          frictionMoments: { type: Type.STRING, description: "부딪치기 쉬운 순간 — 실제 갈등 장면 하나로 2~3줄." },
          oneTry: { type: Type.STRING, description: "본인이 그 장면에서 바로 해볼 구체 행동 한 가지(1~2줄)." },
        },
        propertyOrdering: ["relation", "name", "bond", "meeting", "goodMoments", "frictionMoments", "oneTry"],
        required: ["relation", "name", "bond", "meeting", "goodMoments", "frictionMoments", "oneTry"],
      },
    },
    elementMap: {
      type: Type.STRING,
      description:
        "가족 오행 지도 — 어떤 기운이 강하고 부족한지, 부족한 기운이 분위기에서 어떻게 드러나는지 한 문단(6~8줄). 불기운/흙기운/물기운/추진력/결단력 같은 자연어로.",
    },
    togetherMood: {
      type: Type.STRING,
      description:
        "함께일 때의 분위기 — 가족이 모였을 때 패턴, 좋은 면·주의할 면. 마지막에 올해~1~2년 흐름 한 줄(기대·준비 톤, 단정 금지). 6~8줄.",
    },
    cautionScenes: {
      type: Type.ARRAY,
      description: "주의가 필요한 장면 2개.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "상황 한 마디. 예: 명절 가족 모임" },
          body: { type: Type.STRING, description: "어떻게 흐르기 쉬운지 + 본인의 역할 3~4줄." },
        },
        propertyOrdering: ["title", "body"],
        required: ["title", "body"],
      },
    },
    rituals: {
      type: Type.OBJECT,
      description: "지금부터 함께하는 가족 의식.",
      properties: {
        today: { type: Type.STRING, description: "오늘·이번 주말에 바로 해볼 가족 단위 작은 시도 1가지." },
        thisWeek: { type: Type.STRING, description: "한 주 안에 이어갈 시도 1가지." },
        thisMonth: { type: Type.STRING, description: "한 달 뒤 함께 답해볼 점검 질문 1가지." },
      },
      propertyOrdering: ["today", "thisWeek", "thisMonth"],
      required: ["today", "thisWeek", "thisMonth"],
    },
    actionPlan: {
      type: Type.ARRAY,
      description:
        "코칭 액션 플랜 — 본인({{name}})이 가족 관계를 위해 바로 실천할 액션 3개. 시점은 오늘·이번 주·이번 달을 하나씩. rituals와 겹치지 않게 본인 행동 중심으로.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "본인이 할 한 문장 행동(반말 명령형). 구체적으로. 한자 금지.",
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
  propertyOrdering: [
    "title",
    "cast",
    "compat",
    "elementMap",
    "togetherMood",
    "cautionScenes",
    "rituals",
    "actionPlan",
    "disclaimer",
  ],
  required: ["title", "cast", "compat", "elementMap", "togetherMood", "cautionScenes", "rituals", "actionPlan", "disclaimer"],
};
