export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";
export type RelationshipStatus =
  | "single"
  | "dating"
  | "married"
  | "divorced_separated"
  | "bereaved"
  | "prefer_not_to_say";
export type ChildrenStatus = "none" | "yes" | "prefer_not_to_say";

export type SajuProfile = {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: Gender;
  calendar: CalendarType;
  occupation?: string;
  relationshipStatus?: RelationshipStatus;
  childrenStatus?: ChildrenStatus;
  currentConcern?: string;
  note?: string;
};

/**
 * TCI 검사 종류.
 * - "short": 자체 제작 35문항 약식판 (5문항 × 7차원).
 * - "full":  마음사랑 TCI-RS 140문항 정식판 (라이선스 별도).
 *
 * 한 사용자는 두 종류 다 풀어둘 수 있다 — 각각 별도 키에 저장.
 */
export type TciVariant = "short" | "full";

export type TciAnswers = {
  variant: TciVariant;
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
  | "consult"
  | "consult-basis";

export type PromptConfig = {
  template: string;
  temperature: number;
  updatedAt: string;
  /**
   * 프롬프트 내용의 호환성 버전. defaults.ts가 source of truth이며,
   * KV에 저장된 옛 프롬프트가 더 낮은(혹은 없는) 버전이면 default가 우선한다.
   * 내용을 의미 있게 고쳐 옛 KV 값을 강제로 밀어내야 할 때만 올린다.
   * 생략 = 0 (레거시).
   */
  version?: number;
};

export type PromptsStore = Record<PromptKey, PromptConfig>;

/**
 * 한 사용자가 받은 4종 리포트.
 * 동일 종류를 다시 생성하면 덮어쓴다. (히스토리 미보관)
 */
export type ReportKind = "tci" | "personal" | "family" | "fusion";

/**
 * 리포트 생성 시 AI가 본문과 함께 내보내는 코칭 액션 후보(아직 미등록).
 * 개인·가족은 responseSchema의 actionPlan 필드로, 기질·융합·상담은 본문 끝
 * "ACTIONS=[...]" 트레일러 한 줄로 받아 서버에서 떼어내 정규화한다.
 */
export type SuggestedAction = {
  /** 한 문장 행동 (반말 명령형, 구체·측정 가능) */
  title: string;
  /** 시점 라벨 — "오늘" | "이번 주" | "이번 달" */
  timeframe: string;
  /** 무엇을·왜 보강하는지 짧은 한 줄 (선택) */
  hint?: string;
};

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
  /** 이 리포트와 함께 받은 코칭 액션 후보 (없을 수 있음 — 옛 저장본). */
  actions?: SuggestedAction[];
};

/**
 * 상담 근거 — 한 종류 리포트를 압축한 요약 1건.
 * 리포트가 생성/갱신될 때마다 AI가 요약해 채운다. 상담 AI가 읽을 내부 메모이며
 * 사용자에게 직접 노출되지 않는다.
 */
export type ConsultBasisSection = {
  kind: ReportKind;
  /** 리포트를 압축한 불릿 메모 (plain text). */
  summary: string;
  /** 요약의 원본 리포트 generatedAt — staleness(원본이 더 새것인지) 판단용. */
  sourceGeneratedAt: string;
  /** 요약을 생성한 시각. */
  updatedAt: string;
  /** 요약에 쓴 모델 (디버그용). */
  model: string;
};

/**
 * 사용자별 상담 근거 모음 — 리포트 종류별 요약 1건씩.
 * 상담 시 존재하는 섹션을 모두 합쳐 컨텍스트로 보낸다 (근거 선택 없이).
 */
export type ConsultBasisDoc = {
  sections: Partial<Record<ReportKind, ConsultBasisSection>>;
  updatedAt: string;
};

/**
 * 저장된 단건 상담 리포트.
 * 사용자가 보낸 질문 1개에 대한 AI 응답 1개의 스냅샷.
 * 리스트로 KV에 보관해 히스토리를 제공한다 (최신순).
 */
export type SavedConsult = {
  id: string;
  question: string;
  /** 답변에 근거로 쓰인 리포트 종류들. 상담 생성에는 리포트 근거가 1개 이상 필요하다. */
  sources: ReportKind[];
  /** 히스토리·상세에 노출되는 근거 라벨 (예: "융합·개인 사주 리포트 근거"). */
  basisLabel: string;
  answer: string;
  generatedAt: string;
  provider: string;
  model: string;
  /** 이 상담과 함께 받은 코칭 액션 후보 (없을 수 있음 — 옛 저장본). */
  actions?: SuggestedAction[];
};

/** 히스토리 리스트에 노출되는 요약 (본문 제외). */
export type ConsultSummary = Pick<
  SavedConsult,
  "id" | "question" | "basisLabel" | "generatedAt"
>;

/** 액션 아이템의 출처 — 어느 리포트에서 왔는지(또는 직접 추가). */
export type ActionSource = ReportKind | "consult" | "manual";

/**
 * 코칭 액션 플랜에 등록된 액션 아이템(추적 대상).
 * 리포트의 SuggestedAction을 사용자가 "등록"하거나 직접 추가하면 만들어진다.
 * user:{userId}:actions에 배열로 보관(최신순).
 */
export type ActionItem = {
  id: string;
  title: string;
  /** 시점 라벨 — "오늘" | "이번 주" | "이번 달" | "" (직접 추가 시 미선택 가능) */
  timeframe: string;
  hint?: string;
  source: ActionSource;
  /** 화면 표시용 출처 라벨 — 예: "개인 사주", "AI 상담", "직접 추가" */
  sourceLabel: string;
  done: boolean;
  createdAt: string;
  doneAt?: string;
};
