import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { GUEST_STATE_FILE, mockJson } from "./fixtures/audit/session";

/**
 * ★단순 방문·새로고침은 생성 요청 0회.★ 사용자가 누를 때만 1회.
 *
 * 예전엔 /tci/report·/fusion에 ★들어가기만 해도★ 자동으로 생성이 시작됐다.
 * 시간·비용이 들고 외부 제공자에 데이터가 나가는 일이라 방문만으로 일어나면 안 된다.
 */

function readyReport() {
  return { saved: null, scores: [], readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 }, status: "idle" };
}

/** 생성 POST를 세되 실제 서버로 보내지 않는다. */
async function countPosts(page: Page, url: string, body: unknown) {
  const state = { posts: 0 };
  await page.route(url, async (route) => {
    if (route.request().method() === "POST") {
      state.posts += 1;
      return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ status: "generating", startedAt: new Date().toISOString() }) });
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return state;
}

// 준비된 게스트 세션으로 보호 화면에 들어간다(e2e/guest.setup.ts).
test.use({ storageState: GUEST_STATE_FILE });

test.describe("생성은 방문이 아니라 의사로 시작된다", () => {
  test("기질 결과 화면 방문·새로고침은 생성 0회", async ({ page }) => {
    const state = await countPosts(page, "**/api/tci/report", readyReport());
    await page.goto("/tci/report");
    await expect(page.getByRole("button", { name: "내 기질 풀이 만들기" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "내 기질 풀이 만들기" })).toBeVisible();
    expect(state.posts, "방문만으로 생성이 시작됐습니다").toBe(0);
  });

  test("생성 전에 무엇을 만들고 무엇이 나가는지 설명한다", async ({ page }) => {
    await countPosts(page, "**/api/tci/report", readyReport());
    await page.goto("/tci/report");
    const panel = page.getByRole("region", { name: "풀이 만들기" });
    await expect(panel).toContainText("이번 풀이에 쓰는 것");
    await expect(panel).toContainText("OpenAI");
    await expect(panel.getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute("href", "/privacy");
  });

  test("명시적으로 누르면 생성 1회, 연타해도 1회", async ({ page }) => {
    const state = await countPosts(page, "**/api/tci/report", readyReport());
    await page.goto("/tci/report");
    const button = page.getByRole("button", { name: "내 기질 풀이 만들기" });
    // 두 번을 곧바로 누른다. 두 번째는 이미 잠겨 있어 무시돼야 한다(force로 잠금을 넘겨도 1회).
    await button.click();
    await button.click({ force: true, timeout: 2_000 }).catch(() => {});
    await page.waitForTimeout(500);
    expect(state.posts, "연타가 생성을 두 번 시작했습니다").toBe(1);
  });

  test("앞 화면에서 만들기를 눌러 왔으면 한 번만 자동 시작하고, 새로고침은 다시 시작하지 않는다", async ({ page }) => {
    const state = await countPosts(page, "**/api/tci/report", readyReport());
    await page.goto("/tci/report?generate=1");
    await page.waitForTimeout(600);
    expect(state.posts, "의사를 실어 왔는데 시작되지 않았습니다").toBe(1);
    // 주소의 표시는 소비돼야 한다 — 새로고침이 재생성으로 이어지면 안 된다.
    expect(new URL(page.url()).search).not.toContain("generate=1");
    await page.reload();
    await page.waitForTimeout(600);
    expect(state.posts, "새로고침이 재생성으로 이어졌습니다").toBe(1);
  });

  test("이미 생성 중이면 페이지를 다시 열어도 새로 시작하지 않는다", async ({ page }) => {
    const state = await countPosts(page, "**/api/tci/report", { ...readyReport(), status: "generating" });
    await page.goto("/tci/report?generate=1");
    await page.waitForTimeout(600);
    expect(state.posts).toBe(0);
  });

  test("저장본이 있으면 읽기가 먼저고 새 생성은 별도 버튼이다", async ({ page }) => {
    const saved = { ...readyReport(), saved: { report: "{}", generatedAt: "2026-09-01T00:00:00.000Z" } };
    const state = await countPosts(page, "**/api/tci/report", saved);
    await page.goto("/tci/report");
    await expect(page.getByRole("button", { name: "다시 생성" })).toBeVisible();
    await expect(page.getByRole("button", { name: "내 기질 풀이 만들기" })).toHaveCount(0);
    expect(state.posts).toBe(0);
  });

  test("융합 결과 화면도 방문만으로는 생성하지 않는다", async ({ page }) => {
    const state = await countPosts(page, "**/api/fusion/report", { saved: null, readiness: { hasProfile: true, hasTci: true }, status: "idle" });
    await page.goto("/fusion");
    await expect(page.getByRole("button", { name: "두 개 겹쳐서 풀이 만들기" })).toBeVisible();
    expect(state.posts).toBe(0);
  });

  test("생성 요청이 실패하면 이전 저장본은 남고 재시도는 사용자가 고른다", async ({ page }) => {
    const saved = { ...readyReport(), saved: { report: "{}", generatedAt: "2026-09-01T00:00:00.000Z" } };
    await page.route("**/api/tci/report", async (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "생성 실패" }) });
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(saved) });
    });
    await page.goto("/tci/report");
    await page.getByRole("button", { name: "다시 생성" }).click();
    await expect(page.locator(".error")).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 생성" })).toBeEnabled();
  });
});
