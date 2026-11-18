import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { TCI_DIMENSIONS, type TciDimension } from "../lib/tci/questions";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockJson, mockPackage } from "./fixtures/audit/session";

/** 저장된 계산/응답 자료만 표시한다. 실제 AI·공유·코칭 등록 요청은 전부 차단한다. */
const VALUES: Array<[TciDimension, number]> = [["NS", 5], ["HA", 11], ["RD", 15], ["PS", 22], ["SD", 13], ["CO", 19], ["ST", 25]];
const SCORES = VALUES.map(([dimension, raw]) => ({ dimension, ...TCI_DIMENSIONS[dimension], raw, max: 25, percent: raw * 4 }));
const LEGACY = ["먼저 결론: 네 반복 패턴 한눈에 보기", "원래의 너: 사주로 타고난 결", "요즘의 너: 기질 검사로 본 지금 상태", "타고난 결과 길러진 결", "잘 풀릴 때", "꼬일 때", "자꾸 반복되는 장면", "숨은 강점과 사각지대", "갈림길 사용법", "앞으로 6~12개월", "오늘부터 바꿀 세 가지"];
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
  await expect(folio.getByRole("link", { name: "종합 사주 다시 보기", exact: true })).toHaveAttribute("href", "/fusion/revisit");
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("종합 탭의 중복 자료 제거", () => {
  for (const width of [390, 1440]) {
    for (const legacy of [false, true]) {
      test(`${width}px ${legacy ? "이전" : "현재"} 저장본은 종합 해석만 보여준다`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        const { state } = await prepare(page, { legacy });
        await page.goto("/fusion");
        const folio = page.locator(".report-folio[data-kind='fusion']");
        await expect(folio).toBeVisible();
        await expect(visual(page)).toHaveCount(0);
        await expect(folio.locator("[role=meter], .year-trio, .fusion-cmap")).toHaveCount(0);
        await expect(folio.getByText("1번째 원문 해석입니다.", { exact: true })).toHaveCount(1);
        await expect(folio.locator(".rv-sec")).toHaveCount(legacy ? LEGACY.length - 2 : FUSION_SECTION_TITLES.length);
        await noCoaching(page);
        await folio.locator("#folio-fusion-reference > summary").click();
        await expect(folio).toContainText("‘사주 풀이’ 탭");
        await expect(folio).toContainText("‘기질 검사’ 탭");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await mkdir("output/report-cleanup-2026-11-18", { recursive: true });
        await page.screenshot({ path: `output/report-cleanup-2026-11-18/fusion-${legacy ? "legacy" : "current"}-${width}.png` });
        expect(state.writes).toBe(0);
        expect(state.errors).toEqual([]);
      });
    }
  }
});
