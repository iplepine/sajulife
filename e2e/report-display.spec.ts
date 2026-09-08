import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE, mockJson } from "./fixtures/audit/session";

/**
 * 저장 풀이 표시 — 현재 JSON / 옛 JSON / 옛 텍스트 세 가지를 열었을 때
 * ★영문 내부 필드명이 화면에 보이지 않아야 한다.★ 단위 테스트는 lib/report/normalize.test.ts.
 */

const INTERNAL_NAMES = [
  "roadmap", "actionPlan", "resourceInput", "resourceOutput",
  "riskShadow", "riskTool", "direction", "character",
];

const CURRENT_JSON = JSON.stringify({
  title: "버티는 힘으로 판을 뒤집는 사람",
  keywords: [],
  sections: [{ id: "기본성향", summary: "한 문장 요약", body: "● 핵심: 본문 한 줄" }],
  roadmap: {
    character: "느리게 데워지는 가마솥", resourceInput: "혼자 정리하는 시간",
    resourceOutput: "정리한 걸 풀어내는 일", riskShadow: "혼자 떠안는 버릇",
    riskTool: "주 1회 상황 공유", direction: "내 이름으로 굴리는 판",
  },
  disclaimer: "참고용이야.",
});

/** sections가 맵인 옛 저장본 — 현재 파서가 못 알아보던 형식. */
const LEGACY_JSON = JSON.stringify({
  title: "옛 저장본",
  sections: { 기본성향: { summary: "요약", body: "본문 첫 줄\n본문 둘째 줄" } },
  roadmap: { character: "옛 캐릭터", resourceInput: "옛 인풋" },
  actionPlan: [{ title: "오늘 할 것", timeframe: "오늘" }],
});

const LEGACY_TEXT = "▣ 1. [기본성향] 한 문장 요약\n● 핵심: 본문 한 줄\n\n▣ 2. [직업운] 또 한 문장\n• 세부 항목";

function savedWith(report: string) {
  return { saved: { report, generatedAt: "2026-09-01T00:00:00.000Z", provider: "openai", model: "test" }, status: "idle" };
}

// 준비된 게스트 세션으로 보호 화면에 들어간다(e2e/guest.setup.ts).
test.use({ storageState: GUEST_STATE_FILE });

test.describe("저장 풀이 표시", () => {
  for (const [label, report] of [
    ["현재 JSON", CURRENT_JSON],
    ["옛 JSON", LEGACY_JSON],
    ["옛 텍스트", LEGACY_TEXT],
  ] as const) {
    test(`${label} 저장본에 내부 필드명이 노출되지 않는다`, async ({ page }) => {
      await mockJson(page, "**/api/saju/personal", savedWith(report));
      await page.goto("/saju");
      await expect(page.locator(".rv, .report").first()).toBeVisible();

      const body = await page.locator("main, .page").first().innerText();
      for (const name of INTERNAL_NAMES) {
        expect(body, `${name} 가 화면에 보입니다`).not.toContain(name);
      }
      // 내용이 통째로 사라지지도 않아야 한다.
      expect(body.trim().length).toBeGreaterThan(20);
    });
  }

  test("로드맵 항목은 한국어 이름이 붙은 별도 문단으로 보인다", async ({ page }) => {
    await mockJson(page, "**/api/saju/personal", savedWith(CURRENT_JSON));
    await page.goto("/saju");
    await page.getByText("한눈에 보는 흐름").first().click();
    await expect(page.getByText("나를 설명하는 한마디")).toBeVisible();
    await expect(page.getByText("느리게 데워지는 가마솥")).toBeVisible();
  });

  test("저장본을 여는 것만으로 새 생성 요청이 나가지 않는다", async ({ page }) => {
    let posts = 0;
    await page.route("**/api/saju/personal", async (route) => {
      if (route.request().method() === "POST") {
        posts += 1;
        return route.fulfill({ status: 202, body: "{}" });
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(savedWith(CURRENT_JSON)) });
    });
    await page.goto("/saju");
    await expect(page.locator(".rv").first()).toBeVisible();
    expect(posts, "저장본 조회만으로 생성이 시작됐습니다").toBe(0);
  });
});
