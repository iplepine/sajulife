import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE, failRoute, mockPackage } from "./fixtures/audit/session";

/**
 * 홈의 큰 버튼 — ★사주+기질 풀이가 메인★(2026-10-08).
 * 결제 → 사주 정보 → 사주 풀이 → 기질 검사 → 올해 운세 순서를 한 버튼이 따라간다(lib/package/journey.ts).
 * ★조회 실패는 '아직 안 함'과 다른 상태★다 — 실패를 결제나 새 입력으로 밀지 않는다.
 */

// 준비된 게스트 세션으로 보호 화면에 들어간다(e2e/guest.setup.ts).
test.use({ storageState: GUEST_STATE_FILE });

test.describe("홈 — 사주+기질 진행 단계별 버튼", () => {
  test("결제 전이면 사주+기질 분석하기 → 결제 화면, 세 단계와 가격을 같이 보여준다", async ({ page }) => {
    await mockPackage(page, { entitled: false });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("사주+기질 분석하기");
    await expect(cta).toHaveAttribute("href", "/checkout");
    const steps = page.getByRole("list", { name: "사주+기질 풀이 진행" });
    await expect(steps).toContainText("사주 풀이");
    await expect(steps).toContainText("기질 검사");
    await expect(steps).toContainText("사주+기질 올해 운세");
    await expect(page.locator(".home-package-price")).toContainText("4,900원");
  });

  test("결제 후 사주 정보가 없으면 입력으로 보내고, 입력이 끝나면 사주 풀이를 만들게 한다", async ({ page }) => {
    await mockPackage(page, { hasProfile: false });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("사주 정보 입력하기");
    const href = await cta.getAttribute("href");
    expect(decodeURIComponent(href ?? "")).toBe("/onboarding?next=/saju?generate=1");
  });

  test("사주 풀이가 나오면 기질 검사로 — 끝나면 올해 운세로 이어지는 주소", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("기질 검사하고 올해 운세 보기");
    await expect(cta).toHaveAttribute("href", "/tci?variant=short&next=fusion");
    await expect(page.locator(".home-package-step.is-done")).toHaveCount(1);
  });

  test("생성 중이면 진행 확인으로 보내고 새 생성을 권하지 않는다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: false, status: "generating" } });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("사주 풀이 진행 확인하기");
    await expect(cta).toHaveAttribute("href", "/saju");
  });

  test("올해 운세까지 다 됐으면 보기로", async ({ page }) => {
    await mockPackage(page, {
      personal: { saved: true, status: "idle" },
      tci: { complete: true, answered: 35, total: 35 },
      fusion: { saved: true, status: "idle" },
    });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("내 올해 운세 보기");
    await expect(cta).toHaveAttribute("href", "/fusion");
  });

  test("프로필 조회가 실패하면 '사주 정보 없음'으로 단정하지 않는다", async ({ page }) => {
    await mockPackage(page, { hasProfile: false });
    await failRoute(page, "**/api/profile", "server");
    await page.goto("/dashboard");
    const hero = page.locator(".life-path-hero-copy");
    await expect(hero).toContainText("불러오지 못했");
    // 이미 넣어둔 정보가 있는데 다시 입력하라고 보내면 안 된다.
    await expect(hero).not.toContainText("사주 정보 입력하기");
  });

  test("풀이 상태 조회가 실패하면 결제 안 한 것으로 단정하지 않는다", async ({ page }) => {
    await failRoute(page, "**/api/package", "server");
    await page.goto("/dashboard");
    const hero = page.locator(".life-path-hero-copy");
    await expect(hero).toContainText("불러오지 못했");
    await expect(hero).not.toContainText("사주+기질 분석하기");
  });

  test("로딩이 끝난 뒤 버튼이 한 번 더 바뀌지 않는다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/dashboard");
    const cta = page.locator(".life-path-cta");
    await expect(cta).toContainText("기질 검사");
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
