import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { PERSONAL_REPORT_SECTION_IDS } from "../lib/report/personalContract";
import { TCI_DIMENSIONS, type TciDimension } from "../lib/tci/questions";
import type { TciScore } from "../lib/tci/scoring";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, PERSON_A, packageInfo, peopleStore } from "./fixtures/audit/session";

/** Synthetic GET responses only. No browser API write reaches the service. */
const OUTPUT = "output/temperament-tab-2026-11-16";
const paragraph = "이 문단은 탭 상태와 읽던 위치를 확인하는 합성 자료야. 실제 사람의 성격이나 사건을 판단한 결과는 아니야. ";
const personalText = JSON.stringify({
  title: "가상 인물의 사주 표제", keywords: [{ word: "사주", desc: "합성 자료" }],
  sections: PERSONAL_REPORT_SECTION_IDS.map(id => ({ id, summary: `${id} 합성 요약`, body: `사주 탭만의 해석이야.\n\n${paragraph.repeat(8)}` })),
  lifeline: [], roadmap: {}, disclaimer: "합성 저장본이야.",
});
const fusionText = FUSION_SECTION_TITLES.map(title => `${title}\n\n종합 탭만의 해석이야.\n\n${paragraph.repeat(8)}`).join("\n\n");
const savedPersonal = { report: personalText, generatedAt: "2026-11-03T01:00:00.000Z", provider: "test", model: "synthetic", judgment: 2 };
const savedFusion = { report: fusionText, generatedAt: "2026-11-03T02:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: "종합 합성 표제", scores: [] }, actions: [] };
const legacyText = JSON.stringify({
  title: "예전 기질 저장본의 표제", keywords: [],
  sections: [
    { id: "기본성향", summary: "기질 저장본만의 요약이야.", body: `기질 저장본만의 해석이야.\n\n${paragraph.repeat(8)}` },
    { id: "성장포인트", summary: "옛 항목도 유지해.", body: `옛 기질 항목도 그대로 읽어.\n\n${paragraph.repeat(8)}` },
  ], roadmap: {}, disclaimer: "과거 합성 저장본이야.",
});
const scores = (percent: number): TciScore[] => Object.entries(TCI_DIMENSIONS).map(([dimension, meta]) => ({
  dimension: dimension as TciDimension, ...meta, percent, raw: percent, max: 100,
}));
const result = (patch: Record<string, unknown> = {}) => ({
  saved: null, scores: scores(84), status: "idle",
  readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 }, ...patch,
});
const oldReading = (meta: Record<string, unknown> = { scores: scores(32), flexibility: 51 }) => ({
  report: legacyText, generatedAt: "2026-09-01T00:00:00.000Z", provider: "test", model: "legacy-synthetic", meta,
});

async function prepare(page: Page, options: { response?: Record<string, unknown>; failure?: "server" | "malformed" } = {}) {
  const state = { writes: [] as string[], tciGets: 0, failure: options.failure as "server" | "malformed" | undefined, response: options.response ?? result(), shareKinds: [] as string[] };
  await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method())) {
      state.writes.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 403, json: { error: "합성 테스트에서 API 쓰기는 금지해." } });
    }
    const send = (json: unknown, status = 200) => route.fulfill({ status, json });
    switch (url.pathname) {
      case "/api/people": return send(peopleStore(PERSON_A.id));
      case "/api/profile": return send({ profile: FIXTURE_PROFILE });
      case "/api/package": return send(packageInfo({ personal: { saved: true, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } }));
      case "/api/saju/chart": return send({ saju: calculateSaju(FIXTURE_PROFILE), name: FIXTURE_PROFILE.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
      case "/api/saju/personal": return send({ saved: savedPersonal, status: "idle" });
      case "/api/fusion/report": return send({ saved: savedFusion, status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 } });
      case "/api/tci/report":
        state.tciGets += 1;
        if (state.failure === "server") return send({ error: "조회 오류 예시" }, 500);
        if (state.failure === "malformed") return send({ status: "idle", saved: null, scores: scores(84), readiness: { hasTci: "true" } });
        return send(state.response);
      case "/api/share":
        state.shareKinds.push(url.searchParams.get("kind") ?? "");
        return send({ state: "none" });
      case "/api/tickets/balance": return send({ balance: 0 });
      default: return send({});
    }
  });
  return state;
}

const tab = (page: Page, name: "종합 풀이" | "사주 풀이" | "기질 검사") => page.getByRole("tab", { name, exact: true });
const panel = (page: Page) => page.getByRole("tabpanel", { name: "기질 검사", exact: true });
const currentResults = (page: Page) => panel(page).locator('[aria-label="완료한 검사 응답 결과"]');
const savedArea = (page: Page) => panel(page).getByRole("heading", { name: "저장된 기질 해설", exact: true }).locator("..");
async function openResults(page: Page, design: "a" | "b" = "a") {
  await page.goto(`/fusion?design=${design}`);
  await tab(page, "기질 검사").click();
  await expect(panel(page)).toBeVisible();
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("최종 풀이의 기질 검사 결과 탭", () => {
  for (const { width, design } of [{ width: 320, design: "a" }, { width: 390, design: "b" }, { width: 1440, design: "a" }] as const) {
    test(`${width}px · 디자인 ${design}: AI 해설 없이 완료한 일곱 검사 결과를 읽는다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const state = await prepare(page);
      await openResults(page, design);
      await expect(panel(page).getByRole("heading", { name: "네가 답한 기질과 성격", exact: true })).toBeVisible();
      await expect(currentResults(page).locator(".tci-val")).toHaveCount(7);
      await expect(currentResults(page).getByRole("img", { name: "7축 기질 레이더", exact: true })).toBeVisible();
      await expect(currentResults(page).getByText(TCI_DIMENSIONS.NS.description, { exact: true })).toBeVisible();
      await expect(panel(page).getByRole("heading", { name: "저장된 기질 해설", exact: true })).toHaveCount(0);
      await expect(panel(page).getByRole("button", { name: /생성|만들기/ })).toHaveCount(0);
      await expect(panel(page).getByText("유연성", { exact: true })).toHaveCount(0);
      if (design === "b") await expect(page.locator(".app-shell")).toHaveClass(/design-b/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await mkdir(OUTPUT, { recursive: true });
      await page.screenshot({ path: `${OUTPUT}/${width}-${design}-completed.png`, fullPage: true });
      expect(state.writes).toEqual([]);
      expect(state.tciGets).toBe(1);
    });
  }

  test("부분 응답의 점수는 완료 결과로 그리지 않고 검사 이어하기로 연결한다", async ({ page }) => {
    const state = await prepare(page, { response: result({ readiness: { hasProfile: true, hasTci: false, tciAnswered: 5, tciTotal: 35 } }) });
    await openResults(page);
    await expect(panel(page).getByRole("heading", { name: "기질 검사를 마저 해볼까?", exact: true })).toBeVisible();
    await expect(panel(page)).toContainText("5/35문항");
    await expect(currentResults(page)).toHaveCount(0);
    await expect(panel(page).getByRole("link", { name: "기질 검사 이어서 하기", exact: true })).toHaveAttribute("href", "/tci?variant=short&next=fusion");
    expect(state.writes).toEqual([]);
  });

  for (const failure of ["server", "malformed"] as const) {
    test(`${failure}: 조회 실패를 미검사로 오인하지 않고 GET만 재시도한다`, async ({ page }) => {
      const state = await prepare(page, { failure });
      await openResults(page);
      await expect(panel(page).getByRole("alert")).toContainText("기질 검사 결과를 불러오지 못했어");
      await expect(panel(page).getByRole("link", { name: /기질 검사.*시작|기질 검사.*이어서/ })).toHaveCount(0);
      state.failure = undefined;
      await panel(page).getByRole("button", { name: "기질 결과 다시 불러오기", exact: true }).click();
      await expect(currentResults(page).locator(".tci-val")).toHaveCount(7);
      await expect(panel(page).getByRole("alert")).toHaveCount(0);
      expect(state.tciGets).toBe(2);
      expect(state.writes).toEqual([]);
    });
  }

  test("옛 해설의 당시 점수·유연성을 현재 응답과 분리하고 tci 종류로 공유를 조회한다", async ({ page }) => {
    const state = await prepare(page, { response: result({ saved: oldReading() }) });
    await openResults(page);
    await expect(currentResults(page).locator(".tci-val").first()).toContainText("84");
    await expect(currentResults(page).getByText("유연성", { exact: true })).toHaveCount(0);
    await expect(savedArea(page)).toContainText("최근 검사 결과와 별개");
    const oldChart = savedArea(page).locator("details").filter({ has: page.locator("summary", { hasText: "이 해설에 사용한 당시 점수 보기" }) });
    await oldChart.locator("summary").click();
    await expect(oldChart.locator(".tci-val").first()).toContainText("32");
    await expect(oldChart.locator(".tci-val")).toHaveCount(8);
    await expect(oldChart.getByRole("img", { name: "8축 기질 레이더", exact: true })).toBeVisible();
    await expect(oldChart.locator(".tci-val").last()).toContainText("51");
    const chapter = savedArea(page).locator(".rv-sec").first();
    await chapter.locator("summary").click();
    await expect(chapter).toContainText("기질 저장본만의 해석이야.");
    await savedArea(page).getByRole("button", { name: "공유하기", exact: true }).click();
    await expect.poll(() => state.shareKinds.at(-1)).toBe("tci");
    await page.getByRole("button", { name: "취소", exact: true }).click();
    expect(state.writes).toEqual([]);
  });

  test("옛 본문에 당시 점수가 없으면 현재 점수를 붙이지 않고 본문만 보존한다", async ({ page }) => {
    const state = await prepare(page, { response: result({ saved: oldReading({ scores: [null], flexibility: "51" }) }) });
    await openResults(page);
    await expect(currentResults(page).locator(".tci-val")).toHaveCount(7);
    await expect(savedArea(page)).toContainText("당시 점수 자료가 남아 있지 않아");
    await expect(savedArea(page).getByText("이 해설에 사용한 당시 점수 보기", { exact: true })).toHaveCount(0);
    await expect(savedArea(page).locator(".rv-sec")).toHaveCount(2);
    await expect(savedArea(page).locator(".tci-val")).toHaveCount(0);
    expect(state.writes).toEqual([]);
  });

  test("세 탭의 펼침·읽던 위치와 키보드 이동을 유지하고 재조회·POST를 만들지 않는다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const state = await prepare(page, { response: result({ saved: oldReading() }) });
    await openResults(page);
    const oldChart = savedArea(page).locator("details").filter({ has: page.locator("summary", { hasText: "이 해설에 사용한 당시 점수 보기" }) });
    await oldChart.locator("summary").click();
    const chapter = savedArea(page).locator(".rv-sec").first();
    await chapter.locator("summary").click();
    await expect(chapter).toHaveAttribute("open", "");
    await page.evaluate(() => scrollTo(0, 600));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
    const temperamentY = await page.evaluate(() => scrollY);
    await tab(page, "종합 풀이").click();
    const combined = page.getByRole("tabpanel", { name: "종합 풀이", exact: true });
    const fusionChapter = combined.locator(".rv-sec").nth(1);
    await fusionChapter.locator("summary").click();
    await expect(fusionChapter).not.toHaveAttribute("open", "");
    await tab(page, "사주 풀이").click();
    const personal = page.getByRole("tabpanel", { name: "사주 풀이", exact: true });
    const personalChapter = personal.locator(".rv-sec--personal").nth(1);
    await personalChapter.locator("summary").click();
    await expect(personalChapter).not.toHaveAttribute("open", "");
    await tab(page, "기질 검사").click();
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - temperamentY)).toBeLessThan(30);
    await expect(oldChart).toHaveAttribute("open", "");
    await expect(chapter).toHaveAttribute("open", "");
    await tab(page, "종합 풀이").click();
    await expect(fusionChapter).not.toHaveAttribute("open", "");
    await tab(page, "사주 풀이").click();
    await expect(personalChapter).not.toHaveAttribute("open", "");
    await tab(page, "사주 풀이").focus();
    await page.keyboard.press("End");
    await expect(tab(page, "기질 검사")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "종합 풀이")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(tab(page, "기질 검사")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(tab(page, "종합 풀이")).toBeFocused();
    expect(state.tciGets).toBe(1);
    expect(state.writes).toEqual([]);
  });

  test("진행·생성 실패 안내가 있어도 이미 완료한 검사 결과는 읽을 수 있다", async ({ page }) => {
    const state = await prepare(page, { response: result({ status: "generating", saved: oldReading() }) });
    await openResults(page);
    await expect(panel(page).getByRole("status")).toContainText("기질 해설을 만들고 있어");
    await expect(currentResults(page).locator(".tci-val")).toHaveCount(7);
    await expect(savedArea(page)).toBeVisible();
    state.response = result({ status: "error", error: "합성 생성 오류", saved: oldReading() });
    await panel(page).getByRole("button", { name: "기질 결과 다시 불러오기", exact: true }).click();
    await expect(panel(page).getByRole("alert")).toContainText("지난 기질 해설 생성이 완료되지 않았어");
    await expect(currentResults(page).locator(".tci-val")).toHaveCount(7);
    await expect(savedArea(page)).toBeVisible();
    expect(state.writes).toEqual([]);
  });
});

test.describe("기질 검사 탭의 A/B 모바일 고정 메뉴", () => {
  const mobileOutput = `${OUTPUT}/mobile-ab`;
  const mainNavigation = (page: Page) => page.getByRole("navigation", { name: "주요 메뉴", exact: true, includeHidden: true });

  async function navigationGeometry(page: Page) {
    return mainNavigation(page).evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height,
        viewportWidth: innerWidth, viewportHeight: innerHeight, position: getComputedStyle(element).position };
    });
  }

  async function expectPinnedNavigation(page: Page, expectedHeight?: number) {
    await expect(mainNavigation(page)).toBeVisible();
    await expect(mainNavigation(page).getByRole("link")).toHaveCount(5);
    const geometry = await navigationGeometry(page);
    expect(geometry.position).toBe("fixed");
    expect(Math.abs(geometry.bottom - geometry.viewportHeight)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.width - geometry.viewportWidth)).toBeLessThanOrEqual(1);
    if (expectedHeight !== undefined) expect(Math.abs(geometry.height - expectedHeight)).toBeLessThanOrEqual(1);
    return geometry;
  }

  async function scrollPosition(page: Page, position: "top" | "middle" | "bottom") {
    const target = await page.evaluate(where => {
      const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      const top = where === "top" ? 0 : where === "middle" ? Math.floor(maximum / 2) : maximum;
      scrollTo({ top, behavior: "instant" });
      return top;
    }, position);
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - target)).toBeLessThanOrEqual(2);
  }

  async function expectFinalNoticeClear(page: Page) {
    const notice = panel(page).getByText("이 결과는 자기 이해를 돕는 참고 자료야.", { exact: false });
    await expect(notice).toBeVisible();
    const noticeBox = await notice.boundingBox();
    expect(noticeBox).not.toBeNull();
    const nav = await navigationGeometry(page);
    expect(noticeBox!.y).toBeGreaterThanOrEqual(0);
    expect(noticeBox!.y + noticeBox!.height, "마지막 안내문이 고정 하단 메뉴에 가려집니다").toBeLessThanOrEqual(nav.top - 1);
  }

  async function expectVariantPanel(page: Page, design: "a" | "b") {
    const readingPanel = panel(page).getByRole("region", { name: "기질 검사 리포트", exact: true });
    await expect(readingPanel).toHaveAttribute("data-design", design);
    const guide = readingPanel.locator('[data-temperament-guide="b"]');
    if (design === "b") await expect(guide).toBeVisible();
    else await expect(guide).toHaveCount(0);
  }

  for (const design of ["a", "b"] as const) {
    for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }]) {
      test(`${design.toUpperCase()} ${viewport.width}×${viewport.height}: 스크롤·안전영역·높이 변경에도 5탭이 화면 하단을 유지한다`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const state = await prepare(page);
        await openResults(page, design);
        await expect(currentResults(page).locator(".tci-val")).toHaveCount(7);
        await expectVariantPanel(page, design);
        await mkdir(mobileOutput, { recursive: true });
        const baseline = await expectPinnedNavigation(page);
        expect(baseline.height).toBeGreaterThan(40);
        const bottoms: number[] = [];
        const measurements: Array<Record<string, unknown>> = [];
        const recordGeometry = async (position: string) => {
          const nav = await navigationGeometry(page);
          const notice = await panel(page).getByText("이 결과는 자기 이해를 돕는 참고 자료야.", { exact: false }).boundingBox();
          const view = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollY,
            safeBottom: getComputedStyle(document.documentElement).getPropertyValue("--safe-b").trim() }));
          measurements.push({ position, viewport: view, nav, finalNoticeBottom: notice ? notice.y + notice.height : null });
        };

        // A full-page image places viewport-fixed UI partway through a tall
        // document. Only viewport captures demonstrate the mobile tabbar here.
        for (const position of ["top", "middle", "bottom"] as const) {
          await scrollPosition(page, position);
          const geometry = await expectPinnedNavigation(page, baseline.height);
          bottoms.push(geometry.bottom);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await page.screenshot({ path: `${mobileOutput}/${design}-${viewport.width}x${viewport.height}-${position}.png`, fullPage: false });
          await recordGeometry(position);
        }
        expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(1);
        await expectFinalNoticeClear(page);

        await page.evaluate(() => document.documentElement.style.setProperty("--safe-b", "34px"));
        await expect.poll(async () => (await navigationGeometry(page)).height - baseline.height).toBeGreaterThanOrEqual(33);
        const safeGeometry = await expectPinnedNavigation(page);
        expect(safeGeometry.height - baseline.height).toBeLessThanOrEqual(35);
        await scrollPosition(page, "bottom");
        await expectFinalNoticeClear(page);
        await page.screenshot({ path: `${mobileOutput}/${design}-${viewport.width}x${viewport.height}-safe34-bottom.png`, fullPage: false });
        await recordGeometry("safe34-bottom");

        await page.setViewportSize({ width: viewport.width, height: 600 });
        await expectPinnedNavigation(page, safeGeometry.height);
        await scrollPosition(page, "bottom");
        await expectFinalNoticeClear(page);
        await page.screenshot({ path: `${mobileOutput}/${design}-${viewport.width}x600-resized-bottom.png`, fullPage: false });
        await recordGeometry("resized600-safe34-bottom");
        await writeFile(`${mobileOutput}/geometry-${design}-${viewport.width}x${viewport.height}.json`, JSON.stringify({ design, originalViewport: viewport, measurements }, null, 2));
        expect(state.writes).toEqual([]);
      });
    }

    test(`${design.toUpperCase()} 1440px: 디자인에 맞는 기질 결과를 보여주고 모바일 메뉴는 숨긴다`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const state = await prepare(page);
      await openResults(page, design);
      await expect(currentResults(page).locator(".tci-val")).toHaveCount(7);
      await expectVariantPanel(page, design);
      await expect(mainNavigation(page)).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await mkdir(mobileOutput, { recursive: true });
      await page.screenshot({ path: `${mobileOutput}/${design}-1440x1000-desktop.png`, fullPage: false });
      await writeFile(`${mobileOutput}/geometry-${design}-1440x1000.json`, JSON.stringify({ design, viewport: page.viewportSize(), tabbarDisplay: await mainNavigation(page).evaluate(element => getComputedStyle(element).display) }, null, 2));
      expect(state.writes).toEqual([]);
    });
  }
});
