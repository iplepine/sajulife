import assert from "node:assert/strict";
import test from "node:test";
import { integratedReadingContent } from "./readingContent";
import { FUSION_SECTION_TITLES } from "./reportContract";

test("old standalone introductions are omitted while combined interpretation stays verbatim", () => {
  const combined = "▣ 원래의 너와 요즘의 너: 겹치는 곳과 어긋나는 곳\n\n서로 다른 근거를 함께 읽은 본문.\n";
  const text = `▣ 먼저 결론: 올해 너는 이런 한 해야\n\n요약.\n▣ 원래의 너: 사주로 타고난 결\n\n단독 사주.\n▣ 요즘의 너: 기질 검사로 본 지금 상태\n\n단독 검사.\n${combined}`;
  const result = integratedReadingContent(text);
  assert.ok(result.includes(combined));
  assert.ok(result.includes("요약."));
  assert.ok(!result.includes("단독 사주."));
  assert.ok(!result.includes("단독 검사."));
});

test("current eight areas and unknown formats stay unchanged", () => {
  for (const text of [FUSION_SECTION_TITLES.map(h => `${h}\n본문`).join("\n\n"), "원래의 너: 사주로 타고난 결\n일반 본문", "▣ 원래의 너: 사주로 타고난 결\n소개만 있는 저장본"]) {
    assert.equal(integratedReadingContent(text), text);
  }
});
