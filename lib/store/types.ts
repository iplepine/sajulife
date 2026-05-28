export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";

export type SajuProfile = {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: Gender;
  calendar: CalendarType;
  note?: string;
};

export type TciAnswers = {
  answers: Record<string, number>;
  updatedAt: string;
};

export type FamilyMember = {
  id: string;
  relation: string;
  profile: SajuProfile;
};

export type FamilyStore = {
  members: FamilyMember[];
};

export type PromptKey =
  | "tci-report"
  | "personal-saju"
  | "family-saju"
  | "tci-saju-fusion"
  | "consult";

export type PromptConfig = {
  template: string;
  temperature: number;
  updatedAt: string;
};

export type PromptsStore = Record<PromptKey, PromptConfig>;

/**
 * 한 사용자가 받은 4종 리포트.
 * 동일 종류를 다시 생성하면 덮어쓴다. (히스토리 미보관)
 */
export type ReportKind = "tci" | "personal" | "family" | "fusion";

/**
 * KV에 저장되는 리포트 결과.
 * meta는 종류별로 다르며 (TCI 점수 / 사주 결과 등) 페이지에서 재렌더에 사용한다.
 */
export type SavedReport = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: unknown;
};

/** 상담 베이스 — 어떤 정보를 근거로 답할지. */
export type ConsultBasis = "tci" | "saju" | "fusion" | "family";
