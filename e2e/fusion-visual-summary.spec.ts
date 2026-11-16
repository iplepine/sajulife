import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { TCI_DIMENSIONS, type TciDimension } from "../lib/tci/questions";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockJson, mockPackage } from "./fixtures/audit/session";

/** 저장된 계산/응답 자료만 표시한다. 실제 AI·공유·코칭 등록 요청은 전부 차단한다. */
const VALUES: Array<[TciDimension, number]> = [["NS", 5], ["HA", 11], ["RD", 15], ["PS", 22], ["SD", 13], ["CO", 19], ["ST", 25]];
const SCORES = VALUES.map(([dimension, raw]) => ({ dimension, ...TCI_DIMENSIONS[dimension], raw, max: 25, percent: raw * 4 }));
const LEGACY = ["먼저 결론: 네 반복 패턴 한눈에 보기", "타고난 결과 길러진 결", "잘 풀릴 때", "꼬일 때", "자꾸 반복되는 장면", "숨은 강점과 사각지대", "갈림길 사용법", "앞으로 6~12개월", "오늘부터 바꿀 세 가지"];
const ACTIONS = [1, 2, 3].map((i) => ({ title: `합성 실천 후보 ${i}`, timeframe: "이번 주", hint: "UI를 없애도 저장 데이터는 보존" }));
const BODY = "사주에서 읽은 특징과 이번 검사 응답을 함께 살피는 합성 예시입니다. 익숙한 강점을 유지하면서 현재의 조건에 맞게 힘을 쓰는 방식을 돌아봅니다. 특정 개인의 미래나 성격을 확정하지 않습니다.";

async function prepare(page: Page, options: { legacy?: boolean; timeUnknown?: boolean; missingScores?: boolean; scores?: unknown[] } = {}) {
  const state = { writes: 0, errors: [] as string[] };
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
  const saju = calculateSaju({ ...FIXTURE_PROFILE, birthTime: options.timeUnknown ? "" : FIXTURE_PROFILE.birthTime });
  const report = (options.legacy ? LEGACY.map(title => `▣ ${title}`) : FUSION_SECTION_TITLES).map((title, i) => `${title}\n\n${i + 1}번째 원문 해석입니다.\n\n${BODY}`).join("\n\n");
  await page.route("**/api/**", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) {
      state.writes += 1;
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "이 테스트는 저장 자료만 읽습니다." }) });
    }
    return route.fulfill({ status: 200, json: {} });
  });
  await mockJson(page, "**/api/people", { people: [], activeId: null });
  await mockJson(page, "**/api/profile", { profile: FIXTURE_PROFILE });
  await mockJson(page, "**/api/tci/report", { saved: null, scores: [], status: "idle", readiness: { hasProfile: true, hasTci: false, tciAnswered: 0, tciTotal: 35 } });
  await mockJson(page, "**/api/fusion/report", {
    status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
    saved: { report, generatedAt: "2026-11-03T07:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: "사주와 응답을 함께 읽는 가상 리포트", scores: options.missingScores ? [] : options.scores ?? SCORES }, actions: ACTIONS },
  });
  await mockJson(page, "**/api/saju/personal", { status: "idle", saved: null });
  await mockJson(page, "**/api/saju/chart", { saju, name: FIXTURE_PROFILE.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
  await mockPackage(page, { personal: { saved: true, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } });
  return { state, saju };
}

const visual = (page: Page) => page.getByRole("region", { name: "사주와 검사 응답 한눈에 보기", exact: true });
async function noCoaching(page: Page) {
  const folio = page.locator(".report-folio[data-kind='fusion']");
  await expect(folio.getByText("코칭 액션 플랜", { exact: true })).toHaveCount(0);
  await expect(folio.getByRole("button", { name: "등록", exact: true })).toHaveCount(0);
  await expect(folio.getByRole("button", { name: "전체 등록", exact: true })).toHaveCount(0);
  await expect(folio.getByText("합성 실천 후보 1", { exact: true })).toHaveCount(0);
  await expect(folio.getByRole("button", { name: "공유하기", exact: true })).toBeVisible();
  await expect(folio.getByRole("button", { name: "다시 생성", exact: true })).toBeVisible();
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("D 풀이의 사주·응답 시각 요약", () => {
  for (const design of ["a", "b"] as const) {
    for (const width of [390, 1440]) {
      test(`${design.toUpperCase()} · ${width}px 두 근거를 본문 앞의 두 열로 보고 저장 본문으로 이동한다`, async ({ page }) => {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
        const { state, saju } = await prepare(page);
        await page.goto(`/fusion?design=${design}`);
        const folio = page.locator(".report-folio[data-kind='fusion']");
        const summary = visual(page);
        await expect(summary).toBeVisible();
        await expect(page.locator(".app-shell")).toHaveClass(design === "b" ? /design-b/ : /^(?!.*design-b).*$/);
        await expect(folio.locator("blockquote")).toHaveCount(0);
        await expect(folio.getByText("1번째 원문 해석입니다.", { exact: true })).toHaveCount(1);
        expect(await summary.evaluate(el => getComputedStyle(el).borderTopWidth)).toBe("0px");
        const elements = summary.getByRole("region", { name: "원국 오행 분포", exact: true });
        await expect(elements.locator("dl > div")).toHaveCount(5);
        for (const [element, count] of Object.entries(saju.wuxingCount)) {
          await expect(elements.locator("dl > div").filter({ has: page.locator("dt", { hasText: element }) }).locator("dd")).toHaveText(String(count));
        }
        await expect(summary).toContainText(saju.input.birthDate);
        const evidence = folio.locator("#folio-fusion-evidence");
        const body = folio.locator(".rv");
        const evidenceBox = await evidence.boundingBox();
        const bodyBox = await body.boundingBox();
        expect(evidenceBox).not.toBeNull();
        expect(bodyBox).not.toBeNull();
        expect(evidenceBox!.y + evidenceBox!.height).toBeLessThanOrEqual(bodyBox!.y + 1);
        const chart = await summary.getByRole("region", { name: "사주 명식", exact: true }).boundingBox();
        const responses = await summary.getByRole("region", { name: "저장된 검사 응답 경향", exact: true }).boundingBox();
        expect(chart).not.toBeNull();
        expect(responses).not.toBeNull();
        expect(Math.abs(chart!.y - responses!.y)).toBeLessThanOrEqual(2);
        expect(chart!.x + chart!.width).toBeLessThanOrEqual(responses!.x + 1);
        expect(chart!.width).toBeGreaterThan(100);
        expect(responses!.width).toBeGreaterThan(100);
        await expect(summary.locator("[data-dimension]")).toHaveCount(7);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

        const firstSection = folio.locator(".rv-sec").first();
        await firstSection.locator("summary").click();
        await expect(firstSection).not.toHaveAttribute("open", "");
        const read = folio.getByRole("link", { name: "이어서 본문 읽기", exact: true });
        await expect(read).toHaveAttribute("href", "#folio-fusion-section-0");
        await read.focus();
        await page.keyboard.press("Enter");
        await expect(firstSection).toHaveAttribute("open", "");
        await expect(firstSection.locator("summary")).toBeFocused();
        await expect(firstSection.getByText("1번째 원문 해석입니다.", { exact: true })).toHaveCount(1);
        await expect.poll(async () => {
          const box = await firstSection.boundingBox();
          return box ? box.y >= 0 && box.y < 350 : false;
        }).toBe(true);
        await mkdir("output/fusion-visual-2026-11-03", { recursive: true });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: `output/fusion-visual-2026-11-03/opening-${design}-${width}.png`, fullPage: false });
        expect(state.writes).toBe(0);
        expect(state.errors).toEqual([]);
      });
    }
  }

  for (const width of [390, 1440]) {
    for (const legacy of [false, true]) {
      test(`${width}px ${legacy ? "옛" : "새"} 저장본의 명식과 7개 응답 값을 실제 값으로 표시한다`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        const { state, saju } = await prepare(page, { legacy });
        await page.goto("/fusion");
        const summary = visual(page);
        await expect(summary).toBeVisible();
        for (const pillar of [saju.pillars.year, saju.pillars.month, saju.pillars.day, saju.pillars.time!]) {
          await expect(summary).toContainText(pillar.gan.hanja);
          await expect(summary).toContainText(pillar.zhi.hanja);
        }
        await expect(summary.getByRole("region", { name: "기질", exact: true }).locator("[data-dimension]")).toHaveCount(4);
        await expect(summary.getByRole("region", { name: "성격", exact: true }).locator("[data-dimension]")).toHaveCount(3);
        await expect(summary).toContainText(/백분위.*아니|백분위가 아닌/);
        for (const score of SCORES) {
          const row = summary.locator(`[data-dimension='${score.dimension}']`);
          await expect(row).toHaveCount(1);
          await expect(row).toContainText(String(score.percent));
          const meter = row.getByRole("meter");
          await expect(meter).toHaveAttribute("aria-valuemin", "0");
          await expect(meter).toHaveAttribute("aria-valuemax", "100");
          await expect(meter).toHaveAttribute("aria-valuenow", String(score.percent));
          await expect(meter).toHaveAttribute("aria-valuetext", /백분위 아님/);
        }
        await expect(summary.locator("[data-dimension]")).toHaveCount(7);
        const dayCaption = summary.getByRole("region", { name: "사주 명식", exact: true }).locator("dl > div").nth(2).locator("dd > div").first().locator("small");
        await expect(dayCaption).toContainText("· 일간");
        const dayLabel = dayCaption.locator("em");
        expect(await dayLabel.evaluate(element => getComputedStyle(element).position)).toBe("static");
        await noCoaching(page);
        const sections = page.locator(".report-folio[data-kind='fusion'] .rv-sec");
        await expect(sections).toHaveCount(legacy ? 9 : 8);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir("output/fusion-visual-2026-11-03", { recursive: true });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: `output/fusion-visual-2026-11-03/${legacy ? "legacy" : "fusion"}-${width}.png`, fullPage: true });
        expect(state.writes).toBe(0);
        expect(state.errors).toEqual([]);
      });
    }
  }

  test("출생 시각을 모르면 시주를 만들어 표시하지 않는다", async ({ page }) => {
    const { state } = await prepare(page, { timeUnknown: true });
    await page.goto("/fusion");
    const summary = visual(page);
    await expect(summary).toBeVisible();
    await expect(summary).toContainText(/시각.*미상|시각.*모름|시각.*알 수/);
    const timePillar = summary.getByRole("region", { name: "사주 명식", exact: true }).locator("dl > div").nth(3);
    await expect(timePillar).toContainText("시각 미상");
    await expect(timePillar.locator("[lang='zh-Hant']")).toHaveCount(0);
    expect(state.writes).toBe(0);
    expect(state.errors).toEqual([]);
  });

  for (const legacy of [false, true]) {
    test(`${legacy ? "옛" : "새"} 저장 점수가 없으면 원문은 보존하고 0점·추정 점수를 만들지 않는다`, async ({ page }) => {
      const { state } = await prepare(page, { missingScores: true, legacy });
      await page.goto("/fusion");
      const summary = visual(page);
      await expect(summary).toBeVisible();
      await expect(summary).toContainText(/저장.*점수.*없|점수.*저장.*없|점수.*없.*저장/);
      await expect(summary.locator("[data-dimension]")).toHaveCount(0);
      const sections = page.locator(".report-folio[data-kind='fusion'] .rv-sec");
      await expect(sections).toHaveCount(legacy ? LEGACY.length : FUSION_SECTION_TITLES.length);
      for (let index = 0; index < (legacy ? LEGACY.length : FUSION_SECTION_TITLES.length); index++) {
        await expect(sections.nth(index).getByText(`${index + 1}번째 원문 해석입니다.`, { exact: true })).toHaveCount(1);
        await expect(sections.nth(index)).toContainText(BODY);
      }
      await noCoaching(page);
      expect(state.writes).toBe(0);
      expect(state.errors).toEqual([]);
    });
  }

  test("중복·범위 밖·비수치·빠진 차원은 0점으로 꾸미지 않는다", async ({ page }) => {
    const { state } = await prepare(page, { scores: [
      { ...SCORES[0], percent: 20 }, { ...SCORES[0], percent: 80 },
      { ...SCORES[1], percent: -1 }, { ...SCORES[2], percent: 101 },
      { ...SCORES[3], percent: "88" }, SCORES[4], { ...SCORES[6], percent: null },
    ] });
    await page.goto("/fusion");
    const summary = visual(page);
    await expect(summary).toBeVisible();
    await expect(summary.getByRole("meter")).toHaveCount(1);
    await expect(summary.locator("[data-dimension='SD']").getByRole("meter")).toHaveAttribute("aria-valuenow", "52");
    for (const key of ["NS", "HA", "RD", "PS", "CO", "ST"]) {
      const row = summary.locator(`[data-dimension='${key}']`);
      await expect(row).toContainText("저장된 응답 없음");
      await expect(row.getByRole("meter")).toHaveCount(0);
    }
    expect(state.writes).toBe(0);
    expect(state.errors).toEqual([]);
  });
});
