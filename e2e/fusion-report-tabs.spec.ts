import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { PERSONAL_REPORT_SECTION_IDS } from "../lib/report/personalContract";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockJson, mockPackage } from "./fixtures/audit/session";

/** 합성 저장본만 읽는다. 모든 API 쓰기 요청은 막아 실제 생성·공유 발급을 하지 않는다. */
const example = "제공된 정보를 대조해 강점과 선택의 방향을 살펴보는 합성 테스트 문단입니다. 실제 개인의 성격이나 사건을 확인한 결과가 아닙니다. ";
const personalText = JSON.stringify({
  title: "가상 인물의 사주 전용 표제",
  keywords: [{ word: "사주", desc: "합성 자료" }],
  sections: PERSONAL_REPORT_SECTION_IDS.map((id) => ({ id, summary: `${id} 사주 요약`, body: `사주 전용 해석입니다.\n\n${example.repeat(10)}` })),
  lifeline: [], roadmap: { character: "합성", resourceInput: "", resourceOutput: "", riskShadow: "", riskTool: "", direction: "" },
  disclaimer: "사주 합성 저장본입니다.",
});
const fusionText = FUSION_SECTION_TITLES.map((title) => `${title}\n\n종합 전용 해석입니다.\n\n${example.repeat(10)}`).join("\n\n");
const savedPersonal = { report: personalText, generatedAt: "2026-11-03T01:00:00.000Z", provider: "test", model: "synthetic", judgment: 2 };
const savedFusion = { report: fusionText, generatedAt: "2026-11-03T02:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: "가상 인물의 종합 전용 표제", scores: [] }, actions: [] };

async function prepare(page: Page, options: { personal?: boolean; fusion?: boolean; personalError?: boolean; hasTci?: boolean } = {}) {
  const personal = options.personal !== false;
  const fusion = options.fusion !== false;
  const state = { writes: 0, personalGets: 0, fusionGets: 0, personalError: options.personalError ?? false, shareKinds: [] as string[] };
  await page.route("**/api/**", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) {
      state.writes += 1;
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "합성 테스트에서는 쓰기 금지" }) });
    }
    return route.fallback();
  });
  await page.route("**/api/saju/personal", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    state.personalGets += 1;
    return route.fulfill({ status: state.personalError ? 500 : 200, contentType: "application/json", body: JSON.stringify(state.personalError ? { error: "사주 조회 테스트 오류" } : { status: "idle", saved: personal ? savedPersonal : null }) });
  });
  await page.route("**/api/fusion/report", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    state.fusionGets += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "idle", saved: fusion ? savedFusion : null, readiness: { hasProfile: true, hasTci: options.hasTci ?? fusion, tciAnswered: fusion ? 35 : 0, tciTotal: 35 } }) });
  });
  await page.route("**/api/share?*", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    state.shareKinds.push(new URL(route.request().url()).searchParams.get("kind") ?? "");
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ state: "none" }) });
  });
  await mockJson(page, "**/api/saju/chart", { saju: calculateSaju(FIXTURE_PROFILE), name: FIXTURE_PROFILE.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
  await mockPackage(page, { personal: { saved: personal, status: "idle" }, fusion: { saved: fusion, status: "idle" }, tci: { complete: options.hasTci ?? fusion, answered: fusion ? 35 : 0, total: 35 } });
  return state;
}

const combined = (page: Page) => page.getByRole("tabpanel", { name: "종합 풀이", exact: true });
const personal = (page: Page) => page.getByRole("tabpanel", { name: "사주 풀이", exact: true });
const tab = (page: Page, name: "종합 풀이" | "사주 풀이") => page.getByRole("tab", { name, exact: true });

test.use({ storageState: GUEST_STATE_FILE });

test.describe("종합 결과 화면의 두 리포트 전환", () => {
  for (const width of [390, 1440]) {
    test(`${width}px에서 저장본을 재생성 없이 전환하고 펼침을 유지한다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const state = await prepare(page);
      await page.goto("/fusion");
      await expect(tab(page, "종합 풀이")).toHaveAttribute("aria-selected", "true");
      await expect(combined(page).getByText("종합 전용 해석입니다.", { exact: true }).first()).toBeVisible();
      await expect(personal(page)).toBeHidden();
      await expect(page.getByRole("tabpanel", { name: "사주 풀이", exact: true, includeHidden: true })).toHaveCount(1);
      await mkdir("output/report-tabs-2026-11-03", { recursive: true });
      await page.screenshot({ path: `output/report-tabs-2026-11-03/${width === 390 ? "mobile" : "desktop"}.png`, fullPage: true });
      const originalFusionGets = state.fusionGets;
      await combined(page).locator(".rv-sec summary").nth(2).click();
      await expect(combined(page).locator(".rv-sec").nth(2)).not.toHaveAttribute("open", "");
      await tab(page, "사주 풀이").click();
      await expect(tab(page, "사주 풀이")).toHaveAttribute("aria-selected", "true");
      await expect(personal(page).getByText("사주 전용 해석입니다.", { exact: true }).first()).toBeVisible();
      await expect(combined(page)).toBeHidden();
      await expect(personal(page).locator(".rv-sec--personal")).toHaveCount(PERSONAL_REPORT_SECTION_IDS.length);
      await personal(page).locator(".rv-sec--personal summary").nth(3).click();
      await expect(personal(page).locator(".rv-sec--personal").nth(3)).not.toHaveAttribute("open", "");
      await tab(page, "종합 풀이").click();
      await expect(combined(page).locator(".rv-sec").nth(2)).not.toHaveAttribute("open", "");
      await tab(page, "사주 풀이").click();
      await expect(personal(page).locator(".rv-sec--personal").nth(3)).not.toHaveAttribute("open", "");
      expect(state.personalGets).toBe(1);
      expect(state.fusionGets).toBe(originalFusionGets);
      expect(state.writes).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `output/report-tabs-2026-11-03/${width === 390 ? "mobile" : "desktop"}-personal.png`, fullPage: true });
    });
  }

  test("키보드 화살표와 Home·End로 탭을 선택할 수 있다", async ({ page }) => {
    const state = await prepare(page);
    await page.goto("/fusion");
    await tab(page, "종합 풀이").focus();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "사주 풀이")).toBeFocused();
    await expect(tab(page, "사주 풀이")).toHaveAttribute("aria-selected", "true");
    const selectedStyles = await tab(page, "사주 풀이").evaluate((element) => ({
      accent: getComputedStyle(element).getPropertyValue("--season-accent").trim(),
      indicator: getComputedStyle(element, "::after").backgroundColor,
      outlineColor: getComputedStyle(element).outlineColor,
      outlineStyle: getComputedStyle(element).outlineStyle,
      outlineWidth: getComputedStyle(element).outlineWidth,
    }));
    expect(selectedStyles.accent).not.toBe("");
    expect(selectedStyles.indicator).not.toBe("rgba(0, 0, 0, 0)");
    expect(selectedStyles.indicator).not.toBe("transparent");
    expect(selectedStyles.outlineColor).toBe(selectedStyles.indicator);
    expect(selectedStyles.outlineStyle).toBe("solid");
    expect(selectedStyles.outlineWidth).toBe("2px");
    await page.keyboard.press("Home");
    await expect(tab(page, "종합 풀이")).toBeFocused();
    await page.keyboard.press("End");
    await expect(tab(page, "사주 풀이")).toBeFocused();
    expect(state.writes).toBe(0);
  });

  test("사주만 있으면 사주 탭부터 읽고 종합 탭에서 검사를 안내한다", async ({ page }) => {
    const state = await prepare(page, { fusion: false, hasTci: false });
    await page.goto("/fusion");
    await expect(tab(page, "사주 풀이")).toHaveAttribute("aria-selected", "true");
    await expect(personal(page).getByText("사주 전용 해석입니다.", { exact: true }).first()).toBeVisible();
    await tab(page, "종합 풀이").click();
    await expect(combined(page).getByRole("link", { name: /기질 검사/ })).toHaveAttribute("href", "/tci?variant=short&next=fusion");
    expect(state.writes).toBe(0);
  });

  test("사주 조회 실패는 미생성으로 오인하지 않고 GET 재시도로 복구한다", async ({ page }) => {
    const state = await prepare(page, { personalError: true });
    await page.goto("/fusion");
    await tab(page, "사주 풀이").click();
    await expect(personal(page).getByRole("alert")).toBeVisible();
    await expect(personal(page).getByRole("link", { name: /사주.*만들|사주.*생성/ })).toHaveCount(0);
    state.personalError = false;
    await personal(page).getByRole("button", { name: /사주 풀이 다시 불러오기|다시 불러오기|다시 시도/ }).click();
    await expect(personal(page).getByText("사주 전용 해석입니다.", { exact: true }).first()).toBeVisible();
    expect(state.personalGets).toBe(2);
    expect(state.writes).toBe(0);
  });

  test("사주 저장본이 없으면 생성 없이 사주 화면으로 안내한다", async ({ page }) => {
    const state = await prepare(page, { personal: false });
    await page.goto("/fusion");
    await tab(page, "사주 풀이").click();
    await expect(personal(page).getByRole("link", { name: "사주 풀이 받으러 가기", exact: true })).toHaveAttribute("href", "/saju");
    expect(state.writes).toBe(0);
  });

  test("읽던 위치를 탭별로 기억한다", async ({ page }) => {
    const state = await prepare(page);
    await page.goto("/fusion");
    await expect(combined(page).locator(".rv-sec[open]")).toHaveCount(FUSION_SECTION_TITLES.length);
    await page.evaluate(() => scrollTo(0, 520));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(450);
    const fusionY = await page.evaluate(() => scrollY);
    await tab(page, "사주 풀이").click();
    await expect(personal(page)).toBeVisible();
    await page.evaluate(() => scrollTo(0, 820));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(750);
    const personalY = await page.evaluate(() => scrollY);
    await tab(page, "종합 풀이").click();
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - fusionY)).toBeLessThan(30);
    await tab(page, "사주 풀이").click();
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - personalY)).toBeLessThan(30);
    expect(state.writes).toBe(0);
  });

  test("공유 관리는 현재 읽는 리포트 종류를 사용한다", async ({ page }) => {
    const state = await prepare(page);
    await page.goto("/fusion");
    await combined(page).getByRole("button", { name: "공유하기", exact: true }).click();
    await expect.poll(() => state.shareKinds.at(-1)).toBe("fusion");
    await page.getByRole("button", { name: "취소", exact: true }).click();
    await tab(page, "사주 풀이").click();
    await personal(page).getByRole("button", { name: "공유하기", exact: true }).click();
    await expect.poll(() => state.shareKinds.at(-1)).toBe("personal");
    await page.getByRole("button", { name: "취소", exact: true }).click();
    expect(state.writes).toBe(0);
  });
});
