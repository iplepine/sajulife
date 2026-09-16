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

/**
 * 신살·귀인 이름의 일상어 풀이 — 사주팔자 칸의 배지 옆 범례에 쓴다.
 *
 * ★겁주지 않는다★(CLAUDE.md). "망신살"처럼 이름만 보면 무서운 것도 무엇을 조심하면 되는지까지
 * 한 줄로 닫는다. 이름만 던져두면 처음 보는 사람에겐 흉한 판정으로 읽힌다.
 */
export const SYMBOLIC_STAR_MEANINGS: Record<string, string> = {
  천을귀인: "막힐 때 도와줄 사람이 나타나는 자리",
  문창귀인: "공부·글·표현이 잘 풀리는 자리",
  도화: "사람을 끄는 매력이 도는 자리",
  역마: "이동·변화가 잦은 자리",
  화개: "혼자 깊이 파고드는 몰입의 자리",
  장성: "앞에 나서서 이끄는 힘",
  반안살: "자리를 잡고 안정을 찾아가는 힘",
  지살: "새로 시작하고 터를 옮기는 기운",
  망신살: "체면이 흔들리기 쉬운 자리 — 말·행동을 한 번 더 살피면 돼",
  겁살: "급하게 잃기 쉬운 자리 — 서두르지 않으면 돼",
  재살: "부딪히고 갇히기 쉬운 자리 — 무리한 싸움만 피하면 돼",
  천살: "내 힘으로 어쩔 수 없는 일이 오는 자리 — 받아들이고 기다리는 힘",
  월살: "일이 더디게 풀리는 자리 — 속도를 늦추면 돼",
  육해살: "몸·마음이 쉽게 지치는 자리 — 쉬는 리듬을 챙기면 돼",
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
