import { expect, test, type Page } from "@playwright/test";
import { GUEST_STATE_FILE, packageInfo, peopleStore, PERSON_A, PERSON_B } from "./fixtures/audit/session";

test.use({ storageState: GUEST_STATE_FILE, viewport: { width: 390, height: 844 } });

async function mockJourney(page: Page, empty = false) {
  let active = empty ? "self" : PERSON_A.id;
  let switches = 0;
  let additions = 0;
  let failNextStatus = false;
  const people = empty ? [{ id: "self", label: "", createdAt: "" }] : peopleStore(active).people;
  const added = { id: "p_new", label: "", createdAt: "" };
  const unexpectedWrites: string[] = [];
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (path === "/api/people") {
      if (method === "PATCH") { switches++; active = route.request().postDataJSON().activeId; }
      if (method === "POST") { additions++; active = added.id; }
      return route.fulfill({ json: { people: additions ? [...people, added] : people, activeId: active, added } });
    }
    if (method !== "GET") {
      unexpectedWrites.push(path);
      return route.fulfill({ status: 403, json: {} });
    }
    if (path === "/api/package") {
      if (failNextStatus) {
        failNextStatus = false;
        return route.fulfill({ status: 503, json: {} });
      }
      const hasProfile = active === PERSON_A.id || active === PERSON_B.id;
      return route.fulfill({ json: { ...packageInfo({
        hasProfile,
        personal: { saved: active === PERSON_B.id, status: "idle" },
      }), personId: active } });
    }
    return route.fulfill({ json: { profile: null, saved: null } });
  });
  return { counts: () => ({ switches, additions, unexpectedWrites }), failStatus: () => { failNextStatus = true; } };
}

test("홈 → 소개 → 등록 인물 선택 → 선택한 사람의 기질 검사로 이어간다", async ({ page }) => {
  const mock = await mockJourney(page);
  await page.goto("/dashboard");
  await page.locator(".home-fusion-cta").click();
  await page.getByRole("link", { name: /무료로 한번에 보기/ }).click();
  const list = page.getByRole("list", { name: "등록된 인물" });
  await expect(list.getByRole("button").first()).toContainText("현재 선택");
  await list.getByRole("button", { name: /가상 비/ }).click();
  await expect(page).toHaveURL(/\/tci\?variant=short&next=fusion/);
  expect(mock.counts()).toEqual({ switches: 1, additions: 0, unexpectedWrites: [] });
});

test("새 인물만 입력 화면을 열고 상태 조회 재시도에서 중복 추가하지 않는다", async ({ page }) => {
  const mock = await mockJourney(page);
  await page.goto("/fusion/start");
  await expect(page.getByRole("heading", { name: "누구의 풀이를 볼까요?" })).toBeVisible();
  mock.failStatus();
  await page.getByRole("button", { name: "새 인물 정보 입력" }).click();
  await page.getByRole("button", { name: "선택한 인물로 다시 시도" }).click();
  await expect(page).toHaveURL(/\/onboarding\?next=/);
  await expect(page.getByRole("heading", { name: "사주 정보를 알려주세요" })).toBeVisible();
  expect(mock.counts()).toEqual({ switches: 0, additions: 1, unexpectedWrites: [] });
});

test("등록된 인물이 없으면 추가 생성 없이 기존 입력 단계로 이어간다", async ({ page }) => {
  const mock = await mockJourney(page, true);
  await page.goto("/fusion/start");
  await expect(page).toHaveURL(/\/onboarding\?next=/);
  expect(mock.counts()).toEqual({ switches: 0, additions: 0, unexpectedWrites: [] });
});
