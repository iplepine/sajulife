import type { FamilyStore, SajuProfile } from "@/lib/store/types";
import { selectedFamilyReportMembers } from "@/lib/saju/familyReportSelection";

type FamilyReportBasis = {
  v: 2;
  self: ProfileBasis | null;
  members: Array<{
    id: string;
    relation: string;
    profile: ProfileBasis;
  }>;
};

type ProfileBasis = Pick<
  SajuProfile,
  "name" | "birthDate" | "birthTime" | "gender" | "calendar" | "occupation"
>;

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function profileBasis(profile: SajuProfile): ProfileBasis {
  return {
    name: clean(profile.name),
    birthDate: clean(profile.birthDate),
    birthTime: clean(profile.birthTime),
    gender: profile.gender,
    calendar: profile.calendar,
    occupation: clean(profile.occupation),
  };
}

/**
 * 가족 리포트가 어떤 입력값으로 만들어졌는지 비교하기 위한 안정 문자열.
 * 암호학적 서명이 아니라 stale 안내용 fingerprint다.
 */
export function familyReportBasisSignature(
  self: SajuProfile | null,
  family: FamilyStore,
): string {
  const basis: FamilyReportBasis = {
    v: 2,
    self: self ? profileBasis(self) : null,
    members: selectedFamilyReportMembers(family).map((m) => ({
      id: m.id,
      relation: clean(m.relation),
      profile: profileBasis(m.profile),
    })),
  };
  return JSON.stringify(basis);
}
