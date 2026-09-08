import { expect, test } from "@playwright/test";
import { SKIP_REASON, failRoute, hasCredentials, mockJson, noteSkip, signIn } from "./fixtures/audit/session";

/**
 * 홈의 큰 버튼 — 신규 / 프로필만 있음 / 저장본 있음 / 생성 중 / 조회 실패.
 * ★프로필 있음과 풀이 있음은 다른 상태★다.
 */

test.describe("홈 상태별 버튼", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasCredentials) noteSkip(testInfo, SKIP_REASON);
    test.skip(!hasCredentials, SKIP_REASON);
    await signIn(page);
  });

  test("저장본이 있으면 한 번 눌러 바로 풀이를 읽는다", async ({ page }) => {
    await mockJson(page, "**/api/saju/personal", {
      saved: { report: "{}", generatedAt: "2026-09-01T00:00:00.000Z" },
      status: "idle",
    });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("내 풀이 이어 보기");
    await expect(cta).toHaveAttribute("href", "/saju");
  });

  test("프로필만 있고 저장본이 없으면 분석 시작으로 보낸다", async ({ page }) => {
    await mockJson(page, "**/api/saju/personal", { saved: null, status: "idle" });
    await page.goto("/dashboard");
    await expect(page.locator(".life-path-cta")).toContainText("내 사주 분석 시작하기");
  });

  test("생성 중이면 진행 확인으로 보내고 새 생성을 권하지 않는다", async ({ page }) => {
    await mockJson(page, "**/api/saju/personal", { saved: null, status: "generating" });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("생성 진행 확인하기");
    await expect(cta).toHaveAttribute("href", "/saju");
  });

  test("조회가 실패해도 '저장본 없음'으로 단정하지 않는다", async ({ page }) => {
    await failRoute(page, "**/api/saju/personal", "server");
    await page.goto("/dashboard");
    const hero = page.locator(".life-path-hero-copy");
    await expect(hero).toContainText("불러오지 못했");
    await expect(hero).not.toContainText("내 사주 분석 시작하기");
  });

  test("로딩이 끝난 뒤 버튼이 한 번 더 바뀌지 않는다", async ({ page }) => {
    await mockJson(page, "**/api/saju/personal", {
      saved: { report: "{}", generatedAt: "2026-09-01T00:00:00.000Z" },
      status: "idle",
    });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("내 풀이 이어 보기");
    const first = await cta.innerText();
    await page.waitForTimeout(1200);
    expect(await cta.innerText(), "본문이 나온 뒤 버튼이 다시 바뀌었습니다").toBe(first);
  });

  test("홈을 여는 것만으로 생성 요청이 나가지 않는다", async ({ page }) => {
    let posts = 0;
    await page.route(/\/api\/(saju\/personal|tci\/report|fusion\/report)$/, async (route) => {
      if (route.request().method() === "POST") { posts += 1; return route.fulfill({ status: 202, body: "{}" }); }
      await route.fallback();
    });
    await page.goto("/dashboard");
    await expect(page.locator(".life-path-cta")).toBeVisible();
    expect(posts, "홈 방문만으로 생성이 시작됐습니다").toBe(0);
  });
});
