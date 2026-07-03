import { Type, type Schema } from "@google/genai";

/**
 * 기질(TCI) 리포트의 Gemini responseSchema.
 *
 * 개인 사주 리포트(lib/saju/reportSchema.ts)와 같은 구조로 받아, 화면에서
 * 동일한 StructuredReport 렌더 경로(섹션 아코디언 + 요약 한 줄)를 그대로 탄다.
 * 차이: 사주가 아니라 7차원 점수만 근거로 하고, 대운(lifeline)이 없으며,
 * 유연성(flexibility)을 8번째 축 좌표로 함께 내보낸다.
 *
 * roadmap이 있어야 클라이언트 parsePersonalReport가 이 JSON을 구조화 리포트로
 * 인식한다(lib/report/types.ts). 그래서 roadmap을 기질 맥락으로 채운다.
 */
export const TCI_REPORT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description:
        "표제 — 가장 두드러진 두 차원의 조합으로 이 사람의 작동 방식을 압축한 한 문장(30자 안팎, 따옴표 없이). 사주·일간·오행·띠는 절대 쓰지 않는다.",
    },
    keywords: {
      type: Type.ARRAY,
      description: "기질 키워드 3개 — 7차원 패턴에서 뽑은 핵심 결.",
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "키워드 한 단어/구" },
          desc: { type: Type.STRING, description: "한 줄 풀이 (구체 장면 한 조각)" },
        },
        propertyOrdering: ["word", "desc"],
        required: ["word", "desc"],
      },
    },
    sections: {
      type: Type.ARRAY,
      description:
        "영역별 본문을 이 순서로 고정: 기본 성향 / 여덟 결 기질분석 / 인간은 같은 실수를 반복하지 / 스트레스 시나리오 / 대인관계 / 직무·진로 / 성장 과제 / 코칭 액션플랜. 기본 성향만 화면에서 바로 펼치고 나머지는 접힌 섹션으로 렌더한다. 값에는 사주·일간·오행·띠·운세를 절대 쓰지 않고, 영문 차원 코드(NS·HA 등)도 노출하지 않는다. ★본문 값에는 퍼센트·점수 숫자를 쓰지 않는다 — 높다/중간/낮다 같은 말과 그 조합·장면으로만 표현한다(수치는 화면 위 레이더가 이미 보여준다).",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "영역 이름 (대괄호·번호 없이). 예: 기본 성향" },
          summary: { type: Type.STRING, description: "그 영역을 관통하는 한 문장 핵심 요약." },
          body: {
            type: Type.STRING,
            description:
              "영역 본문. ─ 소제목 / ◆ 묶음 제목 / • 항목 / ▸ 항목 / ①~⑧ 마커와 줄바꿈으로 구조화. 마크다운(**,#,*)·가로줄·박스 문자 금지. 사주·명리 용어 금지.",
          },
        },
        propertyOrdering: ["id", "summary", "body"],
        required: ["id", "summary", "body"],
      },
    },
    roadmap: {
      type: Type.OBJECT,
      description: "한 눈 요약 — 본문 내용과 일관되게. 7차원 조합에서 도출.",
      properties: {
        character: { type: Type.STRING, description: "한 마디 캐릭터 정의(별명)." },
        resourceInput: { type: Type.STRING, description: "가장 센 무기 차원 한 줄." },
        resourceOutput: { type: Type.STRING, description: "그 무기가 성과로 바뀌는 방식 한 줄." },
        riskShadow: { type: Type.STRING, description: "가장 자주 걸리는 그림자/반복 함정 한 줄." },
        riskTool: { type: Type.STRING, description: "그 함정을 끊는 멘탈 툴킷/루틴 한 줄." },
        direction: { type: Type.STRING, description: "성장 방향 — 다음 단계로 가는 과제 한 줄." },
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
    flexibility: {
      type: Type.INTEGER,
      description:
        "유연성 — 상황·관점·계획을 얼마나 잘 바꾸고 적응하는가(외곬·경직의 반대). 7차원 패턴으로 추정한 0~100 정수. 레이더 8번째 축 좌표로 쓴다. '성장 과제' 섹션 본문의 FLEX 근거에서 서술한 높낮이·방향과 일치해야 하되, 본문에는 이 숫자를 쓰지 않는다(높다/낮다로만).",
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
            description: "한 문장 행동(반말 명령형). 구체적이고 측정 가능하게. 마크다운 금지.",
          },
          timeframe: { type: Type.STRING, description: "오늘 / 이번 주 / 이번 달 중 하나." },
          hint: { type: Type.STRING, description: "어떤 차원을 살리거나 보완하는지 짧은 한 줄." },
        },
        propertyOrdering: ["title", "timeframe", "hint"],
        required: ["title", "timeframe", "hint"],
      },
    },
    disclaimer: {
      type: Type.STRING,
      description: "면책 한 줄 — 기질검사는 거울이며 매일의 선택은 본인의 몫. 60단어 이내.",
    },
  },
  propertyOrdering: ["title", "keywords", "sections", "roadmap", "flexibility", "actionPlan", "disclaimer"],
  required: ["title", "keywords", "sections", "roadmap", "flexibility", "actionPlan", "disclaimer"],
};
