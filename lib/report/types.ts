/**
 * 개인 사주 리포트의 구조화 스키마 (클라이언트 안전 — genai 의존성 없음).
 *
 * AI가 plain text 대신 이 모양의 JSON으로 리포트를 내보내고, ReportView가
 * 제목·요약·로드맵을 정규식 파싱 없이 그대로 렌더한다.
 * 각 섹션의 body는 여전히 마커(─ ◆ • ▸) 텍스트라, 본문 블록 렌더는 재사용한다.
 */

export type ReportKeyword = { word: string; desc: string };

export type ReportSection = {
  /** 영역 이름 (대괄호 없이) — 예: "기본 성향" */
  id: string;
  /** 영역을 관통하는 한 문장 핵심 요약 */
  summary: string;
  /** 본문 — ─ 소제목 / ◆ 묶음 / • 항목 / ▸ 마커와 줄바꿈으로 구조화된 텍스트 */
  body: string;
};

/** 인생 로드맵 요약 — 기존 ASCII 트리를 대체하는 구조화 필드. */
export type ReportRoadmap = {
  /** 한 마디 캐릭터 정의(별명) */
  character: string;
  /** 타고난 자원 — 인풋 결 */
  resourceInput: string;
  /** 타고난 자원 — 아웃풋 결 */
  resourceOutput: string;
  /** 리스크 관리 — 가장 큰 그림자 */
  riskShadow: string;
  /** 리스크 관리 — 다루는 멘탈 툴킷/루틴 */
  riskTool: string;
  /** 향후 방향성 — 어떤 자립·확장·전환인지 */
  direction: string;
};

export type PersonalReport = {
  /** 표제 — 한 문장 (따옴표 없이) */
  title: string;
  /** 평생 키워드 3 */
  keywords: ReportKeyword[];
  /** 영역별 본문 (기본 성향 … 성장 에너지와 행동 지침) */
  sections: ReportSection[];
  roadmap: ReportRoadmap;
  /** 면책 한 줄 */
  disclaimer: string;
};

/**
 * 저장/응답 문자열이 구조화 리포트 JSON이면 파싱해 돌려준다.
 * 옛 plain text 리포트나 형식이 안 맞으면 null (호출부에서 텍스트 렌더로 폴백).
 */
export function parsePersonalReport(text: string): PersonalReport | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const obj = JSON.parse(trimmed) as Partial<PersonalReport>;
    if (
      obj &&
      typeof obj.title === "string" &&
      Array.isArray(obj.sections) &&
      obj.roadmap &&
      typeof obj.roadmap === "object"
    ) {
      return {
        title: obj.title,
        keywords: Array.isArray(obj.keywords) ? obj.keywords : [],
        sections: obj.sections as ReportSection[],
        roadmap: obj.roadmap as ReportRoadmap,
        disclaimer: typeof obj.disclaimer === "string" ? obj.disclaimer : "",
      };
    }
  } catch {
    /* 파싱 실패 → 텍스트로 폴백 */
  }
  return null;
}
