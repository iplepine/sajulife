import { expect, test } from "@playwright/test";
import { SKIP_REASON, failRoute, hasCredentials, mockJson, noteSkip, signIn } from "./fixtures/audit/session";

/**
 * ★200 빈 목록★과 ★401·500·네트워크 오류★를 화면이 구분해야 한다.
 * 서버 오류를 "아직 기록이 없어요"로 안내하지 않는다.
 */

const ACTION = {
  id: "a1", title: "가상 액션", timeframe: "오늘", source: "personal",
  sourceLabel: "개인 사주", done: false, createdAt: "2026-09-01T00:00:00.000Z",
};
const CONSULT = { id: "c1", question: "가상 질문", basisLabel: "용신", generatedAt: "2026-09-01T00:00:00.000Z" };

test.describe("조회 실패와 데이터 없음", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasCredentials) noteSkip(testInfo, SKIP_REASON);
    test.skip(!hasCredentials, SKIP_REASON);
    await signIn(page);
  });

  test("정상 0건은 '없음'으로 보여준다", async ({ page }) => {
    await mockJson(page, "**/api/consult", { history: [], hasProfile: true });
    await mockJson(page, "**/api/coaching", { items: [] });
    await page.goto("/history");
    await expect(page.getByText("아직 용신상담 기록이 없어요")).toBeVisible();
    await expect(page.getByText("진행 중인 액션이 없어요")).toBeVisible();
  });

  test("정상 1건은 목록으로 보여준다", async ({ page }) => {
    await mockJson(page, "**/api/consult", { history: [CONSULT], hasProfile: true });
    await mockJson(page, "**/api/coaching", { items: [ACTION] });
    await page.goto("/history");
    await expect(page.getByText("가상 질문")).toBeVisible();
    await expect(page.getByText("가상 액션")).toBeVisible();
  });

  for (const mode of ["server", "network"] as const) {
    test(`${mode} 오류는 '기록 없음'이 아니라 실패와 재시도로 보여준다`, async ({ page }) => {
      await failRoute(page, "**/api/consult", mode);
      await mockJson(page, "**/api/coaching", { items: [ACTION] });
      await page.goto("/history");

      await expect(page.getByText("용신상담 기록을 불러오지 못했어요")).toBeVisible();
      await expect(page.getByText("아직 용신상담 기록이 없어요")).toHaveCount(0);
      // 상담만 실패했으므로 정상적으로 불러온 액션은 남아야 한다.
      await expect(page.getByText("가상 액션")).toBeVisible();
      await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
    });
  }

  test("401은 세션 만료로 처리하고 돌아올 주소를 실어 로그인으로 보낸다", async ({ page }) => {
    await failRoute(page, "**/api/consult", "auth");
    await mockJson(page, "**/api/coaching", { items: [] });
    await page.goto("/history");

    const link = page.getByRole("link", { name: "다시 로그인하기" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", `/?redirectedFrom=${encodeURIComponent("/history")}`);
  });

  test("재시도가 성공하면 원래 데이터가 다시 보인다", async ({ page }) => {
    let attempt = 0;
    await page.route("**/api/consult", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      attempt += 1;
      if (attempt === 1) return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ history: [CONSULT], hasProfile: true }) });
    });
    await mockJson(page, "**/api/coaching", { items: [] });

    await page.goto("/history");
    await page.getByRole("button", { name: "다시 시도" }).click();
    await expect(page.getByText("가상 질문")).toBeVisible();
  });

  test("재시도는 해당 조회만 반복하고 새 생성은 호출하지 않는다", async ({ page }) => {
    let posts = 0;
    page.on("request", (req) => {
      if (req.method() === "POST" && /\/api\/(consult|coaching)$/.test(new URL(req.url()).pathname)) posts += 1;
    });
    await failRoute(page, "**/api/consult", "server");
    await mockJson(page, "**/api/coaching", { items: [] });
    await page.goto("/history");
    await page.getByRole("button", { name: "다시 시도" }).click();
    await page.waitForTimeout(400);
    expect(posts, "재시도가 생성 요청을 보냈습니다").toBe(0);
  });

  test("풀이 기록 조회가 실패하면 '생성 가능'으로 그리지 않는다", async ({ page }) => {
    await failRoute(page, "**/api/saju/personal", "server");
    await page.goto("/materials");
    await expect(page.getByText("풀이 기록을 불러오지 못했어요")).toBeVisible();
    await expect(page.getByText("생성 가능")).toHaveCount(0);
  });

  test("상담 화면의 이력 조회 실패도 '기록 없음'으로 보이지 않는다", async ({ page }) => {
    await failRoute(page, "**/api/consult", "server");
    await page.goto("/consult");
    await expect(page.getByText("지난 상담을 불러오지 못했어요")).toBeVisible();
    await expect(page.getByText("아직 기록이 없어요")).toHaveCount(0);
  });
});
