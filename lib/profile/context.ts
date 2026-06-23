import type { ChildrenStatus, RelationshipStatus, SajuProfile } from "@/lib/store/types";

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  single: "미혼",
  dating: "연애중",
  married: "기혼",
  divorced_separated: "이혼/별거",
  bereaved: "사별",
  prefer_not_to_say: "말하고 싶지 않음",
};

export const CHILDREN_STATUS_LABELS: Record<ChildrenStatus, string> = {
  none: "없음",
  yes: "있음",
  prefer_not_to_say: "말하고 싶지 않음",
};

export function normalizeRelationshipStatus(value: unknown): RelationshipStatus | undefined {
  return typeof value === "string" && value in RELATIONSHIP_STATUS_LABELS
    ? (value as RelationshipStatus)
    : undefined;
}

export function normalizeChildrenStatus(value: unknown): ChildrenStatus | undefined {
  return typeof value === "string" && value in CHILDREN_STATUS_LABELS
    ? (value as ChildrenStatus)
    : undefined;
}

export function relationshipStatusLabel(value?: RelationshipStatus): string {
  const normalized = normalizeRelationshipStatus(value);
  return normalized ? RELATIONSHIP_STATUS_LABELS[normalized] : "(미입력)";
}

export function childrenStatusLabel(value?: ChildrenStatus): string {
  const normalized = normalizeChildrenStatus(value);
  return normalized ? CHILDREN_STATUS_LABELS[normalized] : "(미입력)";
}

export function occupationLabel(profile: Pick<SajuProfile, "occupation">): string {
  return clean(profile.occupation) || "(미입력)";
}

export function currentConcernLabel(profile: Pick<SajuProfile, "currentConcern" | "note">): string {
  return clean(profile.currentConcern) || clean(profile.note) || "(미입력)";
}

export function profileContextForPrompt(profile: SajuProfile): string {
  return [
    `직업: ${occupationLabel(profile)}`,
    `관계 상태: ${relationshipStatusLabel(profile.relationshipStatus)}`,
    `자녀 여부: ${childrenStatusLabel(profile.childrenStatus)}`,
    `현재 관심/고민: ${currentConcernLabel(profile)}`,
  ].join("\n");
}

export function familyMemberContextForPrompt(profile: SajuProfile): string {
  return `직업: ${occupationLabel(profile)}`;
}

function clean(value?: string): string {
  return value?.trim() ?? "";
}
