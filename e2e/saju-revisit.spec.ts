import { expect, test, type Page } from "@playwright/test";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockPackage } from "./fixtures/audit/session";
import { calculateSaju } from "../lib/saju/calculator";

/**
 * 사주 풀이를 이미 받은 사람이 다시 들어올 때.
 *
 * 예전엔 저장된 풀이가 사주표·그래프 아래(폰에서 두 화면 밑)에 있었고, 섹션은 들어올 때마다 다 접혀 있었고,
 * '다시 생성'이 복사·공유와 같은 무게로 놓여 한 번 눌리면 지금 풀이를 덮어썼다.
 */

test.use({ storageState: GUEST_STATE_FILE, viewport: { width: 390, height: 844 } });

/** 가상 풀이 — 실제 개인정보·실제 생성 결과가 아니다. */
const REPORT = JSON.stringify({
  title: "가상 테스트용 한 줄 정의",
  keywords: [{ word: "시험", desc: "가상 풀이" }],
  sections: ["오행구성", "기본성향", "직업운", "금전운", "인간관계운", "건강운", "대운", "평생 실행전략"].map((id) => ({
    id,
    summary: `${id} 요약 문장`,
    body: `─ 소제목\n${id} 본문`,
  })),
  lifeline: [],
  roadmap: { character: "가상", resourceInput: "", resourceOutput: "", riskShadow: "", riskTool: "", direction: "" },
  disclaimer: "가상 풀이예요.",
});

async function withSavedReport(page: Page, generatedAt = "2026-10-12T09:00:00.000Z", judgment?: number) {
  const state = { posts: 0 };
  await mockPackage(page, { personal: { saved: true, status: "idle" } });
  await page.route("**/api/saju/personal", async (route) => {
    if (route.request().method() === "POST") {
      state.posts += 1;
      return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ status: "generating", startedAt: new Date().toISOString() }) });
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ saved: { report: REPORT, generatedAt, provider: "test", model: "test", actions: [{ title: "가상 코칭 후보", timeframe: "오늘", hint: "화면에서 등록하지 않는 보존 데이터" }], judgment }, status: "idle" }),
    });
  });
  return state;
}

const sheet = (page: Page) => page.getByRole("article", { name: "사주 풀이 보고서", exact: true });

/**
 * 2026-11-18: 사주 풀이 화면도 최종 풀이의 사주 탭과 같은 한 장 보고서를 보여준다(명식·대운 표부터).
 * 다시 분석은 '종합 사주 다시 보기'(다시 보기권 1회) 한 곳에서만 한다 — 이 화면에서 바로 다시 만들지 않는다.
 */
test.describe("사주 풀이 다시 보기", () => {
  test("저장본에 액션 후보가 있어도 코칭 등록 카드는 표시하지 않는다", async ({ page }) => {
    await withSavedReport(page);
    let coachingPosts = 0;
    await page.route("**/api/coaching", async (route) => {
      if (route.request().method() === "POST") coachingPosts += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });
    await page.goto("/saju");
    await expect(sheet(page)).toBeVisible();
    await expect(page.locator(".ap-suggest")).toHaveCount(0);
    await expect(page.getByText("코칭 액션 플랜", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "전체 등록", exact: true })).toHaveCount(0);
    await expect(page.getByText("가상 코칭 후보", { exact: true })).toHaveCount(0);
    expect(coachingPosts).toBe(0);
  });

  test("명식 표와 풀이가 첫 화면에서 바로 시작한다", async ({ page }) => {
    await withSavedReport(page);
    await page.goto("/saju");
    await expect(page.getByRole("heading", { name: "사주 풀이", level: 1 })).toBeVisible();
    await expect(sheet(page).getByRole("table", { name: "사주명식", exact: true })).toBeVisible();
    const top = await sheet(page).evaluate((el) => el.getBoundingClientRect().top);
    expect(top, "보고서가 첫 화면 밖에서 시작합니다").toBeLessThan(844);
    // 옛 저장본도 원래 절을 그대로 보여준다.
    await expect(sheet(page)).toContainText("오행구성 본문");
  });

  test("이 화면에서는 바로 다시 만들지 않고, 최종 풀이를 받은 사람은 다시 보기로 안내한다", async ({ page }) => {
    const state = await withSavedReport(page);
    await mockPackage(page, { personal: { saved: true, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } });
    await page.goto("/saju");
    await expect(sheet(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "풀이 다시 만들기" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "종합 사주 다시 보기" })).toHaveAttribute("href", "/fusion/revisit");
    expect(state.posts).toBe(0);
  });

  test("옛 링크(?generate=1)로 와도 새로 만들지 않고 주소만 정리한다", async ({ page }) => {
    const state = await withSavedReport(page);
    await page.goto("/saju?generate=1");
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => new URL(page.url()).search).toBe("");
    expect(state.posts).toBe(0);
  });

  test("판정 기준을 손보기 전에 쓴 풀이면 보고서 아래에 알려 준다", async ({ page }) => {
    await withSavedReport(page, "2026-10-12T09:00:03.000Z");
    await page.goto("/saju");
    await expect(sheet(page).getByRole("note")).toContainText("기운 판정 기준을 손보기 전에 작성되었습니다");
  });

  for (const width of [360, 390, 430, 1440]) {
    test(`${width}px — 네 기둥과 대운이 가로 스크롤 없이 보인다`, async ({ page }) => {
      const profile = { ...FIXTURE_PROFILE, birthTime: width === 360 ? "" : FIXTURE_PROFILE.birthTime };
      const saju = calculateSaju(profile);
      await withSavedReport(page, undefined, 2);
      await page.route("**/api/saju/chart", route => route.fulfill({ json: { saju, currentYear: 2026, currentAge: 36 } }));
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/saju");
      const natal = sheet(page).getByRole("table", { name: "사주명식", exact: true });
      await expect(natal.locator("thead tr").nth(1).locator("th")).toHaveText(["시", "일", "월", "년"]);
      await expect(natal.locator("tbody tr").first().locator("td").first()).toHaveText(width === 360 ? "－" : saju.pillars.time!.gan.hanja);
      await expect(sheet(page).getByRole("table", { name: "대운", exact: true }).locator("tbody tr").first().locator("td")).toHaveCount(saju.daewoon.length);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }

  test("홈의 끝난 단계에서 내 사주로 돌아갈 수 있다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/dashboard");
    const steps = page.getByRole("list", { name: "사주+기질 풀이 진행" });
    const back = steps.getByRole("link", { name: /사주.*열어 보기/ });
    await expect(back).toHaveAttribute("href", "/saju");
  });
});
