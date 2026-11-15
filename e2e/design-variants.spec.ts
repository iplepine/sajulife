import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE, mockPackage, mockJson } from "./fixtures/audit/session";

test.describe("실제 서비스 A / 캐릭터 중심 B", () => {
  test.use({ storageState: GUEST_STATE_FILE });

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) {
        return route.fulfill({ status: 403, json: { error: "디자인 검증에서는 저장하지 않아요." } });
      }
      return route.fallback();
    });
    await mockPackage(page, { entitled: false, hasProfile: false });
    await mockJson(page, "**/api/profile", { profile: null });
    await mockJson(page, "**/api/people", { people: [], activeId: null });
  });

  test("A는 기존 초상 홈이고 B는 캐릭터 홈으로 명시적으로 전환한다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard?design=a");
    await expect(page.locator("[data-home-portrait]")).toBeVisible();
    await expect(page.locator(".design-b")).toHaveCount(0);
    await expect(page.locator(".home-fusion-cta")).toHaveText(/사주와 기질, 한 번에 보기/);

    await page.goto("/dashboard?design=b");
    await expect(page.locator(".design-b [data-home-character]")).toBeVisible();
    await expect(page.locator("[data-home-portrait]")).toHaveCount(0);
    await expect(page.locator(".home-fusion-cta")).toHaveAttribute("href", "/explore/fusion");
    await expect(page.locator(".home-fusion-cta")).toHaveText(/사주와 기질, 함께 보기/);
    const image = page.locator(".b-home-art img");
    await expect.poll(() => image.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);
    expect(await page.locator(".home-fusion-cta").evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThan(760);

    await page.getByRole("link", { name: /사주와 기질, 함께 보기/ }).click();
    await expect(page).toHaveURL(/\/explore\/fusion/);
    await expect(page.locator(".design-b [data-character-guide]")).toBeVisible();
    await page.reload();
    await expect(page.locator(".design-b [data-character-guide]")).toBeVisible();

    await page.goto("/dashboard?design=a");
    await expect(page.locator("[data-home-portrait]")).toBeVisible();
    await page.goto("/explore/fusion");
    await expect(page.locator(".design-b")).toHaveCount(0);
    await expect(page.locator("[data-character-guide]")).toHaveCount(0);
  });

  test("B도 실제 진행 상태와 조회 실패를 같은 경로로 처리한다", async ({ page }) => {
    await mockPackage(page, { entitled: true, hasProfile: true, personal: { saved: true, status: "idle" }, tci: { complete: false, answered: 12, total: 35 } });
    await page.goto("/dashboard?design=b");
    await expect(page.locator(".home-fusion-cta")).toHaveText(/기질 검사 이어서 하기/);
    await expect(page.locator(".home-fusion-cta")).toHaveAttribute("href", "/tci?variant=short&next=fusion");
    await expect(page.locator(".home-package-step-link[href='/saju']")).toBeVisible();
    await expect(page.locator(".home-package-price")).toHaveCount(0);

    await mockJson(page, "**/api/package", { error: "불러오기 실패" }, 500);
    await page.reload();
    const retry = page.getByRole("button", { name: /다시 불러오기/ });
    await expect(retry).toBeVisible();
    await expect(page.locator(".home-package")).toHaveCount(0);
    await mockPackage(page, { entitled: true, hasProfile: true, personal: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 }, fusion: { saved: true, status: "idle" } });
    await retry.click();
    await expect(page.locator(".home-fusion-cta")).toHaveText(/내 최종 통합 풀이 보기/);
    await expect(page.locator(".home-fusion-cta")).toHaveAttribute("href", "/fusion");
  });
});

test.describe("로그인 전 고정 화면", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("B 선호가 있어도 흰 바탕 검정 궁서 랜딩은 A와 동일하다", async ({ page }) => {
    const read = () => page.locator(".ink-landing").evaluate((el) => {
      const title = el.querySelector(".ink-landing-title")!;
      const cta = el.querySelector(".ink-landing-cta")!;
      return { text: title.textContent, background: getComputedStyle(el).backgroundColor, color: getComputedStyle(title).color, font: getComputedStyle(title).fontFamily, button: getComputedStyle(cta).backgroundColor };
    });
    await page.goto("/?design=a");
    await expect(page.locator(".ink-landing-title")).toBeVisible();
    const baseline = await read();
    await page.goto("/?design=b");
    await expect(page.locator(".ink-landing-title")).toBeVisible();
    expect(await read()).toEqual(baseline);
    await expect(page.locator(".design-b")).toHaveCount(0);
    await expect(page.locator("[data-character-guide]")).toHaveCount(0);
  });

  test("검토 페이지에서 실제 현재 A와 캐릭터 B를 고를 수 있다", async ({ page }) => {
    await page.goto("/design-review");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("현재 화면은 A");
    await expect(page.getByRole("link", { name: /A로 실제 서비스 보기/ })).toHaveAttribute("href", "/dashboard?design=a");
    await expect(page.getByRole("link", { name: /B로 실제 서비스 보기/ })).toHaveAttribute("href", "/dashboard?design=b");
    await expect(page.getByRole("link", { name: "기질 검사 B 디자인" })).toHaveAttribute("href", "/tci?variant=short&design=b");
  });
});
