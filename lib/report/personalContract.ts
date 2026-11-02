/** New personal reports use this order. Stored legacy reports remain readable. */
export const PERSONAL_REPORT_SECTION_IDS = [
  "타고난 기질과 성격",
  "강점과 잠재력",
  "인생의 큰 흐름",
  "조후 분석",
  "격국 분석",
  "억부 분석",
  "세운 분석",
  "필요한 것",
  "행동지침",
  "인생 로드맵",
  "성공 조언",
] as const;

export type PersonalReportSectionId = (typeof PERSONAL_REPORT_SECTION_IDS)[number];
