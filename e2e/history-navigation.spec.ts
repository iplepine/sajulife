import { expect, test } from "@playwright/test";
import { SKIP_REASON, hasCredentials, mockJson, noteSkip, signIn } from "./fixtures/audit/session";

/**
 * 저장한 액션·지난 상담으로 ★다시 찾아갈 수 있는지★.
 * 홈 → 마이 → 저장한 액션·지난 상담, 두 번의 선택으로 도달해야 한다.
 */

const ACTION = {
  id: "a_audit_1",
  title: "가상 액션 — 오늘 10분 정리",
  timeframe: "오늘",
  source: "personal",
  sourceLabel: "개인 사주",
  done: false,
  createdAt: "2026-09-01T00:00:00.000Z",
};

test.describe("액션·상담 기록 진입로", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasCredentials) noteSkip(testInfo, SKIP_REASON);
    test.skip(!hasCredentials, SKIP_REASON);
    await signIn(page);
  });

  test("마이에 항상 보이는 고정 링크로 기록에 도달한다", async ({ page }) => {
    await page.goto("/account");
    const link = page.getByRole("link", { name: "액션·상담 기록 보기" });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL("**/history");
    await expect(page.getByRole("heading", { name: "용신상담과 액션" })).toBeVisible();
  });

  test("기록이 0건이어도 진입로는 남는다", async ({ page }) => {
    await mockJson(page, "**/api/coaching", { items: [] });
    await mockJson(page, "**/api/consult", { history: [], hasProfile: true });
    await page.goto("/account");
    await expect(page.getByRole("link", { name: "액션·상담 기록 보기" })).toBeVisible();
    await page.goto("/history");
    await expect(page.getByText("진행 중인 액션이 없어요")).toBeVisible();
  });

  test("풀이 기록 화면에서도 액션·상담으로 갈 수 있다 — 이름을 섞지 않는다", async ({ page }) => {
    await page.goto("/materials");
    await expect(page.getByRole("heading", { name: "풀이 기록" })).toBeVisible();
    const link = page.getByRole("link", { name: "액션·상담 기록으로 →" });
    await expect(link).toHaveAttribute("href", "/history");
  });

  test("액션을 저장한 뒤 홈을 거쳐 새로고침해도 다시 찾을 수 있다", async ({ page }) => {
    await mockJson(page, "**/api/coaching", { items: [ACTION] });
    await page.goto("/history");
    await expect(page.getByText(ACTION.title)).toBeVisible();

    await page.goto("/dashboard");
    await page.goto("/account");
    await page.getByRole("link", { name: "액션·상담 기록 보기" }).click();
    await page.waitForURL("**/history");
    await page.reload();
    await expect(page.getByText(ACTION.title)).toBeVisible();
  });

  test("완료 표시는 그 액션만 바꾼다", async ({ page }) => {
    const other = { ...ACTION, id: "a_audit_2", title: "가상 액션 — 다른 인물 것" };
    await mockJson(page, "**/api/coaching", { items: [ACTION, other] });
    await page.route("**/api/coaching/a_audit_1", async (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ item: { ...ACTION, done: true } }) });
    });

    await page.goto("/history");
    await page.getByRole("checkbox").first().check();
    await expect(page.getByText("완료한 액션 1개")).toBeVisible();
    await expect(page.getByText(other.title)).toBeVisible();
  });
});
