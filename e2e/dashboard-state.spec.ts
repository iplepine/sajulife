import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE, failRoute, mockPackage, packageInfo } from "./fixtures/audit/session";

/**
 * 홈의 큰 버튼 — ★사주+기질 풀이가 메인★(2026-10-08).
 * 결제 → 사주 정보 → 사주 풀이 → 기질 검사 → 올해 운세 순서를 한 버튼이 따라간다(lib/package/journey.ts).
 * ★조회 실패는 '아직 안 함'과 다른 상태★다 — 실패를 결제나 새 입력으로 밀지 않는다.
 */

// 준비된 게스트 세션으로 보호 화면에 들어간다(e2e/guest.setup.ts).
test.use({ storageState: GUEST_STATE_FILE });

test.describe("홈 — 사주+기질 진행 단계별 버튼", () => {
  test("보조 풀이는 시안의 네 링크로 구분하고 기존 진입 주소를 유지한다", async ({ page }) => {
    await mockPackage(page, { entitled: false });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/dashboard");
      const links = page.getByRole("navigation", { name: "다른 풀이 둘러보기" });
      await expect(links.getByRole("link")).toHaveCount(4);
      for (const [name, href] of [["가족 사주", "/explore/family"], ["궁합", "/explore/compat"], ["용신 풀이", "/explore/yongsin"], ["고민 상담", "/explore/consult"]]) {
        await expect(links.getByRole("link", { name: new RegExp(name) })).toHaveAttribute("href", href);
      }
      await page.locator(".home-other").scrollIntoViewIfNeeded();
      await page.locator(".home-company-footer").scrollIntoViewIfNeeded();
      await expect(page.locator(".home-quick, .home-nudges")).toHaveCount(0);
      await page.screenshot({ path: `output/home-concepts-2026-10-13/screenshots/live-lower-${width}.png` });
    }
  });

  test("렌즈와 아이콘이 같은 중심 좌표를 사용하고 버튼은 아래에 놓인다", async ({ page }) => {
    await mockPackage(page, { entitled: false });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/dashboard");
      await expect(page.locator(".home-fusion-cta")).toBeVisible();
      const layout = await page.locator(".home-fusion-stage").evaluate((stage) => {
        const box = stage.getBoundingClientRect();
        const center = (selector: string) => {
          const icon = stage.querySelector(selector)!.getBoundingClientRect();
          return { x: (icon.x + icon.width / 2 - box.x) / box.width, y: (icon.y + icon.height / 2 - box.y) / box.height };
        };
        return {
          saju: center(".home-fusion-saju"), temperament: center(".home-fusion-temperament"),
          bottom: box.bottom, button: document.querySelector(".home-fusion-cta")!.getBoundingClientRect().top,
          scroll: document.documentElement.scrollWidth, viewport: innerWidth,
        };
      });
      expect(layout.saju.x).toBeCloseTo(.32095, 3);
      expect(layout.saju.y).toBeCloseTo(.63258, 3);
      expect(layout.temperament.x).toBeCloseTo(.67905, 3);
      expect(layout.temperament.y).toBeCloseTo(.38258, 3);
      expect(layout.button).toBeGreaterThanOrEqual(layout.bottom);
      expect(layout.scroll).toBeLessThanOrEqual(layout.viewport);
      await page.screenshot({ path: `output/home-concepts-2026-10-13/screenshots/live-home-${width}.png`, fullPage: false });
    }
  });

  test("결제 전이면 한 번에 보기 → 결제가 아니라 소개 화면, 세 단계와 가격을 같이 보여준다", async ({ page }) => {
    await mockPackage(page, { entitled: false });
    await page.goto("/dashboard");
    const cta = page.locator(".home-fusion-cta");
    await expect(cta).toContainText("사주와 기질, 한 번에 보기");
    // 바로 결제로 넘기면 뭘 하는 건지 모른 채 넘어간다 — 진행 순서와 결과 예시부터(2026-10-15).
    await expect(cta).toHaveAttribute("href", "/explore/fusion");
    const steps = page.getByRole("list", { name: "사주+기질 풀이 진행" });
    await expect(steps).toContainText("사주 풀이");
    await expect(steps).toContainText("기질 검사");
    await expect(steps).toContainText("사주+기질 올해 운세");
    // 베타 무료(기본) — 정가는 함께 보여주되 '무료'를 먼저 말한다.
    await expect(page.locator(".home-package-price")).toContainText("베타 기간 무료");
    await expect(page.locator(".home-package-price")).toContainText("4,900원");
  });

  test("실결제로 바꾸면 가격만 보여준다", async ({ page }) => {
    await mockPackage(page, { entitled: false }, "portone");
    await page.goto("/dashboard");
    await expect(page.locator(".home-package-price")).toHaveText("세 단계 모두 4,900원");
  });

  test("베타 무료면 결제 화면에서 결제 없이 열고 바로 사주 정보 입력으로 간다", async ({ page }) => {
    let entitled = false;
    let checkoutPosts = 0;
    await page.route("**/api/package", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(packageInfo({ entitled, hasProfile: false })) });
    });
    // 이용권 발급은 가짜로 받는다 — 공유 게스트 세션에 실제 이용권을 쓰지 않는다.
    await page.route("**/api/package/checkout", async (route) => {
      checkoutPosts += 1;
      entitled = true;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ granted: true, mode: "free" }) });
    });
    await page.goto("/checkout");
    await expect(page.locator(".checkout-free")).toContainText("베타 무료");
    await page.getByRole("button", { name: "무료로 시작하기" }).click();
    await page.waitForURL(/\/onboarding\?next=/);
    expect(checkoutPosts).toBe(1);
  });

  test("결제 후 사주 정보가 없으면 입력으로 보내고, 입력이 끝나면 사주 풀이를 만들게 한다", async ({ page }) => {
    // 실결제로 이미 산 사람 — 소개를 다시 돌지 않는다. (베타 무료에서 아무것도 없으면 소개부터: e2e/package-intro.spec.ts)
    await mockPackage(page, { hasProfile: false }, "portone");
    await page.goto("/dashboard");
    const cta = page.locator(".home-fusion-cta");
    await expect(cta).toContainText("사주 정보 입력하기");
    const href = await cta.getAttribute("href");
    expect(decodeURIComponent(href ?? "")).toBe("/onboarding?next=/saju?generate=1");
  });

  test("사주 풀이가 나오면 기질 검사로 — 끝나면 올해 운세로 이어지는 주소", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/dashboard");
    const cta = page.locator(".home-fusion-cta");
    await expect(cta).toContainText("기질 검사하고 올해 운세 보기");
    await expect(cta).toHaveAttribute("href", "/tci?variant=short&next=fusion");
    await expect(page.locator(".home-package-step.is-done")).toHaveCount(1);
  });

  test("생성 중이면 진행 확인으로 보내고 새 생성을 권하지 않는다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: false, status: "generating" } });
    await page.goto("/dashboard");
    const cta = page.locator(".home-fusion-cta");
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
    const cta = page.locator(".home-fusion-cta");
    await expect(cta).toContainText("내 올해 운세 보기");
    await expect(cta).toHaveAttribute("href", "/fusion");
  });

  test("프로필 조회가 실패하면 '사주 정보 없음'으로 단정하지 않는다", async ({ page }) => {
    await mockPackage(page, { hasProfile: false });
    await failRoute(page, "**/api/profile", "server");
    await page.goto("/dashboard");
    const hero = page.locator(".home-fusion-action");
    await expect(hero).toContainText("불러오지 못했");
    // 이미 넣어둔 정보가 있는데 다시 입력하라고 보내면 안 된다.
    await expect(hero).not.toContainText("사주 정보 입력하기");
  });

  test("풀이 상태 조회가 실패하면 결제 안 한 것으로 단정하지 않는다", async ({ page }) => {
    await failRoute(page, "**/api/package", "server");
    await page.goto("/dashboard");
    const hero = page.locator(".home-fusion-action");
    await expect(hero).toContainText("불러오지 못했");
    await expect(hero).not.toContainText("사주+기질 분석하기");
  });

  test("로딩이 끝난 뒤 버튼이 한 번 더 바뀌지 않는다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/dashboard");
    const cta = page.locator(".home-fusion-cta");
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
    await expect(page.locator(".home-fusion-cta")).toBeVisible();
    expect(posts, "홈 방문만으로 생성이 시작됐습니다").toBe(0);
  });
});
