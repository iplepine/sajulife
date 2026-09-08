import { expect, type Page, type Route, type Request as PWRequest, type TestInfo } from "@playwright/test";

/**
 * 브라우저 점검 후속 E2E의 공통 준비물.
 *
 * ★가짜 응답만으로는 보호 화면에 못 들어간다★ — 서버 인증 미들웨어는 브라우저 라우트 가로채기의
 * 영향을 받지 않는다. 그래서 ★승인된 테스트 계정으로 먼저 로그인★한 뒤, 같은 브라우저
 * 컨텍스트에서 시나리오를 돌린다. 계정이 없으면 테스트는 ★건너뜀★으로 남는다(통과 아님).
 *
 * ★비밀번호를 코드에 적지 않는다★ — 환경변수로만 받는다.
 *
 * ★가짜 응답은 페이지 이동 '전'에 등록한다★ — 이동 후에 걸면 첫 조회를 놓친다.
 */

export const E2E_EMAIL = process.env.E2E_EMAIL;
export const E2E_PASSWORD = process.env.E2E_PASSWORD;
export const hasCredentials = Boolean(E2E_EMAIL && E2E_PASSWORD);

export const SKIP_REASON =
  "보호 화면 시나리오는 승인된 테스트 계정이 필요해요. E2E_EMAIL·E2E_PASSWORD를 설정하세요.";

/** 승인된 테스트 계정으로 로그인한다. 이후 같은 컨텍스트의 요청은 인증된 상태로 나간다. */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(E2E_EMAIL!);
  await page.locator('input[type="password"]').fill(E2E_PASSWORD!);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL(/\/(dashboard|onboarding)(?:\?|$)/);
}

/** 가상 인물 A·B — 실제 개인정보를 쓰지 않는다. */
export const PERSON_A = { id: "p_audit_a", label: "가상 에이", birthDate: "1990-03-11", gender: "female" as const };
export const PERSON_B = { id: "p_audit_b", label: "가상 비", birthDate: "1988-11-02", gender: "male" as const };

export function peopleStore(activeId: string) {
  return {
    people: [
      { ...PERSON_A, createdAt: "2026-01-01T00:00:00.000Z" },
      { ...PERSON_B, createdAt: "2026-01-02T00:00:00.000Z" },
    ],
    activeId,
  };
}

export type JsonBody = Record<string, unknown>;

/** 한 주소에 JSON 응답을 고정한다. GET만 가로채고 나머지 메서드는 통과시킨다. */
export async function mockJson(page: Page, url: string | RegExp, body: JsonBody, status = 200): Promise<void> {
  await page.route(url, async (route: Route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
}

/** 한 주소를 실패시킨다 — 500·네트워크 끊김·401을 각각 재현한다. */
export async function failRoute(
  page: Page,
  url: string | RegExp,
  mode: "server" | "network" | "auth",
): Promise<void> {
  await page.route(url, async (route: Route) => {
    if (route.request().method() !== "GET") return route.fallback();
    if (mode === "network") return route.abort("failed");
    const status = mode === "auth" ? 401 : 500;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: mode === "auth" ? "Unauthorized" : "서버 오류" }),
    });
  });
}

/**
 * ★비용·데이터 변경을 일으키는 요청이 새면 테스트가 실패해야 한다.★
 * 생성 POST를 세되 실제 서버로는 보내지 않는다. 반환된 counter로 호출 횟수를 검사한다.
 */
export function countGenerationPosts(page: Page, pattern: RegExp): { count: () => number } {
  let count = 0;
  void page.route(pattern, async (route: Route) => {
    if (route.request().method() !== "POST") return route.fallback();
    count += 1;
    await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ status: "generating", startedAt: new Date().toISOString() }) });
  });
  return { count: () => count };
}

/**
 * 테스트가 예상하지 못한 생성 요청을 잡는 안전망.
 * 감시 대상 밖의 생성 POST가 한 번이라도 나가면 테스트를 실패시킨다.
 */
export function guardUnexpectedGeneration(page: Page, allowed: RegExp[] = []): void {
  const generationPost = /\/api\/(saju\/personal|saju\/yongsin|tci\/report|fusion\/report|family\/report|compat\/report|consult)$/;
  page.on("request", (req: PWRequest) => {
    if (req.method() !== "POST") return;
    const url = new URL(req.url());
    if (!generationPost.test(url.pathname)) return;
    if (allowed.some((p) => p.test(url.pathname))) return;
    throw new Error(`예상하지 못한 생성 요청이 나갔습니다: ${url.pathname}`);
  });
}

/** 모바일 폭 검사 — Playwright 프로젝트는 데스크톱 하나뿐이라 테스트에서 직접 지정한다. */
export const MOBILE_WIDTHS = [375, 390] as const;

export async function setViewport(page: Page, width: number, height = 844): Promise<void> {
  await page.setViewportSize({ width, height });
}

/** 요소가 화면 가로 경계 안에 온전히 들어오는지. 가로 스크롤 없음만으로 통과시키지 않는다. */
export async function expectWithinViewport(page: Page, selector: string): Promise<void> {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${selector} 가 화면에 없습니다`).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box!.x, `${selector} 왼쪽이 화면 밖입니다`).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width, `${selector} 오른쪽이 화면 밖입니다`).toBeLessThanOrEqual(viewport!.width);
}

/** 건너뛴 테스트를 '검증 완료'로 세지 않도록, 사유를 리포트에 남긴다. */
export function noteSkip(testInfo: TestInfo, reason: string): void {
  testInfo.annotations.push({ type: "skip-reason", description: reason });
}
