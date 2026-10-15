import { expect, test, type Page } from "@playwright/test";
import { GUEST_STATE_FILE, mockPackage } from "./fixtures/audit/session";

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

async function withSavedReport(page: Page, generatedAt = "2026-10-12T09:00:00.000Z") {
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
      body: JSON.stringify({ saved: { report: REPORT, generatedAt, provider: "test", model: "test", actions: [] }, status: "idle" }),
    });
  });
  return state;
}

test.describe("사주 풀이 다시 보기", () => {
  test("풀이가 첫 화면에 먼저 보이고, 사주표는 접어서 아래에 둔다", async ({ page }) => {
    await withSavedReport(page);
    await page.goto("/saju");
    const header = page.getByRole("region", { name: "가상 테스트용 한 줄 정의" });
    await expect(header).toContainText("10월 12일에 풀어둔 네 사주야");
    const firstSection = page.locator(".rv-sec").first();
    await expect(firstSection).toBeVisible();
    const top = await firstSection.evaluate((el) => el.getBoundingClientRect().top);
    expect(top, "풀이가 첫 화면 밖에서 시작합니다").toBeLessThan(844);
    const fold = page.locator("details.saju-chart-fold");
    await expect(fold).toContainText("내 사주표 다시 보기");
    await expect(fold).not.toHaveAttribute("open", "");
  });

  test("펼쳐 둔 섹션은 다시 들어와도 열려 있다", async ({ page }) => {
    await withSavedReport(page, "2026-10-12T09:00:01.000Z");
    await page.goto("/saju");
    await page.locator(".rv-sec summary").nth(2).click();
    await expect(page.locator(".rv-sec").nth(2)).toHaveAttribute("open", "");
    await page.reload();
    await expect(page.locator(".rv-sec").nth(2)).toHaveAttribute("open", "");
    await expect(page.locator(".rv-sec[open]")).toHaveCount(1);
  });

  test("다시 만들기는 덮어쓴다는 걸 한 번 더 묻는다", async ({ page }) => {
    const state = await withSavedReport(page);
    await page.goto("/saju");
    await page.getByRole("button", { name: "풀이 다시 만들기" }).click();
    const confirm = page.getByRole("group", { name: "풀이 다시 만들기 확인" });
    await expect(confirm).toContainText("지금 내용은 남지 않아요");
    await confirm.getByRole("button", { name: "그대로 두기" }).click();
    expect(state.posts, "취소했는데 생성이 시작됐습니다").toBe(0);
    await page.getByRole("button", { name: "풀이 다시 만들기" }).click();
    await page.getByRole("button", { name: "다시 만들기", exact: true }).click();
    await expect.poll(() => state.posts).toBe(1);
  });

  test("옛 링크(?generate=1)로 와도 새로 만들지 않고 주소만 정리한다", async ({ page }) => {
    const state = await withSavedReport(page);
    await page.goto("/saju?generate=1");
    await expect(page.locator(".rv-sec").first()).toBeVisible();
    await expect.poll(() => new URL(page.url()).search).toBe("");
    expect(state.posts).toBe(0);
  });

  test("홈의 끝난 단계에서 내 사주로 돌아갈 수 있다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/dashboard");
    const steps = page.getByRole("list", { name: "사주+기질 풀이 진행" });
    const back = steps.getByRole("link", { name: /사주 풀이.*다시 보기/ });
    await expect(back).toHaveAttribute("href", "/saju");
  });
});
