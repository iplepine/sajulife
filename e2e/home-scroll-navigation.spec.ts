import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { GUEST_STATE_FILE, packageInfo } from "./fixtures/audit/session";

const OUTPUT = "output/compact-type-2026-11-16";
const report = FUSION_SECTION_TITLES.map(title => `${title}\n\n${"스크롤 동작을 확인하는 합성 저장본이야. 실제 사람에 대한 해석은 아니야. ".repeat(20)}`).join("\n\n");

/** Every API response is synthetic; writes are counted and blocked before reaching the service. */
async function prepare(page: Page) {
  const writes: string[] = [];
  await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
  await page.route("**/api/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push(`${request.method()} ${path}`);
      return route.fulfill({ status: 403, json: { error: "스크롤 검증에서는 저장하지 않아." } });
    }
    const send = (json: unknown) => route.fulfill({ status: 200, json });
    switch (path) {
      case "/api/package": return send(packageInfo({ entitled: false, hasProfile: false }));
      case "/api/profile": return send({ profile: null });
      case "/api/people": return send({ people: [], activeId: null });
      case "/api/saju/chart": return send({ saju: null });
      case "/api/saju/personal": return send({ saved: null, status: "idle" });
      case "/api/fusion/report": return send({
        saved: { report, generatedAt: "2026-11-16T00:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { scores: [] } },
        status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
      });
      case "/api/tci/report": return send({ saved: null, scores: [], status: "idle", readiness: { hasProfile: false, hasTci: false, tciAnswered: 0, tciTotal: 35 } });
      case "/api/share": return send({ state: "none" });
      case "/api/tickets/balance": return send({ balance: 0 });
      default: return send({});
    }
  });
  return writes;
}

const menu = (page: Page) => page.locator('nav.tabbar[aria-label="주요 메뉴"]');

async function scrollTo(page: Page, top: number) {
  await page.evaluate(async y => {
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, top);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(top);
}

async function expectShown(nav: Locator) {
  await expect(nav).toHaveAttribute("data-scroll-hidden", "false");
  await expect(nav).toBeVisible();
  expect(await nav.evaluate(element => (element as HTMLElement).inert)).toBe(false);
  await expect.poll(() => nav.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return Math.abs(rect.bottom - window.innerHeight);
  })).toBeLessThanOrEqual(1);
}

async function expectHidden(nav: Locator) {
  await expect(nav).toHaveAttribute("data-scroll-hidden", "true");
  expect(await nav.evaluate(element => (element as HTMLElement).inert)).toBe(true);
  await expect.poll(() => nav.evaluate(element => {
    const style = getComputedStyle(element);
    return style.transform !== "none" && new DOMMatrixReadOnly(style.transform).m42 > 0 && element.getBoundingClientRect().top >= window.innerHeight - 1;
  })).toBe(true);
  await expect(nav).toBeHidden();
}

test.use({ storageState: GUEST_STATE_FILE });

for (const design of ["a", "b"] as const) {
  test(`디자인 ${design} · 모바일 홈에서 아래로 읽으면 메뉴를 숨기고 위로 읽으면 복귀한다`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const writes = await prepare(page);
    await page.goto(`/dashboard?design=${design}`);
    await expect(page.locator(".home-fusion-cta")).toBeVisible();
    await expect(page.locator(".home-page h1")).toBeVisible();
    expect(await page.locator(".home-page h1").evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(28);
    await expect(page.locator(".app-shell")).toHaveClass(design === "b" ? /design-b/ : /^(?!.*design-b).*$/);
    const nav = menu(page);
    await expectShown(nav);
    await expect(nav.getByRole("link")).toHaveCount(5);
    expect(await nav.evaluate(element => getComputedStyle(element).position)).toBe("fixed");
    await mkdir(OUTPUT, { recursive: true });
    await page.screenshot({ path: `${OUTPUT}/${design}-home.png`, fullPage: false });

    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeGreaterThanOrEqual(360);
    await scrollTo(page, 360);
    await expectHidden(nav);
    await scrollTo(page, 280);
    await expectShown(nav);
    await scrollTo(page, 0);
    await expectShown(nav);

    // Focused navigation stays available even while the home scrolls down.
    await nav.getByRole("link", { name: "홈", exact: true }).focus();
    await scrollTo(page, 360);
    await expectShown(nav);
    await expect(nav.getByRole("link", { name: "홈", exact: true })).toBeFocused();
    await nav.evaluate(element => (element.querySelector(":focus") as HTMLElement | null)?.blur());
    await scrollTo(page, 0);
    await scrollTo(page, 360);
    await expectHidden(nav);

    // Report reading now follows the same scroll direction behavior.
    await page.goto(`/fusion?design=${design}`);
    await expect(page.locator(".report-folio")).toBeVisible();
    await expectShown(nav);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeGreaterThanOrEqual(360);
    await scrollTo(page, 360);
    await expectHidden(nav);
    await scrollTo(page, 280);
    await expectShown(nav);
    await scrollTo(page, 0);
    await expectShown(nav);
    expect(writes).toEqual([]);
  });

  test(`디자인 ${design} · 1440px 데스크톱에서는 홈과 풀이의 하단 메뉴가 표시되지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const writes = await prepare(page);
    for (const path of ["dashboard", "fusion"]) {
      await page.goto(`/${path}?design=${design}`);
      await expect(page.locator(path === "dashboard" ? ".home-fusion-cta" : ".report-folio")).toBeVisible();
      const nav = menu(page);
      await expect(nav).toHaveAttribute("data-scroll-hidden", "false");
      await expect(nav).toBeHidden();
      expect(await nav.evaluate(element => getComputedStyle(element).display)).toBe("none");
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      await expect(nav).toHaveAttribute("data-scroll-hidden", "false");
      await expect(nav).toBeHidden();
    }
    expect(writes).toEqual([]);
  });
}
