import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
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

  test("초상 홈은 PC·모바일과 네 계절에서 이미지·동선·배치를 유지한다", async ({ page }) => {
    await mockPackage(page, { entitled: false });
    await mkdir("output/home-portrait-2026-10-25", { recursive: true });
    for (const width of [390, 1440]) {
      const height = width === 390 ? 844 : 1000;
      await page.setViewportSize({ width, height });
      await page.goto("/dashboard");
      const hero = page.locator("section[data-home-portrait]");
      const image = hero.locator("img.home-portrait-image");
      const cta = hero.locator(".home-fusion-cta");
      await expect(hero.locator("figcaption")).toHaveCount(0);
      await expect(page.locator(".home-other-link")).toHaveCount(4);
      await expect(page.getByRole("group", { name: "계절 미리보기" })).toHaveCount(0);
      await expect(page.locator(".home-other")).toHaveCSS("padding-top", width === 390 ? "36px" : "48px");
      const menuBoxes = await page.locator(".home-other-link").evaluateAll((links) => links.map((link) => {
        const { x, y } = link.getBoundingClientRect();
        return { x, y };
      }));
      expect(menuBoxes).toHaveLength(4);
      expect(menuBoxes[0].y).toBe(menuBoxes[1].y);
      expect(menuBoxes[2].y).toBeGreaterThan(menuBoxes[0].y);
      expect(menuBoxes[2].x).toBe(menuBoxes[0].x);
      await expect(hero.getByRole("heading", { level: 1 })).toContainText("사주에 기질을 더해");
      await expect(hero.getByRole("heading", { level: 1 })).toContainText("나를 더 선명하게");
      await expect(cta).toBeVisible();
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)).toBe(true);

      const readLayout = () => hero.evaluate((section) => {
        const rect = (selector: string) => {
          const box = section.querySelector(selector)!.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
        };
        return { title: rect("h1"), image: rect("img.home-portrait-image"), cta: rect(".home-fusion-cta"), scroll: document.documentElement.scrollWidth, viewport: innerWidth };
      });
      const baseline = await readLayout();
      expect(baseline.scroll).toBeLessThanOrEqual(baseline.viewport);
      expect(baseline.image.x).toBeGreaterThanOrEqual(0);
      expect(baseline.image.right).toBeLessThanOrEqual(width);
      if (width === 390) {
        expect(baseline.image.y).toBeGreaterThanOrEqual(baseline.title.bottom);
        expect(baseline.cta.y).toBeGreaterThanOrEqual(baseline.image.bottom);
        expect(baseline.cta.bottom, "모바일 첫 화면 안에 시작 버튼이 있어야 합니다").toBeLessThanOrEqual(height);
      } else {
        expect(baseline.image.x, "PC에서는 문구·시작 버튼 오른쪽에 초상을 둡니다").toBeGreaterThanOrEqual(baseline.cta.right);
      }

      for (const season of ["spring", "summer", "autumn", "winter"]) {
        await page.evaluate((value) => { document.documentElement.dataset.seasonTheme = value; }, season);
        const themed = await readLayout();
        expect(themed.scroll).toBeLessThanOrEqual(themed.viewport);
        for (const element of ["title", "image", "cta"] as const) {
          for (const axis of ["x", "y", "width", "height"] as const) {
            expect(Math.abs(themed[element][axis] - baseline[element][axis]), `${width}px ${season}: ${element}.${axis}가 계절 전환으로 움직였습니다`).toBeLessThanOrEqual(0.5);
          }
        }
      }
      await page.evaluate(() => { document.documentElement.dataset.seasonTheme = "autumn"; });
      await page.screenshot({ path: `output/home-portrait-2026-10-25/${width === 390 ? "mobile" : "desktop"}.png`, fullPage: false, animations: "disabled" });
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
    await expect(steps.locator(".home-package-title")).toHaveText([
      "사주타고난 특징과 삶의 흐름",
      "기질평소의 반응과 행동 성향",
      "통합나에게 맞는 선택의 방향",
    ]);
    await expect(cta.locator("span[aria-hidden]")).toHaveCSS("mask-image", /arrow-right\.svg/);
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

  test("중복 프로필 조회가 실패해도 단일 진행 상태의 확인된 정보를 사용한다", async ({ page }) => {
    await mockPackage(page, { hasProfile: false }, "portone");
    await failRoute(page, "**/api/profile", "server");
    await page.goto("/dashboard");
    const hero = page.locator(".home-fusion-action");
    await expect(hero).toContainText("사주 정보 입력하기");
    await expect(hero).not.toContainText("불러오지 못했");
  });

  test("홈에서는 쓰지 않는 과거 조회를 다시 요청하지 않는다", async ({ page }) => {
    await mockPackage(page, { entitled: false });
    const requested: string[] = [];
    page.on("request", (request) => { if (request.method() === "GET") requested.push(new URL(request.url()).pathname); });
    await page.goto("/dashboard");
    await expect(page.locator(".home-fusion-cta")).toBeVisible();
    for (const path of ["/api/profile", "/api/tci/answers", "/api/saju/yongsin", "/api/compat", "/api/saju/personal", "/api/family"]) {
      expect(requested).not.toContain(path);
    }
    expect(requested.filter((path) => path === "/api/package")).toHaveLength(1);
  });

  test("조회 실패 후 재시도 버튼은 실제로 다시 읽고 정상 단계로 복구한다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    let reads = 0;
    await page.route("**/api/package", async (route) => {
      reads += 1;
      await route.fulfill({ status: reads === 1 ? 503 : 200, contentType: "application/json", body: JSON.stringify(reads === 1 ? { error: "temporary" } : packageInfo({ personal: { saved: true, status: "idle" } })) });
    });
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "다시 불러오기" }).click();
    await expect(page.locator(".home-fusion-cta")).toContainText("기질 검사");
    await expect(page.locator(".home-fusion-cta")).toHaveAttribute("href", "/tci?variant=short&next=fusion");
    expect(reads).toBe(2);
  });

  test("4초를 넘는 정상 응답을 조회 실패로 오인하지 않는다", async ({ page }) => {
    await mockPackage(page, { entitled: false });
    await page.route("**/api/package", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4500));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(packageInfo({ entitled: false })) });
    });
    await page.goto("/dashboard");
    await expect(page.locator(".home-fusion-cta")).toContainText("한 번에 보기", { timeout: 10000 });
    await expect(page.locator(".home-fusion-action")).not.toContainText("불러오지 못했");
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
