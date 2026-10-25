import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, PERSON_A, PERSON_B, packageInfo, peopleStore } from "./fixtures/audit/session";

test.use({ storageState: GUEST_STATE_FILE });

const ROUTES = [
  "/dashboard", "/saju", "/tci", "/consult", "/family", "/account",
  "/materials", "/explore/fusion", "/notifications",
  "/fusion", "/tci/report", "/compat", "/history", "/coaching",
  "/onboarding", "/checkout", "/tickets", "/saju/manseryeok",
  "/saju/timing", "/saju/yongsin", "/saju/yongsin-check",
  "/explore/personal", "/explore/temperament", "/explore/family",
  "/explore/compat", "/explore/yongsin", "/explore/consult",
] as const;

const TOP_LINKS = [
  { name: "나의 공간", href: "/dashboard" },
  { name: "내 풀이", href: "/materials" },
  { name: "관계와 상담", href: "/consult" },
] as const;

test.describe("모던 공통 셸 — 모든 서비스 공간", () => {
  test.beforeEach(async ({ page }) => {
    // 실제 게스트 세션은 미들웨어 인증에만 사용한다. 읽기 데이터는 가상 값,
    // 쓰기 요청은 모두 차단해 시각 회귀 검증이 생성 비용·운영 데이터에 닿지 않게 한다.
    await page.route("**/api/**", async (route) => {
      if (route.request().method() !== "GET") return route.abort("blockedbyclient");
      const path = new URL(route.request().url()).pathname;
      const bodies: Record<string, unknown> = {
        "/api/people": peopleStore(PERSON_A.id),
        "/api/profile": { profile: FIXTURE_PROFILE },
        "/api/package": packageInfo({ entitled: false }),
        "/api/consult": { history: [], hasProfile: true },
        "/api/coaching": { items: [] },
        "/api/family": { family: { members: [] } },
        "/api/compat": { compat: { partners: [] } },
        "/api/notifications": { notifications: [] },
        "/api/tci/answers": { tci: null },
        "/api/saju/chart": { error: "시각 검증용 가상 데이터에는 원국이 없습니다." },
      };
      const body = path in bodies ? bodies[path] : { saved: null, status: "idle" };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });
    await mkdir("output/modern-shell-2026-10-25", { recursive: true });
  });

  for (const width of [1440, 390]) {
    for (const route of ROUTES) {
      test(`${width}px ${route} — 공통 구조·가로 넘침·내비게이션`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.goto(route);
        await expect(page.locator(".modern-app-shell")).toBeVisible();
        await expect(page.locator(".sidebar")).toHaveCount(0);
        await expect(page.locator(".app-main .page-loading")).toHaveCount(0);
        await expect(page.locator(".app-main")).toBeVisible();

        const header = page.locator(".studio-header");
        await expect(header).toBeVisible();
        await expect(header.getByRole("link", { name: "sajulife 홈", exact: true })).toHaveAttribute("href", "/dashboard");

        if (width === 1440) {
          for (const link of TOP_LINKS) {
            await expect(header.getByRole("link", { name: link.name, exact: true })).toBeVisible();
            await expect(header.getByRole("link", { name: link.name, exact: true })).toHaveAttribute("href", link.href);
          }
          const exactActive = TOP_LINKS.find((link) => link.href === route);
          if (exactActive) {
            await expect(header.getByRole("link", { name: exactActive.name, exact: true })).toHaveAttribute("aria-current", "page");
          }
          await expect(page.locator(".tabbar")).toBeHidden();
        } else {
          const tabs = page.locator(".tabbar");
          await expect(tabs).toBeVisible();
          await expect(tabs.getByRole("link")).toHaveCount(4);
          for (const href of ["/dashboard", "/consult", "/family", "/account"]) {
            await expect(tabs.locator(`a[href="${href}"]`)).toBeVisible();
          }
        }

        const dimensions = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        }));
        expect(dimensions.scroll, `${route}에 가로 스크롤이 생겼습니다`).toBeLessThanOrEqual(dimensions.viewport);
        const headerBox = await header.boundingBox();
        expect(headerBox).not.toBeNull();
        expect(headerBox!.x).toBeGreaterThanOrEqual(0);
        expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(width);
        await page.screenshot({
          path: `output/modern-shell-2026-10-25/${route.slice(1).replaceAll("/", "-")}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      });
    }
  }

  test("공통 헤더 인물 메뉴는 열 때 최신 활성 인물을 확인한다", async ({ page }) => {
    await page.goto("/account");
    const trigger = page.locator(".studio-header .psw-trigger");
    await expect(trigger).toHaveAttribute("aria-label", `${PERSON_A.label} 선택`);
    await page.route("**/api/people", (route) => route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify(peopleStore(PERSON_B.id)),
    }));
    await trigger.click();
    await expect(page.locator('.studio-header [role="menuitemradio"][aria-checked="true"]')).toContainText(PERSON_B.label);
    await expect(trigger).toHaveAttribute("aria-label", `${PERSON_B.label} 선택`);
  });

  test("네 계절·다크에서도 공통 표면의 글자와 버튼 대비를 유지한다", async ({ page }) => {
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((n) => {
        const v = n / 255;
        return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/dashboard");
      await expect(page.locator(".home-fusion-cta")).toBeVisible();
      for (const season of ["spring", "summer", "autumn", "winter"]) {
        await page.evaluate((value) => { document.documentElement.dataset.seasonTheme = value; }, season);
        const colors = await page.evaluate(() => {
          const header = getComputedStyle(document.querySelector(".studio-header")!);
          const link = getComputedStyle(document.querySelector(".studio-nav a")!);
          const button = getComputedStyle(document.querySelector(".home-fusion-cta")!);
          return { background: header.backgroundColor, text: link.color, buttonBackground: button.backgroundColor, buttonText: button.color };
        });
        for (const [a, b] of [[colors.background, colors.text], [colors.buttonBackground, colors.buttonText]]) {
          const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
          expect((high + .05) / (low + .05), `${scheme} ${season}: ${a} / ${b}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      await page.screenshot({ path: `output/modern-shell-2026-10-25/theme-${scheme}.png`, fullPage: true });
    }
  });
});
