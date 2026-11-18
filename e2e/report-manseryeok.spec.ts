import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { buildManseryeok, type Manseryeok } from "../lib/saju/manseryeok";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { TCI_DIMENSIONS, type TciDimension } from "../lib/tci/questions";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, packageInfo } from "./fixtures/audit/session";

const OUTPUT = "output/report-manseryeok-2026-11-16";
const SCORES = Object.entries(TCI_DIMENSIONS).map(([dimension, meta], index) => ({
  dimension: dimension as TciDimension, ...meta, percent: 25 + index * 10, raw: 25 + index * 10, max: 100,
}));
const REPORT = FUSION_SECTION_TITLES.map((title, index) => `${title}\n\n${index + 1}번째 저장 원문을 그대로 읽어.\n\n이 문단은 만세력 표시를 확인하기 위한 합성 자료야. 실제 인물이나 미래에 대한 해석이 아니야.`).join("\n\n");

async function prepare(page: Page, options: { unknownTime?: boolean; failure?: boolean; mismatch?: boolean } = {}) {
  const profile = { ...FIXTURE_PROFILE, birthTime: options.unknownTime ? "" : FIXTURE_PROFILE.birthTime };
  const saju = calculateSaju(profile);
  const state = { writes: [] as string[], years: [] as Array<number | null>, failure: options.failure ?? false, errors: [] as string[] };
  const dataFor = (year = 2026) => buildManseryeok(options.mismatch ? { ...profile, birthDate: "1991-04-12" } : profile, {
    currentYear: 2026, currentAge: 36, currentMonth: 11, wolwoonYear: year,
  });
  page.on("pageerror", error => state.errors.push(error.message));
  await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method())) {
      state.writes.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 403, json: { error: "합성 만세력 조회만 허용해." } });
    }
    const send = (json: unknown, status = 200) => route.fulfill({ status, json });
    switch (url.pathname) {
      case "/api/people": return send({ people: [], activeId: null });
      case "/api/profile": return send({ profile });
      case "/api/package": return send(packageInfo({ personal: { saved: false, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } }));
      case "/api/saju/chart": return send({ saju, name: profile.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
      case "/api/saju/personal": return send({ saved: null, status: "idle" });
      case "/api/fusion/report": return send({
        saved: { report: REPORT, generatedAt: "2026-11-16T01:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: "만세력과 검사 응답을 함께 읽는 합성 자료", scores: SCORES } },
        status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
      });
      case "/api/tci/report": return send({ saved: null, scores: [], status: "idle", readiness: { hasProfile: true, hasTci: false, tciAnswered: 0, tciTotal: 35 } });
      case "/api/saju/manseryeok": {
        const year = url.searchParams.get("wy");
        state.years.push(year == null ? null : Number(year));
        return state.failure ? send({ error: "합성 조회 실패" }, 500) : send({ manseryeok: dataFor(year == null ? 2026 : Number(year)) });
      }
      case "/api/share": return send({ state: "none" });
      case "/api/tickets/balance": return send({ balance: 0 });
      default: return send({});
    }
  });
  return { state, data: dataFor(), saju };
}

const summary = (page: Page) => page.getByRole("region", { name: "사주와 검사 응답 한눈에 보기", exact: true });
const chart = (page: Page) => summary(page).getByRole("region", { name: "사주 명식", exact: true });
const original = (page: Page) => page.locator(".report-folio[data-kind='fusion'] .rv-sec");
const natal = (root: Locator) => root.locator(".mnr-sec").filter({ has: root.page().locator(".mnr-sec-title", { hasText: /^원국$/ }) });

async function expectOriginal(page: Page) {
  await expect(original(page)).toHaveCount(FUSION_SECTION_TITLES.length);
  for (let index = 0; index < FUSION_SECTION_TITLES.length; index++) {
    await expect(original(page).nth(index).getByText(`${index + 1}번째 저장 원문을 그대로 읽어.`, { exact: true })).toHaveCount(1);
  }
}

async function expectNatal(root: Locator, data: Manseryeok) {
  const cols = natal(root).locator(".mnr-col");
  await expect(cols).toHaveCount(4);
  for (let index = 0; index < data.natal.length; index++) {
    const expected = data.natal[index];
    const col = cols.nth(index);
    await expect(col.locator(".mnr-col-label")).toHaveText(expected.label);
    if (!expected.gan || !expected.zhi) {
      await expect(col).toContainText(/시각 모름|시각 미상/);
      await expect(col.locator(".mnr-gz, .mnr-spirit, .mnr-stage, .mnr-hidden, .mnr-stars")).toHaveCount(0);
      continue;
    }
    await expect(col.locator(".mnr-gz-ko").nth(0)).toHaveText(expected.gan.hanja);
    await expect(col.locator(".mnr-gz-ko").nth(1)).toHaveText(expected.zhi.hanja);
    if (expected.dayMaster) await expect(col.locator(".mnr-spirit").first()).toContainText("일간 나");
    else if (expected.gan.tenSpirit) await expect(col.locator(".mnr-spirit").first()).toContainText(expected.gan.tenSpirit);
    if (expected.zhi.tenSpirit) await expect(col.locator(".mnr-spirit").nth(1)).toContainText(expected.zhi.tenSpirit);
    if (expected.zhi.twelveStage) await expect(col.locator(".mnr-stage")).toHaveText(expected.zhi.twelveStage);
    if (expected.zhi.hiddenStems.length) {
      await expect(col.locator(".mnr-hidden")).toContainText("장간");
      for (const stem of expected.zhi.hiddenStems) await expect(col.locator(".mnr-hidden")).toContainText(stem.ko);
    } else await expect(col.locator(".mnr-hidden")).toHaveCount(0);
    // Every calculated star is retained, including pillars with no stars.
    await expect(col.locator(".mnr-stars > span")).toHaveCount(expected.zhi.stars.length);
    for (const star of expected.zhi.stars) await expect(col.locator(".mnr-stars").getByText(star.name, { exact: true })).toHaveCount(1);
  }
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("최종 리포트의 전체 만세력", () => {
  for (const width of [390, 1440]) {
    test(`${width}px 원국 전체와 일곱 응답을 읽고 운세 연도를 GET으로 바꾼다`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      const { state, data } = await prepare(page);
      await page.goto(`/fusion`);
      const full = chart(page).locator(".mnr");
      await expect(full).toBeVisible();
      await expectNatal(full, data);
      const track = await natal(full).locator(".mnr-track").boundingBox();
      expect(track).not.toBeNull();
      for (const col of await natal(full).locator(".mnr-col").all()) {
        const rect = await col.boundingBox();
        expect(rect).not.toBeNull();
        expect(rect!.x).toBeGreaterThanOrEqual(track!.x - 1);
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(track!.x + track!.width + 1);
      }
      await expect(summary(page).locator("[data-dimension]")).toHaveCount(7);
      const chartBox = await chart(page).boundingBox();
      const responses = await summary(page).getByRole("region", { name: "저장된 검사 응답 경향", exact: true }).boundingBox();
      expect(chartBox).not.toBeNull();
      expect(responses).not.toBeNull();
      if (width < 768) expect(responses!.y).toBeGreaterThanOrEqual(chartBox!.y + chartBox!.height - 1);
      else {
        expect(Math.abs(chartBox!.y - responses!.y)).toBeLessThanOrEqual(2);
        expect(chartBox!.x + chartBox!.width).toBeLessThanOrEqual(responses!.x + 1);
      }
      const expand = full.locator("details").filter({ has: page.locator("summary", { hasText: "대운·세운·월운 펼쳐보기" }) });
      await expect(expand).not.toHaveAttribute("open", "");
      await expand.locator("summary").click();
      await expect(expand).toHaveAttribute("open", "");
      await expect(full.getByRole("region", { name: "보는 법", exact: true })).toContainText("십신");
      await expect(full).toContainText("십이운성");
      for (const title of ["대운", "세운"]) {
        const section = expand.locator(".mnr-sec").filter({ has: page.locator(".mnr-sec-title", { hasText: new RegExp(`^${title}$`) }) });
        await expect(section).toBeVisible();
        await expect(section.locator(".mnr-col")).toHaveCount(title === "대운" ? data.daewoon.length : data.saewoon.length);
      }
      const monthly = expand.locator(".mnr-sec").filter({ has: page.locator(".mnr-sec-title", { hasText: /^월운/ }) });
      const toggle = monthly.locator(".mnr-sec-toggle");
      if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
      await expect(monthly.locator(".mnr-col")).toHaveCount(12);
      await monthly.getByRole("button", { name: "2027 →", exact: true }).click();
      await expect(monthly.locator(".mnr-year-now")).toHaveText("2027년 (양력)");
      expect(state.years).toContain(2027);
      const next = buildManseryeok(FIXTURE_PROFILE, { currentYear: 2026, currentAge: 36, currentMonth: 11, wolwoonYear: 2027 });
      await expect(monthly.locator(".mnr-col").first().locator(".mnr-gz-ko").first()).toHaveText(next.wolwoon.columns[0].gan!.hanja);
      await expectOriginal(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      const nav = page.locator('nav.tabbar[aria-label="주요 메뉴"]');
      if (width < 768) {
        await expect(nav).toBeVisible();
        await expect(nav.getByRole("link")).toHaveCount(5);
        await expect(nav).toHaveAttribute("data-scroll-hidden", "false");
      } else await expect(nav).toBeHidden();
      await page.evaluate(() => scrollTo(0, 0));
      await mkdir(OUTPUT, { recursive: true });
      await page.screenshot({ path: `${OUTPUT}/${width}.png`, fullPage: false });
      await expand.locator("summary").click();
      await natal(full).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${OUTPUT}/${width}-natal.png`, fullPage: false });
      expect(state.writes).toEqual([]);
      expect(state.errors).toEqual([]);
    });
  }

  test("태어난 시각이 없으면 시주의 글자·십신·신살을 만들어 넣지 않는다", async ({ page }) => {
    const { state, data } = await prepare(page, { unknownTime: true });
    await page.goto("/fusion");
    const full = chart(page).locator(".mnr");
    await expect(full).toBeVisible();
    await expectNatal(full, data);
    await expect(natal(full).locator(".mnr-col").first()).toContainText(/시각 모름|시각 미상/);
    await expectOriginal(page);
    expect(state.writes).toEqual([]);
    expect(state.errors).toEqual([]);
  });

  test("조회 실패에는 기존 요약과 저장 본문을 유지하고 GET으로만 다시 불러온다", async ({ page }) => {
    const { state, data, saju } = await prepare(page, { failure: true });
    await page.goto("/fusion");
    const retry = chart(page).getByRole("button", { name: "만세력 다시 불러오기", exact: true });
    await expect(retry).toBeVisible();
    await expect(chart(page).locator(".mnr")).toHaveCount(0);
    await expect(chart(page)).toContainText(saju.pillars.day.gan.hanja);
    await expectOriginal(page);
    state.failure = false;
    await retry.click();
    const full = chart(page).locator(".mnr");
    await expect(full).toBeVisible();
    await expectNatal(full, data);
    await expectOriginal(page);
    expect(state.years).toHaveLength(2);
    expect(state.writes).toEqual([]);
    expect(state.errors).toEqual([]);
  });

  test("출생정보가 다른 응답은 현재 인물의 만세력으로 표시하지 않는다", async ({ page }) => {
    const { state } = await prepare(page, { mismatch: true });
    await page.goto("/fusion");
    await expect(chart(page).getByRole("button", { name: "만세력 다시 불러오기", exact: true })).toBeVisible();
    await expect(chart(page).locator(".mnr")).toHaveCount(0);
    await expect(chart(page)).not.toContainText("1991-04-12");
    await expectOriginal(page);
    expect(state.writes).toEqual([]);
    expect(state.errors).toEqual([]);
  });
});
