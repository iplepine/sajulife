import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { PERSONAL_REPORT_SECTION_IDS } from "../lib/report/personalContract";
import { TCI_DIMENSIONS, type TciDimension } from "../lib/tci/questions";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockJson, mockPackage } from "./fixtures/audit/session";

/**
 * 종합 사주 다시 보기(2026-11-18 대표 결정): 사주(그대로/다시 분석) → 기질(그대로/다시 검사) → 최종.
 * 합성 저장본만 쓰고, 생성 POST는 202만 돌려주며 횟수를 센다 — 실제 AI 호출 없음.
 */
const OUTPUT = "output/fusion-revisit-2026-11-18";
const saju = calculateSaju(FIXTURE_PROFILE);
const personalText = JSON.stringify({
  title: "합성 보고서",
  keywords: [{ word: "합성", desc: "합성 자료" }],
  sections: PERSONAL_REPORT_SECTION_IDS.map((id, i) => ({ id, summary: `${id} 합성 요약입니다.`, body: `${i + 1}번째 절의 합성 본문입니다.` })),
  lifeline: [],
  roadmap: { character: "합성", resourceInput: "합성", resourceOutput: "합성", riskShadow: "합성", riskTool: "합성", direction: "합성" },
  disclaimer: "합성 저장본입니다.",
});
const SCORES = Object.entries(TCI_DIMENSIONS).map(([dimension, meta], index) => ({
  dimension: dimension as TciDimension, ...meta, percent: 30 + index * 8, raw: 30 + index * 8, max: 100,
}));

async function prepare(page: Page) {
  const state = { personalPosts: 0, fusionPosts: 0, tciPuts: 0, personalGenerating: false, otherWrites: [] as string[], errors: [] as string[] };
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    if (["GET", "HEAD"].includes(req.method())) return route.fallback();
    if (path === "/api/saju/personal" && req.method() === "POST") { state.personalPosts += 1; state.personalGenerating = true; return route.fulfill({ status: 202, json: { status: "generating" } }); }
    if (path === "/api/fusion/report" && req.method() === "POST") { state.fusionPosts += 1; return route.fulfill({ status: 202, json: { status: "generating" } }); }
    if (path === "/api/tci/answers" && req.method() === "PUT") { state.tciPuts += 1; return route.fulfill({ status: 200, json: { tci: null } }); }
    state.otherWrites.push(`${req.method()} ${path}`);
    return route.fulfill({ status: 403, json: { error: "합성 테스트 쓰기 금지" } });
  });
  await page.route("**/api/saju/personal", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const saved = { report: personalText, generatedAt: "2026-11-18T01:00:00.000Z", judgment: 2 };
    return route.fulfill({ status: 200, json: { status: state.personalGenerating ? "generating" : "idle", saved } });
  });
  await mockJson(page, "**/api/tci/answers*", { tci: { variant: "short", answers: { a1: 3 }, updatedAt: "2026-11-18T00:00:00.000Z" } });
  await mockJson(page, "**/api/tci/report", { saved: null, scores: SCORES, status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 } });
  await mockJson(page, "**/api/fusion/report", {
    status: "idle",
    saved: { report: FUSION_SECTION_TITLES.map((t) => `${t}\n\n합성 문단입니다.`).join("\n\n"), generatedAt: "2026-11-18T02:00:00.000Z", judgment: 2, meta: { headline: "합성", scores: SCORES }, actions: [] },
    readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
  });
  await mockJson(page, "**/api/share?*", { state: "none" });
  await mockJson(page, "**/api/saju/chart", { saju, name: FIXTURE_PROFILE.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
  await mockPackage(page, { personal: { saved: true, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } });
  return state;
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("종합 사주 다시 보기", () => {
  for (const width of [390, 1440]) {
    test(`${width}px: 사주·기질을 그대로 쓰면 생성 없이 저장된 최종 풀이로 간다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const state = await prepare(page);
      await page.goto("/fusion");
      await page.getByRole("link", { name: "종합 사주 다시 보기", exact: true }).click();
      await expect(page).toHaveURL(/\/fusion\/revisit$/);

      // ① 사주: 저장된 한 장 보고서와 두 선택지
      await expect(page.getByRole("heading", { name: "사주 풀이를 확인해 주세요" })).toBeVisible();
      await expect(page.getByRole("article", { name: "사주 풀이 보고서", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "사주 다시 분석하기" })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await mkdir(OUTPUT, { recursive: true });
      await page.screenshot({ path: `${OUTPUT}/${width}-saju.png` });
      await page.getByRole("button", { name: "이 사주 풀이 그대로 쓰기" }).click();

      // ② 기질: 저장된 검사 결과와 두 선택지
      await expect(page).toHaveURL(/step=tci/);
      await expect(page.getByRole("region", { name: "기질 검사 리포트" })).toBeVisible();
      await page.getByRole("button", { name: "기질 다시 검사하기" }).click();
      const dialog = page.getByRole("dialog", { name: "기질 검사를 다시 할까요?" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "취소" }).click();
      await expect(dialog).toBeHidden();
      await page.screenshot({ path: `${OUTPUT}/${width}-tci.png` });
      await page.getByRole("button", { name: "이 검사 결과 그대로 쓰기" }).click();

      // ③ 최종: 바뀐 게 없으면 저장본 보기가 먼저
      await expect(page).toHaveURL(/step=final$/);
      await expect(page.getByRole("link", { name: "저장된 최종 풀이 보기" })).toHaveAttribute("href", "/fusion");
      await expect(page.getByRole("button", { name: "최종 풀이 새로 만들기" })).toBeVisible();
      await page.screenshot({ path: `${OUTPUT}/${width}-final.png` });
      expect(state.personalPosts + state.fusionPosts + state.tciPuts).toBe(0);
      expect(state.otherWrites).toEqual([]);
      expect(state.errors).toEqual([]);
    });
  }

  test("사주 다시 분석은 다이얼로그 확인 뒤 한 번만 시작하고, 기다리는 동안 기질 단계를 진행한다", async ({ page }) => {
    const state = await prepare(page);
    await page.goto("/fusion/revisit");
    await page.getByRole("button", { name: "사주 다시 분석하기" }).click();
    const dialog = page.getByRole("dialog", { name: "사주를 다시 분석할까요?" });
    await expect(dialog).toContainText("지금 사주 풀이는 새 풀이로 바뀌고 남지 않아요");
    expect(state.personalPosts).toBe(0);
    await dialog.getByRole("button", { name: "다시 분석하기" }).click();
    await expect.poll(() => state.personalPosts).toBe(1);
    await expect(page).toHaveURL(/step=saju&saju=1/);
    await expect(page.getByRole("listitem").filter({ hasText: "다시 분석" })).toBeVisible();
    await mkdir(OUTPUT, { recursive: true });
    await page.screenshot({ path: `${OUTPUT}/saju-generating.png` });

    // 병렬: 분석 중에도 기질 단계로 가서 고를 수 있고, 최종 만들기만 잠긴다.
    await page.getByRole("button", { name: "기다리는 동안 기질 단계로" }).click();
    await expect(page).toHaveURL(/step=tci&saju=1/);
    await expect(page.getByRole("status").filter({ hasText: "사주 풀이를 다시 분석하고 있어요" })).toBeVisible();
    await page.getByRole("button", { name: "이 검사 결과 그대로 쓰기" }).click();
    await expect(page.getByRole("button", { name: "사주 분석이 끝나면 만들 수 있어요" })).toBeDisabled();
    expect(state.fusionPosts).toBe(0);

    // 분석이 끝나면(서버 상태 idle) 최종 만들기가 열린다 — 백그라운드 폴링(첫 30초)을 기다리지 않고 재방문으로 확인.
    state.personalGenerating = false;
    await page.reload();
    await expect(page.getByRole("button", { name: "최종 풀이 다시 만들기" })).toBeEnabled();
  });

  test("바뀐 게 있으면 최종 단계에서 다이얼로그로 확인해야 최종 풀이를 다시 만든다", async ({ page }) => {
    const state = await prepare(page);
    await page.goto("/fusion/revisit?step=final&saju=1&tci=1");
    await expect(page.getByText("사주를 다시 분석하고 기질도 다시 검사했어요.")).toBeVisible();
    await page.getByRole("button", { name: "최종 풀이 다시 만들기" }).click();
    const dialog = page.getByRole("dialog", { name: "최종 풀이를 다시 만들까요?" });
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: `${OUTPUT}/final-dialog.png` });
    expect(state.fusionPosts).toBe(0);
    await dialog.getByRole("button", { name: "다시 만들기" }).click();
    await expect.poll(() => state.fusionPosts).toBe(1);
    await expect(page).toHaveURL(/\/fusion$/);
  });

  test("기질 재검사는 저장된 응답을 불러오지 않고 중간 저장도 하지 않는다", async ({ page }) => {
    const state = await prepare(page);
    await page.goto("/tci?variant=short&retake=1&next=revisit&saju=1");
    await expect(page.getByText("다시 검사 중 · 끝까지 마치면 새 응답으로 저장돼요")).toBeVisible();
    await expect(page.locator("input[type=radio]:checked")).toHaveCount(0);
    await page.locator(".likert label").first().click();
    await page.waitForTimeout(900);
    expect(state.tciPuts).toBe(0);
  });
});
