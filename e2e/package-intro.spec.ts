import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE, failRoute, mockPackage } from "./fixtures/audit/session";

/**
 * 사주+기질 풀이 소개(/explore/fusion) — 2026-10-15 대표 피드백.
 * 홈 버튼이 바로 결제 화면으로 넘어가니 뭘 하는 건지 모른 채 넘어갔다. 시작 전인 사람은 소개부터 보고,
 * ①이렇게 진행돼(세 단계) ②이런 풀이가 나와(예시) ③떠 있는 시작 버튼으로 한 번에 시작한다.
 */

test.use({ storageState: GUEST_STATE_FILE, viewport: { width: 390, height: 844 } });

const START = { name: "사주+기질 풀이 시작" } as const;

test.describe("사주+기질 소개 화면", () => {
  test("베타 무료로 아직 아무것도 없으면 홈 버튼이 소개로 간다", async ({ page }) => {
    await mockPackage(page, { hasProfile: false });
    await page.goto("/dashboard");
    const cta = page.locator(".home-fusion-cta");
    await expect(cta).toContainText("사주와 기질, 한 번에 보기");
    await expect(cta).toHaveAttribute("href", "/explore/fusion");
    await expect(page.locator(".home-package-step.is-now")).toHaveCount(0);
    await expect(page.locator(".home-package-price")).toContainText("베타 기간 무료");
  });

  test("세 단계와 예시 풀이를 보여주고, 시작 버튼은 첫 화면부터 탭바 위에 떠 있다", async ({ page }) => {
    await mockPackage(page, { hasProfile: false });
    await page.goto("/explore/fusion");
    const flow = page.getByRole("region", { name: "세 단계, 한 번에 이어서" });
    await expect(flow.getByRole("listitem")).toHaveCount(3);
    for (const title of ["사주 풀이", "기질 검사", "사주+기질 올해 운세"]) await expect(flow).toContainText(title);

    const samples = page.getByRole("region", { name: "받게 될 두 가지 풀이" });
    await expect(samples).toContainText("가상의 인물");
    await expect(samples.locator(".fi-sample-badge")).toHaveText(["예시", "예시"]);

    const start = page.getByRole("region", START);
    const button = start.getByRole("link", { name: /무료로 한번에 보기/ });
    expect(decodeURIComponent((await button.getAttribute("href")) ?? "")).toBe("/onboarding?next=/saju?generate=1");
    await expect(start).toContainText("정가 4,900원");

    const box = await start.boundingBox();
    const tabTop = await page.locator(".tabbar").evaluate((el) => el.getBoundingClientRect().top);
    expect(box, "시작 버튼이 없습니다").not.toBeNull();
    // 받침은 틈이 안 생기게 탭바 밑으로 1px쯤 겹쳐 붙는다 — 버튼 자체가 탭바에 가리면 안 된다.
    expect(box!.y + box!.height, "시작 받침이 탭바 위에 붙어 있지 않습니다").toBeLessThanOrEqual(tabTop + 2);
    const btn = await start.getByRole("link").boundingBox();
    expect(btn!.y + btn!.height, "시작 버튼이 탭바에 가립니다").toBeLessThanOrEqual(tabTop);
    expect(box!.y, "시작 버튼이 첫 화면에 없습니다").toBeLessThan(844);

    // 끝까지 내리면 떠 있던 버튼이 제자리에 앉고, 아래 안내 문구가 이어서 보인다.
    await page.locator(".fi-start-note").scrollIntoViewIfNeeded();
    await expect(page.locator(".fi-start-note")).toBeVisible();
  });

  test("실결제면 '4,900원에 한번에 보기' → 결제 화면", async ({ page }) => {
    await mockPackage(page, { entitled: false }, "portone");
    await page.goto("/dashboard");
    await expect(page.locator(".home-fusion-cta")).toHaveAttribute("href", "/explore/fusion");
    await page.goto("/explore/fusion");
    const start = page.getByRole("region", START);
    await expect(start.getByRole("link", { name: /4,900원에 한번에 보기/ })).toHaveAttribute("href", "/checkout");
    await expect(page.locator(".fi-start-note")).toContainText("전액 환불");
  });

  test("결제 준비 중이면 시작 버튼을 잠근다", async ({ page }) => {
    await mockPackage(page, { entitled: false }, "unavailable");
    await page.goto("/explore/fusion");
    await expect(page.getByRole("region", START).getByRole("button", { name: "결제 준비 중" })).toBeDisabled();
  });

  test("실결제로 이미 산 사람은 소개를 다시 돌지 않는다", async ({ page }) => {
    await mockPackage(page, { hasProfile: false }, "portone");
    await page.goto("/dashboard");
    await expect(page.locator(".home-fusion-cta")).toContainText("사주 정보 입력하기");
  });

  test("이미 시작했으면 빠진 단계로 — 사주 풀이가 있으면 기질 검사", async ({ page }) => {
    await mockPackage(page, { personal: { saved: true, status: "idle" } });
    await page.goto("/explore/fusion");
    const start = page.getByRole("region", START);
    await expect(start.getByRole("link", { name: /기질 검사하고 올해 운세 보기/ })).toHaveAttribute("href", "/tci?variant=short&next=fusion");
    await expect(start.locator(".fi-start-price")).toHaveCount(0);
  });

  test("올해 운세까지 받았으면 보기로", async ({ page }) => {
    await mockPackage(page, {
      personal: { saved: true, status: "idle" },
      tci: { complete: true, answered: 35, total: 35 },
      fusion: { saved: true, status: "idle" },
    });
    await page.goto("/explore/fusion");
    await expect(page.getByRole("region", START).getByRole("link", { name: /내 올해 운세 보기/ })).toHaveAttribute("href", "/fusion");
  });

  test("상태 조회가 실패하면 결제·시작으로 밀지 않는다", async ({ page }) => {
    await failRoute(page, "**/api/package", "server");
    await page.goto("/explore/fusion");
    const start = page.getByRole("region", START);
    await expect(start.getByRole("link", { name: /내 풀이 화면으로/ })).toHaveAttribute("href", "/fusion");
    await expect(start).not.toContainText("한번에 보기");
  });

  test("소개를 여는 것만으로 생성 요청이 나가지 않는다", async ({ page }) => {
    let posts = 0;
    await page.route(/\/api\/(saju\/personal|tci\/report|fusion\/report|package\/checkout)$/, async (route) => {
      if (route.request().method() === "POST") { posts += 1; return route.fulfill({ status: 202, body: "{}" }); }
      await route.fallback();
    });
    await mockPackage(page, { hasProfile: false });
    await page.goto("/explore/fusion");
    await expect(page.getByRole("region", START).getByRole("link")).toBeVisible();
    await page.waitForTimeout(600);
    expect(posts, "소개 방문만으로 생성·주문 요청이 나갔습니다").toBe(0);
  });
});
