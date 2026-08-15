import type { CompatPartner, CompatStore, SajuProfile } from "@/lib/store/types";

/**
 * 궁합 리포트의 선택·기준값 헬퍼.
 *
 * 가족은 선택(familyReportSelection)과 기준 서명(familyReportBasis)을 파일 둘로 나눴지만,
 * 궁합은 ★언제나 나 + 상대 1명★이라 고를 것도 한 명뿐이다. 파일을 쪼개면 각각 열 줄짜리가
 * 되므로 한 파일에 둔다.
 */

/** 궁합에서 고를 수 있는 관계 종류 — 프롬프트의 장면 선택({{relationLabel}})을 좌우한다. */
export const COMPAT_RELATIONS = ["연인", "배우자", "썸", "친구", "동료"] as const;
export type CompatRelation = (typeof COMPAT_RELATIONS)[number];

export function isCompatRelation(value: unknown): value is CompatRelation {
  return typeof value === "string" && (COMPAT_RELATIONS as readonly string[]).includes(value);
}

/**
 * 이번 리포트에 쓸 상대 1명.
 * reportPartnerId가 없거나 이미 지워진 상대를 가리키면 첫 번째 상대로 떨어진다
 * (상대를 지운 직후에도 화면이 빈손이 되지 않게).
 */
export function selectedCompatPartner(compat: CompatStore): CompatPartner | null {
  const partners = compat.partners ?? [];
  if (partners.length === 0) return null;
  const picked = partners.find((p) => p.id === compat.reportPartnerId);
  return picked ?? partners[0];
}

type ProfileBasis = Pick<
  SajuProfile,
  "name" | "birthDate" | "birthTime" | "gender" | "calendar" | "occupation"
>;

type CompatReportBasis = {
  v: 1;
  self: ProfileBasis | null;
  partner: { id: string; relation: string; profile: ProfileBasis } | null;
};

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
 * 궁합 리포트가 어떤 입력값으로 만들어졌는지 비교하기 위한 안정 문자열.
 * 암호학적 서명이 아니라 stale 안내용 fingerprint다(가족과 같은 규약).
 */
export function compatReportBasisSignature(
  self: SajuProfile | null,
  compat: CompatStore,
): string {
  const partner = selectedCompatPartner(compat);
  const basis: CompatReportBasis = {
    v: 1,
    self: self ? profileBasis(self) : null,
    partner: partner
      ? { id: partner.id, relation: clean(partner.relation), profile: profileBasis(partner.profile) }
      : null,
  };
  return JSON.stringify(basis);
}
