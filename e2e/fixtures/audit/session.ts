import { expect, type Page, type Route } from "@playwright/test";

/**
 * 브라우저 점검 후속 E2E의 공통 준비물.
 *
 * ★가짜 응답만으로는 보호 화면에 못 들어간다★ — 서버 인증 미들웨어는 브라우저 라우트
 * 가로채기의 영향을 받지 않는다. 그래서 ★먼저 실제 세션을 만든 뒤★ 같은 컨텍스트에서 돈다.
 *
 * ★세션은 앱의 게스트(익명) 진입로로 만든다★ — 랜딩의 시작 버튼이 부르는
 * `supabase.auth.signInAnonymously()`가 그 경로다(app/page.tsx). 이메일·비밀번호·회원가입이
 * 필요 없고, 매 실행마다 새 익명 사용자가 만들어져 ★기존 사용자 데이터와 섞이지 않는다.★
 * 사주 정보 같은 선행 데이터는 그 게스트 스코프에 가상 값으로 직접 넣는다.
 *
 * 세션은 ★실행당 한 번만★ 만든다(e2e/guest.setup.ts) — 테스트마다 익명 로그인을 부르면
 * Supabase 요청 rate limit에 걸린다. 각 스펙은 저장된 storageState를 test.use로 붙여 쓴다.
 * 회원 계정이 꼭 필요한 시나리오(공유 링크 재발급·폐기)는 기존 스펙이 E2E_EMAIL·E2E_PASSWORD를 쓴다.
 *
 * ★가짜 응답은 페이지 이동 '전'에 등록한다★ — 이동 후에 걸면 첫 조회를 놓친다.
 */

/**
 * 게스트 세션 저장 파일. e2e/guest.setup.ts가 쓰고, 보호 화면 스펙이 test.use로 읽는다.
 * ★세션 토큰이 들어 있으므로 Git에서 제외한다(.gitignore: playwright/.auth/).★
 */
export const GUEST_STATE_FILE = "playwright/.auth/guest.json";

/** 가상 사주 정보 — 실제 개인정보를 쓰지 않는다. 선행 데이터가 필요한 화면용. */
export const FIXTURE_PROFILE = {
  name: "가상 에이",
  birthDate: "1990-03-11",
  birthTime: "09:30",
  gender: "female",
  calendar: "solar",
} as const;

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

/**
 * 인물 목록과 ★전환(PATCH)★을 함께 가짜로 만든다.
 * GET만 가로채면 전환 요청이 실서버로 나가 없는 인물 id로 실패한다 — 화면이 안 바뀐다.
 */
export async function mockPeopleSwitch(
  page: Page,
  initialActiveId: string,
  opts: { switchStatus?: number; switchDelayMs?: number } = {},
): Promise<{ activeId: () => string }> {
  let active = initialActiveId;
  await page.route("**/api/people", async (route: Route) => {
    const method = route.request().method();
    if (method === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(peopleStore(active)) });
    }
    if (method === "PATCH") {
      if (opts.switchDelayMs) await new Promise((r) => setTimeout(r, opts.switchDelayMs));
      if (opts.switchStatus && opts.switchStatus >= 400) {
        return route.fulfill({ status: opts.switchStatus, contentType: "application/json", body: JSON.stringify({ error: "전환 실패" }) });
      }
      const body = route.request().postDataJSON() as { activeId?: string };
      if (body?.activeId) active = body.activeId;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(peopleStore(active)) });
    }
    await route.fallback();
  });
  return { activeId: () => active };
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
