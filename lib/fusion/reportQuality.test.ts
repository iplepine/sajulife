import assert from "node:assert/strict";
import test from "node:test";
import { FUSION_ACTION_CATEGORIES, ACTION_TIMEFRAMES } from "@/lib/report/actions";
import type { SuggestedAction } from "@/lib/store/types";
import { FUSION_SECTION_TITLES, MIN_BODY_CHARS_NO_SPACE, validateFusionReportQuality } from "./reportQuality";

const actions: SuggestedAction[] = FUSION_ACTION_CATEGORIES.map((category, i) => ({
  title: `행동 ${i + 1}`,
  timeframe: ACTION_TIMEFRAMES[i],
  category,
  trigger: "발동",
  exactAction: "행동",
  timeLimit: "10분",
  doneCriteria: "완료",
  artifact: "기록",
  blockedLoop: "루프",
})) as SuggestedAction[];

/** 섹션마다 빈 줄·불릿으로 끊은 본문을 하한보다 조금 넉넉하게 만든다. */
function reportWith(titles: readonly string[], extra = ""): string {
  const perSection = Math.ceil((MIN_BODY_CHARS_NO_SPACE + 400) / titles.length);
  const filler = "• 회의에서먼저치고나갈자리를세번재다가타이밍을넘기는장면이반복돼";
  return titles
    .map((title) => {
      let body = "";
      while (body.replace(/\s/g, "").length < perSection) body += `${filler}\n\n`;
      return `${title}\n${body}${extra}`;
    })
    .join("\n");
}

test("올해 운세 여덟 섹션이면 통과한다", () => {
  assert.equal(FUSION_SECTION_TITLES.length, 8);
  const result = validateFusionReportQuality({ report: reportWith(FUSION_SECTION_TITLES), actions, flexibility: 55 });
  assert.deepEqual(result.errors, []);
});

test("옛 아홉 섹션 구조는 리페어 대상", () => {
  const old = [
    "▣ 먼저 결론: 네 반복 패턴 한눈에 보기",
    "▣ 타고난 결과 길러진 결: 겹치는 곳과 어긋나는 곳",
    "▣ 잘 풀릴 때: 네 리듬이 탄력받는 순간",
    "▣ 꼬일 때: 평소 반응이 엇나가는 순간",
    "▣ 자꾸 반복되는 장면: 일·돈·관계에서 같은 패턴이 도는 이유",
    "▣ 숨은 강점과 사각지대: 둘을 겹쳐야 보이는 것",
    "▣ 갈림길 사용법: 밀어붙일 때와 멈춰야 할 때",
    "▣ 앞으로 6~12개월: 기회와 삐끗할 지점 미리보기",
    "▣ 오늘부터 바꿀 세 가지",
  ];
  const result = validateFusionReportQuality({ report: reportWith(old), actions, flexibility: 55 });
  assert.ok(result.errors.some((e) => e.startsWith("섹션 수")));
});

test("용신·기신은 리페어, 대운·세운은 경고만 — 한 단어로 유료 풀이를 실패시키지 않는다", () => {
  const jargon = validateFusionReportQuality({ report: reportWith(FUSION_SECTION_TITLES, "올해는 용신이 들어와"), actions, flexibility: 55 });
  assert.ok(jargon.errors.includes("명리 판정어(용신·기신) 노출"));

  const soft = validateFusionReportQuality({ report: reportWith(FUSION_SECTION_TITLES, "올해 세운은 이래"), actions, flexibility: 55 });
  assert.deepEqual(soft.errors, []);
  assert.ok(soft.warnings.includes("명리 용어 노출(생활어 권장)"));
});
