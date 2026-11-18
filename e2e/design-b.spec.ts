import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { GUEST_STATE_FILE, mockPackage, mockJson } from "./fixtures/audit/session";

test.describe("캐릭터 중심 디자인 B(기본)", () => {
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

  test("쿼리나 쿠키 없이도 홈과 다음 화면이 캐릭터 디자인으로 열린다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await expect(page.locator(".design-b [data-home-character]")).toBeVisible();
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

    // 옛 A 선택 쿼리는 더 이상 화면을 바꾸지 않는다.
    await page.goto("/explore/fusion?design=a");
    await expect(page.locator(".design-b [data-character-guide]")).toBeVisible();
  });

  test("B도 실제 진행 상태와 조회 실패를 같은 경로로 처리한다", async ({ page }) => {
    await mockPackage(page, { entitled: true, hasProfile: true, personal: { saved: true, status: "idle" }, tci: { complete: false, answered: 12, total: 35 } });
    await page.goto("/dashboard");
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

  for (const width of [1024, 1440, 1920]) {
    test(`${width}px 완료 상태에서도 진행 단계는 히어로 아래 전체 폭으로 배치된다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const writes: string[] = [];
      await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
      await page.route("**/api/**", async route => {
        const request = route.request();
        if (!["GET", "HEAD"].includes(request.method())) {
          writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
          return route.fulfill({ status: 403, json: { error: "PC 배치 검증은 합성 조회만 허용해." } });
        }
        return route.fulfill({ status: 200, json: {} });
      });
      await mockJson(page, "**/api/profile", { profile: null });
      await mockJson(page, "**/api/people", { people: [], activeId: null });
      await mockJson(page, "**/api/saju/chart", { saju: null });
      await mockPackage(page, {
        entitled: true, hasProfile: true,
        personal: { saved: true, status: "idle" },
        tci: { complete: true, answered: 35, total: 35 },
        fusion: { saved: true, status: "idle" },
      });
      await page.goto("/dashboard");
      await expect(page.locator(".home-fusion-cta")).toHaveText(/내 최종 통합 풀이 보기/);
      await expect(page.locator(".home-package-step-link[href='/saju']")).toBeVisible();
      await expect(page.locator(".home-package-step-link[href='/fusion']")).toBeVisible();
      const home = page.locator(".design-b .b-home");
      await expect(home.locator(".home-package-step")).toHaveCount(3);
      const layout = await home.evaluate(element => {
        const rect = (selector: string) => {
          const box = element.querySelector(selector)!.getBoundingClientRect();
          return { left: box.left, top: box.top, width: box.width, bottom: box.bottom };
        };
        return {
          root: element.getBoundingClientRect().width,
          hero: rect(".b-home-hero"),
          package: rect(".home-package"),
          steps: [...element.querySelectorAll<HTMLElement>(".home-package-step")].map(step => ({
            width: step.getBoundingClientRect().width,
            titleWidth: step.querySelector(".home-package-title")!.getBoundingClientRect().width,
            overflow: step.scrollWidth > step.clientWidth,
          })),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(layout.hero.bottom).toBeLessThanOrEqual(layout.package.top + 1);
      expect(Math.abs(layout.package.width - layout.root)).toBeLessThanOrEqual(1);
      expect(Math.abs(layout.package.left - layout.hero.left)).toBeLessThanOrEqual(1);
      for (const step of layout.steps) {
        expect(step.width).toBeGreaterThanOrEqual(160);
        expect(step.titleWidth).toBeGreaterThanOrEqual(110);
        expect(step.overflow).toBe(false);
      }
      expect(layout.horizontalOverflow).toBe(false);
      if (width === 1440) {
        await mkdir("output/report-cleanup-2026-11-18", { recursive: true });
        await page.screenshot({ path: "output/report-cleanup-2026-11-18/home-desktop.png", fullPage: false });
      }
      expect(writes).toEqual([]);
    });
  }
});

test.describe("로그인 전 고정 화면", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("흰 바탕 검정 궁서 랜딩은 캐릭터 디자인을 입히지 않는다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".ink-landing-title")).toBeVisible();
    await expect(page.locator(".design-b")).toHaveCount(0);
    await expect(page.locator("[data-character-guide]")).toHaveCount(0);
  });

  test("디자인 검토 페이지는 닫혀 있다", async ({ page }) => {
    // 비로그인은 공개 경로가 아니라 랜딩으로 돌려보낸다(로그인 뒤에는 없는 페이지).
    await page.goto("/design-review");
    await expect(page).toHaveURL(/\/\?redirectedFrom=%2Fdesign-review/);
    await expect(page.getByText("현재 화면은 A")).toHaveCount(0);
  });
});
