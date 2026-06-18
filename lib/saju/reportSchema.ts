import { Type, type Schema } from "@google/genai";

/**
 * 개인 사주 리포트의 Gemini responseSchema — 구조를 강제해 JSON으로 받는다.
 * 클라이언트 타입은 lib/report/types.ts(PersonalReport)와 1:1로 맞춘다.
 *
 * body 필드는 긴 자유 서술(마커 포함)이라 STRING으로 두고, 프롬프트가 그 안의
 * 작성 규칙을 안내한다. propertyOrdering으로 모델의 작성 순서를 고정한다.
 */
export const PERSONAL_REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "표제 — 일간 메타포 + 태어난 계절감을 엮은 한 문장(30자 안팎, 따옴표 없이).",
    },
    keywords: {
      type: Type.ARRAY,
      description: "평생 키워드 3개.",
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "키워드 한 단어/구" },
          desc: { type: Type.STRING, description: "한 줄 풀이 (구체 사례 한 조각)" },
        },
        propertyOrdering: ["word", "desc"],
        required: ["word", "desc"],
      },
    },
    sections: {
      type: Type.ARRAY,
      description:
        "영역별 본문 9개: 기본 성향 / 성격 기질 및 잠재력 / 인간관계 및 평판 / 가정 및 파트너십 / 직업 적성 및 비즈니스 / 신체 및 멘탈 관리 / 장기적 운의 흐름 / 연간 실행 전략 / 성장 에너지와 행동 지침. 단, '기본 성향'을 맨 앞에 두고 나머지는 [나이대 우선순위] 순으로 재배열한다.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "영역 이름 (대괄호 없이). 예: 기본 성향" },
          summary: { type: Type.STRING, description: "그 영역을 관통하는 한 문장 핵심 요약." },
          body: {
            type: Type.STRING,
            description:
              "영역 본문. ─ 소제목 / ◆ 묶음 제목 / • 항목 / ▸ 항목 마커와 줄바꿈으로 구조화. 마크다운(**,#,*)·한자 금지.",
          },
        },
        propertyOrdering: ["id", "summary", "body"],
        required: ["id", "summary", "body"],
      },
    },
    lifeline: {
      type: Type.ARRAY,
      description:
        "인생 흐름 — 대운(10년 단위) 구간을 [흐름 9구간] 표 순서 그대로, 한 구간도 빠짐없이 담는다. 보통 9개. 각 구간을 2~3줄로 깊게 서술하되 만세력 나열이 되지 않게.",
      items: {
        type: Type.OBJECT,
        properties: {
          startAge: { type: Type.INTEGER, description: "구간 시작 만 나이 ([흐름 9구간] 표의 값 그대로)." },
          endAge: { type: Type.INTEGER, description: "구간 끝 만 나이 ([흐름 9구간] 표의 값 그대로)." },
          season: { type: Type.STRING, description: "계절 한 글자 묶음: 봄 / 여름 / 가을 / 겨울 중 하나." },
          seasonLabel: { type: Type.STRING, description: "계절감 자연어 라벨. 예: 꽃 피는 봄 / 거두는 늦가을." },
          tone: { type: Type.STRING, description: "흐름의 결: 받는 결 / 여는 결 / 주는 결 중 하나." },
          summary: {
            type: Type.STRING,
            description: "이 구간 서술 2~3줄. 구체 장면 1개 + 본질·흐름 연결. 한자·마크다운 금지.",
          },
        },
        propertyOrdering: ["startAge", "endAge", "season", "seasonLabel", "tone", "summary"],
        required: ["startAge", "endAge", "season", "seasonLabel", "tone", "summary"],
      },
    },
    roadmap: {
      type: Type.OBJECT,
      description: "인생 로드맵 요약. 본문 내용과 일관되게.",
      properties: {
        character: { type: Type.STRING, description: "한 마디 캐릭터 정의(별명)." },
        resourceInput: { type: Type.STRING, description: "타고난 자원 — 인풋 결 한 줄." },
        resourceOutput: { type: Type.STRING, description: "타고난 자원 — 아웃풋 결 한 줄." },
        riskShadow: { type: Type.STRING, description: "리스크 관리 — 가장 큰 그림자 한 줄." },
        riskTool: { type: Type.STRING, description: "리스크 관리 — 다루는 멘탈 툴킷/루틴 한 줄." },
        direction: { type: Type.STRING, description: "향후 방향성 — 어떤 자립·확장·전환인지 한 줄." },
      },
      propertyOrdering: [
        "character",
        "resourceInput",
        "resourceOutput",
        "riskShadow",
        "riskTool",
        "direction",
      ],
      required: ["character", "resourceInput", "resourceOutput", "riskShadow", "riskTool", "direction"],
    },
    disclaimer: {
      type: Type.STRING,
      description: "면책 한 줄 — 사주는 거울이며 매일의 선택은 본인의 몫. 60단어 이내.",
    },
  },
  propertyOrdering: ["title", "keywords", "sections", "lifeline", "roadmap", "disclaimer"],
  required: ["title", "keywords", "sections", "lifeline", "roadmap", "disclaimer"],
};
