import type { Gender, SajuProfile } from "@/lib/store/types";

/**
 * 입력 중인 프로필 — ★성별은 사용자가 직접 고르기 전까지 비어 있다.★
 *
 * 예전엔 폼이 "여성"을 미리 선택한 채로 열렸다. 성별은 대운(10년 흐름)의 방향과 시작 나이를
 * 정하기 때문에(lib/saju/calculator.ts computeDaewoon), 못 보고 넘긴 남성은 10년 흐름·계절 테마·
 * 타이밍·모든 풀이가 뒤집힌 기준으로 계산됐다. 기본값이 곧 데이터가 되는 자리에는 기본값을 두지 않는다.
 */
export type ProfileDraft = Omit<SajuProfile, "gender"> & { gender: Gender | "" };

export const GENDER_REQUIRED_MESSAGE = "성별을 선택하세요.";
