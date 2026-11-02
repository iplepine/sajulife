import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { TCI_DIMENSIONS } from "../lib/tci/questions";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockJson, mockPackage } from "./fixtures/audit/session";

/** 합성 저장본만 사용한다. 생성 API는 성공 가짜 응답으로도 호출하지 않는다. */
const IDS = [
  "타고난 기질과 성격", "강점과 잠재력", "인생의 큰 흐름", "조후 분석", "격국 분석", "억부 분석",
  "세운 분석", "필요한 것", "행동지침", "인생 로드맵", "성공 조언",
];

const report = JSON.stringify({
  title: "가상 사주 리포트 읽기 예시",
  keywords: [{ word: "기준", desc: "가상 설명" }],
  sections: IDS.map((id) => ({ id, summary: `${id} 요약`, body: `${id}의 합성 본문입니다.` })),
  lifeline: [{ startAge: 31, endAge: 40, season: "봄", seasonLabel: "새로운 봄", tone: "배우고 채우는 시기", summary: "가상 흐름 설명" }],
  roadmap: { character: "합성 인물", resourceInput: "입력", resourceOutput: "출력", riskShadow: "부담", riskTool: "조정", direction: "방향" },
  actionPlan: [],
  disclaimer: "합성 테스트 데이터입니다.",
});

const screenshotDirectory = "output/report-revision-2026-11-03";
const finalReport = FUSION_SECTION_TITLES.map((title, index) =>
  `${title}\n\n사주에서 읽은 특징과 이번 검사 응답을 함께 살피는 가상 예시입니다. ${index + 1}번째 관점에서는 실제로 확인된 고민을 먼저 보고, 강점과 부담이 드러날 수 있는 조건을 구분합니다. 단정적인 예언보다 나에게 맞는 선택을 점검하는 참고 풀이입니다.`,
).join("\n\n");

async function capture(page: Page, kind: "personal" | "fusion", width: number) {
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ path: `${screenshotDirectory}/${kind}-${width}.png`, fullPage: true });
}

async function mockReading(page: Page) {
  const state = { generationPosts: 0 };
  await page.route("**/api/saju/personal", async (route) => {
    if (route.request().method() === "POST") {
      state.generationPosts += 1;
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "테스트에서는 생성 금지" }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      status: "idle", saved: { report, generatedAt: "2026-11-03T00:00:00.000Z", provider: "test", model: "synthetic", judgment: 2 },
    }) });
  });
  await mockJson(page, "**/api/saju/chart", {
    saju: calculateSaju(FIXTURE_PROFILE), name: FIXTURE_PROFILE.name, gender: "여성", occupation: "가상 직업", currentAge: 36, currentYear: 2026, cautionMonths: [],
  });
  await mockPackage(page, { personal: { saved: true, status: "idle" } });
  return state;
}

async function mockFinalReading(page: Page) {
  const state = { generationPosts: 0 };
  await page.route("**/api/fusion/report", async (route) => {
    if (route.request().method() === "POST") {
      state.generationPosts += 1;
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "테스트에서는 생성 금지" }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
      saved: {
        report: finalReport, generatedAt: "2026-11-03T00:00:00.000Z", provider: "test", model: "synthetic", judgment: 2,
        meta: {
          headline: "사주와 응답을 함께 읽는 가상 최종 풀이",
          scores: (["NS", "HA", "RD", "PS", "SD", "CO", "ST"] as const).map((dimension) => ({
            dimension, ...TCI_DIMENSIONS[dimension], raw: 15, max: 25, percent: 60,
          })),
          // 옛 저장 메타에 값이 있어도 새 통합 화면에서 미측정 축으로 표시하지 않아야 한다.
          flexibility: 99,
        }, actions: [],
      },
    }) });
  });
  await mockJson(page, "**/api/saju/chart", {
    saju: calculateSaju(FIXTURE_PROFILE), name: FIXTURE_PROFILE.name, gender: "여성", occupation: "가상 직업", currentAge: 36, currentYear: 2026, cautionMonths: [],
  });
  await mockPackage(page, { personal: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 }, fusion: { saved: true, status: "idle" } });
  return state;
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("사주에서 최종 통합 리포트로 이어지는 읽기", () => {
  for (const width of [390, 1440]) {
    test(`${width}px에서 새 소제목·첫 해석·최종 통합 안내를 읽는다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const state = await mockReading(page);
      await page.goto("/saju");
      const sections = page.locator(".rv-sec--personal");
      await expect(sections).toHaveCount(11);
      for (const i of [0, 1, 2]) await expect(sections.nth(i)).toHaveAttribute("open", "");
      await expect(sections.nth(3)).not.toHaveAttribute("open", "");
      await expect(sections.nth(0).locator("summary")).toContainText("타고난 기질과 성격");
      await expect(sections.nth(3).locator("summary")).toContainText("조후 분석");
      await expect(sections.nth(6).locator("summary")).toContainText("세운 분석");
      await expect(sections.nth(10).locator("summary")).toContainText("성공 조언");
      await expect(page.getByRole("link", { name: "기질 검사하고 최종 풀이 보기" })).toHaveAttribute("href", "/tci?variant=short&next=fusion");
      expect(await page.locator(".page").innerText()).not.toContain("올해 운세는 요즘의 너까지 봐야 정확");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(state.generationPosts).toBe(0);
      await capture(page, "personal", width);
    });

    test(`${width}px에서 최종 통합은 전체 해석을 열고 시기 근거를 접어 둔다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const state = await mockFinalReading(page);
      await page.goto("/fusion");
      const perspectives = page.getByRole("region", { name: "사주와 기질을 함께 읽는 다섯 관점", includeHidden: true });
      await expect(perspectives).toBeVisible();
      for (const name of ["큰 나무", "타는 불", "너른 흙", "흐르는 물", "단단한 쇠"]) {
        await expect(perspectives).toContainText(name);
      }
      await expect(page.getByRole("navigation", { name: "종합 풀이 목차", exact: true })).toBeVisible();
      await expect(page.locator(".fusion-cmap")).toHaveCount(0);
      await expect(page.getByText("사주 × 기질 연결 지도", { exact: true })).toHaveCount(0);
      await expect(page.getByText("다섯 기운이 도는 길", { exact: true })).toHaveCount(0);
      await expect(page.getByText("유연성", { exact: true })).toHaveCount(0);
      await expect(page.locator(".fusion-report .rv-sec")).toHaveCount(FUSION_SECTION_TITLES.length);
      await expect(page.locator(".fusion-report .rv-sec[open]")).toHaveCount(FUSION_SECTION_TITLES.length);

      const reference = page.locator(".report-folio[data-kind='fusion'] details").filter({ has: page.getByText("풀이 기준과 참고 자료", { exact: true }) });
      await expect(reference).not.toHaveAttribute("open", "");
      await reference.locator(":scope > summary").click();
      const timingSummary = page.getByText("시기 해석의 근거 보기 · 작년부터 내년까지", { exact: true });
      const timing = timingSummary.locator("..");
      await expect(timing).not.toHaveAttribute("open", "");
      expect(await timing.evaluate((element) => {
        const body = document.querySelector(".report-folio[data-kind='fusion'] .rv");
        return !!body && Boolean(body.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
      })).toBe(true);
      await timingSummary.click();
      await expect(timing.locator(".year-trio")).toBeVisible();
      await timingSummary.click();
      await expect(timing).not.toHaveAttribute("open", "");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(state.generationPosts).toBe(0);
      await capture(page, "fusion", width);
    });
  }

  test("처음 열린 세 섹션을 모두 접은 선택도 재방문에서 유지한다", async ({ page }) => {
    await mockReading(page);
    await page.goto("/saju");
    await expect(page.locator(".rv-sec--personal[open]")).toHaveCount(3);
    for (const i of [0, 1, 2]) await page.locator(".rv-sec--personal summary").nth(i).click();
    await expect(page.locator(".rv-sec--personal[open]")).toHaveCount(0);
    await page.reload();
    await expect(page.locator(".rv-sec--personal")).toHaveCount(11);
    await expect(page.locator(".rv-sec--personal[open]")).toHaveCount(0);
  });

  test("최종 통합의 전체 섹션을 접은 선택도 재방문에서 유지한다", async ({ page }) => {
    await mockFinalReading(page);
    await page.goto("/fusion");
    await expect(page.locator(".fusion-report .rv-sec[open]")).toHaveCount(FUSION_SECTION_TITLES.length);
    await page.locator(".fusion-report .rv-tools").getByRole("button", { name: "모두 접기", exact: true }).click();
    await expect(page.locator(".fusion-report .rv-sec[open]")).toHaveCount(0);
    await page.reload();
    await expect(page.locator(".fusion-report .rv-sec")).toHaveCount(FUSION_SECTION_TITLES.length);
    await expect(page.locator(".fusion-report .rv-sec[open]")).toHaveCount(0);
  });
});
