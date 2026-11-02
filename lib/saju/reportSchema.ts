import { Type, type Schema } from "@google/genai";
import { PERSONAL_REPORT_SECTION_IDS } from "../report/personalContract";

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
      description: "표제 — 본질 메타포 + 태어난 계절감을 엮은 한 문장(30자 안팎, 따옴표 없이). 한자·천간지지명 금지.",
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
        `영역별 본문 ${PERSONAL_REPORT_SECTION_IDS.length}개를 이 순서로 고정: ${PERSONAL_REPORT_SECTION_IDS.join(" / ")}. 따뜻하고 서정적인 존댓말로 설명한다. 명식·대운·조후·격국·억부와 전년도·금년도·내년도 세운은 제공된 계산 자료만 사용하고 실제 사건·질병·성공을 예언하지 않는다. 기질 검사 전 사주 관점의 기초 풀이이며 최종 사주+기질 리포트와 구별한다.`,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, enum: [...PERSONAL_REPORT_SECTION_IDS], description: "영역 이름. 지정한 제목 그대로이며 번호·대괄호를 붙이지 않는다." },
          summary: { type: Type.STRING, description: "그 영역을 관통하는 한 문장 핵심 요약." },
          body: {
            type: Type.STRING,
            description:
              "영역 본문. 존댓말과 빈 줄로 읽기 쉽게 나눈다. ─ 소제목 / • 항목 / ▸ 시기 마커 사용 가능. 명리 용어와 한자는 실제 입력에 있을 때 쉬운 풀이를 병기한다. 마크다운(**,#,*)·HTML 금지.",
          },
        },
        propertyOrdering: ["id", "summary", "body"],
        required: ["id", "summary", "body"],
      },
    },
    lifeline: {
      type: Type.ARRAY,
      description:
        "인생 시기 — 제공된 대운(10년 단위) 구간을 같은 순서·나이 범위로 담는다. 보통 9개. 각 구간을 2~3문장의 존댓말로 설명하며 과거 실제 사건을 만들지 않는다. 자료가 없으면 빈 배열.",
      items: {
        type: Type.OBJECT,
        properties: {
          startAge: { type: Type.INTEGER, description: "구간 시작 만 나이 ([시기 9구간] 표의 값 그대로)." },
          endAge: { type: Type.INTEGER, description: "구간 끝 만 나이 ([시기 9구간] 표의 값 그대로)." },
          season: { type: Type.STRING, description: "계절 한 글자 묶음: 봄 / 여름 / 가을 / 겨울 중 하나." },
          seasonLabel: { type: Type.STRING, description: "계절감 자연어 라벨. 예: 꽃 피는 봄 / 거두는 늦가을." },
          tone: {
            type: Type.STRING,
            description:
              "10년 구간의 시기 라벨: 배우고 채우는 시기 / 시작하고 펼치는 시기 / 나누고 남기는 시기 중 하나.",
          },
          summary: {
            type: Type.STRING,
            description: "이 구간 서술 2~3줄. 구체 장면 1개 + 본질·흐름 연결. 한자·천간지지명·마크다운 금지.",
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
    actionPlan: {
      type: Type.ARRAY,
      description:
        "코칭 액션 플랜 — 이 리포트에서 바로 실천할 액션 3개. 시점은 오늘·이번 주·이번 달을 하나씩.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "행동지침에서 설명한 작고 구체적인 실천을 존댓말로 요약. 기한 내 해당 상황이 없으면 다음 기회에 적용하도록 하며 새로운 문제를 만들지 않는다.",
          },
          timeframe: { type: Type.STRING, description: "오늘 / 이번 주 / 이번 달 중 하나." },
          hint: { type: Type.STRING, description: "무엇을·왜 보강하는지 짧은 한 줄." },
        },
        propertyOrdering: ["title", "timeframe", "hint"],
        required: ["title", "timeframe", "hint"],
      },
    },
    disclaimer: {
      type: Type.STRING,
      description: "면책 한 줄 — 사주는 거울이며 매일의 선택은 본인의 몫. 60단어 이내.",
    },
  },
  propertyOrdering: ["title", "keywords", "sections", "lifeline", "roadmap", "actionPlan", "disclaimer"],
  required: ["title", "keywords", "sections", "lifeline", "roadmap", "actionPlan", "disclaimer"],
};
