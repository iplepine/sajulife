import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { GUEST_STATE_FILE } from "./fixtures/audit/session";
import { TCI_STANDALONE_REPORT_ENABLED } from "../lib/tci/standalone";

/**
 * 기질 단독 풀이를 꺼 둔 동안(2026-10-15 대표 결정 — "입구를 없애줘. 나중에 기능은 살릴 수도 있으니까").
 * 기질 검사는 사주+기질 풀이의 2단계로만 쓰고, 단독 풀이로 들어가는 입구·출구를 모두 닫는다.
 * 이미 받은 풀이는 계속 볼 수 있다. 스위치(lib/tci/standalone.ts)를 켜면 이 파일은 건너뛴다.
 */

test.use({ storageState: GUEST_STATE_FILE, viewport: { width: 390, height: 844 } });

const READY = { scores: [], readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 }, status: "idle" };
const SAVED = { report: "{}", generatedAt: "2026-09-01T00:00:00.000Z", provider: "test", model: "test" };

/** 기질 풀이 조회를 고정하고, 생성 POST는 서버로 보내지 않고 센다. */
async function mockTciReport(page: Page, saved: typeof SAVED | null) {
  const state = { posts: 0 };
  await page.route("**/api/tci/report", async (route) => {
    if (route.request().method() === "POST") {
      state.posts += 1;
      return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ status: "generating" }) });
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...READY, saved }) });
  });
  return state;
}

test.describe("기질 단독 풀이 — 꺼져 있을 때", () => {
  test.skip(TCI_STANDALONE_REPORT_ENABLED, "스위치가 켜져 있으면 기질 단독 풀이가 열려 있다");

  test("받은 풀이가 없으면 만들기 대신 사주+기질로 안내하고, 옛 만들기 링크로 와도 생성 0회", async ({ page }) => {
    const state = await mockTciReport(page, null);
    await page.goto("/tci/report?generate=1");
    const closed = page.getByRole("region", { name: /기질 결과는.*사주와 겹쳐 풀어드려요/ });
    await expect(closed.getByRole("link", { name: "사주+기질 풀이 보기" })).toHaveAttribute("href", "/explore/fusion");
    await expect(page.getByRole("button", { name: "내 기질 풀이 만들기" })).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).search, { message: "옛 만들기 표시가 주소에 남았습니다" }).toBe("");
    await page.waitForTimeout(500);
    expect(state.posts, "꺼져 있는데 기질 풀이 생성이 시작됐습니다").toBe(0);
  });

  test("이미 받은 기질 풀이는 그대로 보이고, 다시 생성은 없다", async ({ page }) => {
    const state = await mockTciReport(page, SAVED);
    await page.goto("/tci/report");
    await expect(page.getByText(/저장된 풀이/)).toBeVisible();
    await expect(page.getByRole("button", { name: "다시 생성" })).toHaveCount(0);
    expect(state.posts).toBe(0);
  });

  test("기질 검사를 따로 열어도 사주+기질 올해 운세로 이어진다고 말하고, 그 길로 간다", async ({ page }) => {
    await page.goto("/tci?variant=short");
    await expect(page.getByRole("note")).toContainText("사주와 겹쳐 올해 운세");
    await expect(page.getByRole("link", { name: "← 설문 선택" })).toHaveAttribute("href", "/tci?next=fusion");
  });

  test("기질 소개 화면은 사주+기질 소개로 보낸다", async ({ page }) => {
    await page.goto("/explore/temperament");
    await page.waitForURL(/\/explore\/fusion$/);
  });

  test("풀이 기록에는 받은 기질 풀이가 있을 때만 '보기'가 남는다", async ({ page }) => {
    await mockTciReport(page, null);
    await page.goto("/materials");
    await expect(page.getByRole("link", { name: /사주 \+ 기질/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /나의 기질/ })).toHaveCount(0);

    await page.unroute("**/api/tci/report");
    await mockTciReport(page, SAVED);
    await page.reload();
    const card = page.getByRole("link", { name: /나의 기질/ });
    await expect(card).toHaveAttribute("href", "/tci/report");
    await expect(card).toContainText("보기");
  });

  test("서버도 새 기질 풀이 생성을 막는다", async ({ page }) => {
    // ★page.request★ — 브라우저 컨텍스트의 게스트 세션 쿠키를 공유해야 인증된 요청이 된다.
    const res = await page.request.post("/api/tci/report");
    expect(res.status(), "꺼져 있는데 서버가 생성을 받았습니다").toBe(403);
    expect((await res.json()).code).toBe("TCI_STANDALONE_CLOSED");
  });
});
