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

test.describe("사주 풀이 다시 보기", () => {
  test("저장본에 액션 후보가 있어도 코칭 등록 카드는 표시하지 않는다", async ({ page }) => {
    await withSavedReport(page);
    let coachingPosts = 0;
    await page.route("**/api/coaching", async (route) => {
      if (route.request().method() === "POST") coachingPosts += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) });
    });
    await page.goto("/saju");
    await expect(page.locator(".rv-sec").first()).toBeVisible();
    await expect(page.locator(".ap-suggest")).toHaveCount(0);
    await expect(page.getByText("코칭 액션 플랜", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "전체 등록", exact: true })).toHaveCount(0);
    await expect(page.getByText("가상 코칭 후보", { exact: true })).toHaveCount(0);
    await expect(page.locator("details.saju-chart-fold")).toBeVisible();
    expect(coachingPosts).toBe(0);
  });

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

  test("명리로 보기는 접혀 있고, 펼치면 사주명식·대운 표와 조후·격국·억부가 나온다", async ({ page }) => {
    await withSavedReport(page, "2026-10-12T09:00:02.000Z", 2);
    await page.goto("/saju");
    const fold = page.locator("details.saju-myeongri");
    await expect(fold).toContainText("사주명식·대운 표 · 조후·격국·억부");
    await expect(fold).not.toHaveAttribute("open", "");
    // 접힌 한 줄이 풀이를 첫 화면 밖으로 밀어내지 않는다.
    expect(await page.locator(".rv-sec").first().evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(844);

    await fold.locator("summary").click();
    const table = fold.locator(".mnr--compact");
    await expect(table).toBeVisible();
    await expect(table.locator(".mnr-sec-title")).toHaveText(["원국", "대운"]);
    for (const name of ["조후 · 건강·환경", "격국 · 적성·그릇", "억부 · 수행능력"]) {
      await expect(fold.getByRole("article", { name })).toBeVisible();
    }
    await expect(fold.getByRole("link", { name: /용신 풀이에서/ })).toHaveAttribute("href", "/saju/yongsin");
    // 새 판정 기준으로 쓴 풀이엔 '기준을 손봤어' 안내가 없다.
    await expect(fold.getByRole("note")).toHaveCount(0);
  });

  test("판정 기준을 손보기 전에 쓴 풀이면, 펼친 명리 칸이 새 기준이라고 알려 준다", async ({ page }) => {
    await withSavedReport(page, "2026-10-12T09:00:03.000Z");
    await page.goto("/saju");
    const fold = page.locator("details.saju-myeongri");
    await fold.locator("summary").click();
    await expect(fold.getByRole("note")).toContainText("판정 기준을 더 꼼꼼하게 손봤어");
  });

  test("홈의 끝난 단계에서 내 사주로 돌아갈 수 있다", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/dashboard");
    const steps = page.getByRole("list", { name: "사주+기질 풀이 진행" });
    const back = steps.getByRole("link", { name: /사주.*다시 보기/ });
    await expect(back).toHaveAttribute("href", "/saju");
  });
});
