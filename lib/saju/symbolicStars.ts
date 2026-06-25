/**
 * 대표 신살/귀인 태그.
 *
 * 화면 표에서 빠르게 읽히는 힌트용이다. 해석 본문처럼 모든 신살을 다루지 않고,
 * 일간 기준 귀인과 일지 기준 대표 신살만 노출한다.
 */

export type SymbolicStar = {
  name: string;
  kind: "귀인" | "신살";
};

const NOBLE_BRANCHES_BY_DAY_STEM: Record<string, string[]> = {
  甲: ["丑", "未"],
  戊: ["丑", "未"],
  庚: ["丑", "未"],
  乙: ["子", "申"],
  己: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  壬: ["卯", "巳"],
  癸: ["卯", "巳"],
  辛: ["午", "寅"],
};

const MUNCHANG_BRANCH_BY_DAY_STEM: Record<string, string> = {
  甲: "巳",
  乙: "午",
  丙: "申",
  戊: "申",
  丁: "酉",
  己: "酉",
  庚: "亥",
  辛: "子",
  壬: "寅",
  癸: "卯",
};

const TRIAD_GROUPS = [
  { members: ["申", "子", "辰"], stars: { 겁살: "巳", 재살: "午", 천살: "未", 지살: "申", 도화: "酉", 월살: "戌", 망신살: "亥", 장성: "子", 반안살: "丑", 역마: "寅", 육해살: "卯", 화개: "辰" } },
  { members: ["寅", "午", "戌"], stars: { 겁살: "亥", 재살: "子", 천살: "丑", 지살: "寅", 도화: "卯", 월살: "辰", 망신살: "巳", 장성: "午", 반안살: "未", 역마: "申", 육해살: "酉", 화개: "戌" } },
  { members: ["巳", "酉", "丑"], stars: { 겁살: "寅", 재살: "卯", 천살: "辰", 지살: "巳", 도화: "午", 월살: "未", 망신살: "申", 장성: "酉", 반안살: "戌", 역마: "亥", 육해살: "子", 화개: "丑" } },
  { members: ["亥", "卯", "未"], stars: { 겁살: "申", 재살: "酉", 천살: "戌", 지살: "亥", 도화: "子", 월살: "丑", 망신살: "寅", 장성: "卯", 반안살: "辰", 역마: "巳", 육해살: "午", 화개: "未" } },
] as const;

const PRIORITY: Record<string, number> = {
  천을귀인: 1,
  문창귀인: 2,
  도화: 3,
  역마: 4,
  화개: 5,
  장성: 6,
  겁살: 7,
  재살: 8,
  천살: 9,
};

export function listSymbolicStarsForBranch({
  dayStem,
  dayBranch,
  branch,
}: {
  dayStem: string;
  dayBranch: string;
  branch: string;
}): SymbolicStar[] {
  const out: SymbolicStar[] = [];
  if ((NOBLE_BRANCHES_BY_DAY_STEM[dayStem] ?? []).includes(branch)) {
    out.push({ name: "천을귀인", kind: "귀인" });
  }
  if (MUNCHANG_BRANCH_BY_DAY_STEM[dayStem] === branch) {
    out.push({ name: "문창귀인", kind: "귀인" });
  }

  const group = TRIAD_GROUPS.find((g) => g.members.includes(dayBranch as never));
  if (group) {
    for (const [name, starBranch] of Object.entries(group.stars)) {
      if (starBranch === branch) out.push({ name, kind: "신살" });
    }
  }

  return out.sort((a, b) => (PRIORITY[a.name] ?? 99) - (PRIORITY[b.name] ?? 99));
}
