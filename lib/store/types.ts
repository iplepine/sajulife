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

export type PromptKey = "tci-report" | "personal-saju" | "family-saju" | "tci-saju-fusion";

export type PromptConfig = {
  template: string;
  temperature: number;
  updatedAt: string;
};

export type PromptsStore = Record<PromptKey, PromptConfig>;
