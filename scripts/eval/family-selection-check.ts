import assert from "node:assert/strict";
import {
  MAX_FAMILY_REPORT_MEMBERS,
  MAX_FAMILY_REPORT_PEOPLE,
  normalizeFamilyReportMemberIds,
  selectedFamilyReportMembers,
} from "../../lib/saju/familyReportSelection";
import type { FamilyMember, FamilyStore } from "../../lib/store/types";

function member(id: string): FamilyMember {
  return {
    id,
    relation: "가족",
    profile: {
      name: id,
      birthDate: "1990-01-01",
      birthTime: "",
      gender: "female",
      calendar: "solar",
    },
  };
}

const members = [member("a"), member("b"), member("c"), member("d")];

function family(reportMemberIds?: string[]): FamilyStore {
  return reportMemberIds === undefined ? { members } : { members, reportMemberIds };
}

assert.equal(MAX_FAMILY_REPORT_PEOPLE, 4);
assert.equal(MAX_FAMILY_REPORT_MEMBERS, 3);
assert.deepEqual(normalizeFamilyReportMemberIds(family()), ["a", "b", "c"]);
assert.deepEqual(normalizeFamilyReportMemberIds(family([])), []);
assert.deepEqual(normalizeFamilyReportMemberIds(family(["d", "d", "missing", "b", "c", "a"])), ["d", "b", "c"]);
assert.deepEqual(selectedFamilyReportMembers(family(["c", "a"])).map((item) => item.id), ["a", "c"]);

console.log("가족 리포트 선택 제한 검증 통과");
