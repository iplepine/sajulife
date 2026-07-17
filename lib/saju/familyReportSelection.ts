import type { FamilyMember, FamilyStore } from "@/lib/store/types";

/** 가족 리포트에 본인을 포함해 표시할 수 있는 최대 인원. */
export const MAX_FAMILY_REPORT_PEOPLE = 4;
/** 본인을 제외하고 가족 리포트에 선택할 수 있는 최대 인원. */
export const MAX_FAMILY_REPORT_MEMBERS = MAX_FAMILY_REPORT_PEOPLE - 1;

/**
 * 저장된 선택값을 현재 가족 목록에 맞게 정리한다.
 * 이전 저장본(reportMemberIds 없음)은 첫 3명을 기본 선택해 기존 사용자가 바로 리포트를 볼 수 있게 한다.
 */
export function normalizeFamilyReportMemberIds(family: FamilyStore): string[] {
  const availableIds = new Set(family.members.map((member) => member.id));
  const requestedIds = family.reportMemberIds ?? family.members.map((member) => member.id);
  const seen = new Set<string>();
  const selected: string[] = [];

  for (const id of requestedIds) {
    if (!availableIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    selected.push(id);
    if (selected.length === MAX_FAMILY_REPORT_MEMBERS) break;
  }

  return selected;
}

/** 가족 리포트·관계도·공유에 공통으로 사용할 선택된 추가 가족 목록. */
export function selectedFamilyReportMembers(family: FamilyStore): FamilyMember[] {
  const selectedIds = new Set(normalizeFamilyReportMemberIds(family));
  return family.members.filter((member) => selectedIds.has(member.id));
}
