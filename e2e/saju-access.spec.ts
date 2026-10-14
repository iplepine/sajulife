import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE, failRoute, mockJson, mockPackage } from "./fixtures/audit/session";

test.use({ storageState: GUEST_STATE_FILE });

test("실제 무료 베타 상태는 구매 기록 없이 생성 버튼을 열어준다", async ({ page }) => {
  const response = await page.request.get("/api/package");
  expect(response.ok()).toBe(true);
  const info = await response.json();
  test.skip(info.payment !== "free", "무료 베타 환경에서만 검사한다");
  expect(info.state.entitled).toBe(true);
  await mockJson(page, "**/api/saju/personal", { saved: null, status: "idle" });
  await page.goto("/saju");
  await expect(page.getByRole("button", { name: "내 사주 풀이 만들기" })).toBeVisible();
  await expect(page.getByRole("region", { name: "사주+기질 풀이 안내" })).toHaveCount(0);
});

for (const payment of ["free", "portone"] as const) {
  test(`사주 생성 권한 없음 — ${payment} 시작 안내`, async ({ page }) => {
    await mockPackage(page, { entitled: false }, payment);
    await mockJson(page, "**/api/saju/personal", { saved: null, status: "idle" });
    await page.goto("/saju");
    const offer = page.getByRole("region", { name: "사주+기질 풀이 안내" });
    await expect(offer).toBeVisible();
    const link = offer.getByRole("link");
    await expect(link).toHaveAttribute("href", "/checkout");
    await expect(link).toContainText(payment === "free" ? "무료로 시작하기" : "결제하고 시작하기");
    await expect(page.getByRole("button", { name: "내 사주 풀이 만들기" })).toHaveCount(0);
  });
}

test("권한 조회 실패를 결제 전이나 생성 가능 상태로 취급하지 않는다", async ({ page }) => {
  await failRoute(page, "**/api/package", "server");
  await mockJson(page, "**/api/saju/personal", { saved: null, status: "idle" });
  await page.goto("/saju");
  await expect(page.locator("section[role=alert]")).toContainText("이미 결제했다면 다시 결제하지 말고");
  await expect(page.getByRole("button", { name: "상태 다시 확인하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "내 사주 풀이 만들기" })).toHaveCount(0);
});

test("생성 시 402가 오면 일반 AI 오류 대신 시작 안내로 복구한다", async ({ page }) => {
  await mockPackage(page, { entitled: true });
  let posts = 0;
  await page.route("**/api/saju/personal", async (route) => {
    if (route.request().method() === "POST") {
      posts += 1;
      return route.fulfill({ status: 402, json: { error: "사주+기질 풀이를 열면 사주 풀이를 만들 수 있어요.", code: "PACKAGE_REQUIRED" } });
    }
    return route.fulfill({ json: { saved: null, status: "idle" } });
  });
  await page.goto("/saju");
  await page.getByRole("button", { name: "내 사주 풀이 만들기" }).click();
  await expect(page.getByRole("link", { name: "무료로 시작하기", exact: false })).toBeVisible();
  await expect(page.getByText("응답 생성에 실패했어요", { exact: false })).toHaveCount(0);
  expect(posts).toBe(1);
});
