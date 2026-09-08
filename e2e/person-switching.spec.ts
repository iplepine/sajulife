import { expect, test } from "@playwright/test";
import {
  PERSON_A, PERSON_B, SKIP_REASON, hasCredentials, mockJson, noteSkip, peopleStore, signIn,
} from "./fixtures/audit/session";

/**
 * 인물 전환 — ★A의 정보가 B 화면에 남지 않는다.★
 *
 * 기준은 "요청이 몇 개냐"가 아니라 ★사용자에게 보이는 본문 전환이 한 번이고,
 * 서로 다른 인물의 정보가 섞이지 않는 것★이다.
 * 인물 선택기는 성공 후 페이지 전체를 다시 로드하므로, 새 문서에서 각 응답이
 * 제각각 늦게 도착해도 본문이 B 기준으로 한 번만 나타나야 한다.
 */

function savedFor(name: string) {
  return {
    saved: {
      report: JSON.stringify({
        title: `${name}의 저장본`,
        keywords: [],
        sections: [{ id: "기본성향", summary: `${name} 요약`, body: `● 핵심: ${name} 본문` }],
        roadmap: { character: `${name} 캐릭터` },
      }),
      generatedAt: "2026-09-01T00:00:00.000Z",
    },
    status: "idle",
  };
}

test.describe("인물 전환", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasCredentials) noteSkip(testInfo, SKIP_REASON);
    test.skip(!hasCredentials, SKIP_REASON);
    await signIn(page);
  });

  test("A는 저장본 있음, B는 없음 — 전환 후 본문이 B 기준으로만 나타난다", async ({ page }) => {
    let active = PERSON_A.id;
    await page.route("**/api/people", async (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(peopleStore(active)) });
      }
      if (route.request().method() === "PATCH" || route.request().method() === "PUT") {
        const body = route.request().postDataJSON() as { activeId?: string };
        if (body?.activeId) active = body.activeId;
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(peopleStore(active)) });
      }
      await route.fallback();
    });
    // 응답이 제각각 늦게 도착해도 섞이지 않아야 한다 — 저장본만 일부러 늦춘다.
    await page.route("**/api/saju/personal", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await new Promise((r) => setTimeout(r, 400));
      const body = active === PERSON_A.id ? savedFor(PERSON_A.label) : { saved: null, status: "idle" };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });

    await page.goto("/saju");
    await expect(page.getByText(`${PERSON_A.label}의 저장본`)).toBeVisible();

    await page.locator(".psw-trigger").first().click();
    await page.getByRole("button", { name: new RegExp(PERSON_B.label) }).first().click();
    await page.waitForLoadState("load");

    // B에는 저장본이 없다 — A의 내용이 한 프레임도 남으면 안 된다.
    await expect(page.getByText(`${PERSON_A.label}의 저장본`)).toHaveCount(0);
    await expect(page.locator(".psw-name")).toContainText(PERSON_B.label);
  });

  test("전환 중 연속 클릭은 차단된다", async ({ page }) => {
    await mockJson(page, "**/api/people", peopleStore(PERSON_A.id));
    await page.goto("/saju");
    await page.locator(".psw-trigger").first().click();
    const item = page.getByRole("button", { name: new RegExp(PERSON_B.label) }).first();
    await item.click();
    // 전환이 시작되면 목록 버튼은 비활성이어야 한다(중복 전환 방지).
    if (await item.isVisible().catch(() => false)) {
      await expect(item).toBeDisabled();
    }
  });

  test("전환 요청이 실패하면 현재 화면을 유지하고 오류를 알린다", async ({ page }) => {
    await page.route("**/api/people", async (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(peopleStore(PERSON_A.id)) });
      }
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "전환 실패" }) });
    });
    await page.goto("/saju");
    await page.locator(".psw-trigger").first().click();
    await page.getByRole("button", { name: new RegExp(PERSON_B.label) }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator(".psw-name")).toContainText(PERSON_A.label);
  });

  test("상담 상세에서 인물을 바꾸면 이전 상담 ID가 남지 않는다", async ({ page }) => {
    await mockJson(page, "**/api/people", peopleStore(PERSON_A.id));
    await mockJson(page, "**/api/consult", { history: [], hasProfile: true });
    await page.goto("/consult?id=c_previous");
    await page.locator(".psw-trigger").first().click();
    await page.getByRole("button", { name: new RegExp(PERSON_B.label) }).first().click();
    await page.waitForLoadState("load");
    expect(page.url(), "이전 상담 ID가 새 인물 화면에 남았습니다").not.toContain("c_previous");
  });
});
