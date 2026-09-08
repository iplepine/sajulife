import { expect, test as setup } from "@playwright/test";
import { GUEST_STATE_FILE, FIXTURE_PROFILE } from "./fixtures/audit/session";

/**
 * 보호 화면 시나리오가 쓸 세션을 ★실행당 한 번만★ 만든다.
 *
 * ★왜 한 번인가★ — 테스트마다 익명 로그인을 부르면 Supabase의 요청 rate limit에 바로 걸린다
 * ("Request rate limit reached"). 세션은 하나 만들어 storageState로 돌려쓴다.
 *
 * ★왜 익명 세션인가★ — 랜딩의 시작 버튼이 부르는 `signInAnonymously()`가 앱이 원래 제공하는
 * 진입로다(app/page.tsx). 회원가입·이메일 확인·비밀번호가 필요 없고, 실행마다 새 익명 사용자라
 * 기존 사용자 데이터와 섞이지 않는다.
 *
 * ★저장 파일에는 세션 토큰이 들어 있다★ — playwright/.auth/ 는 .gitignore에 있다.
 */
setup("게스트 세션과 가상 사주 정보를 준비한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /내 인생 흐름 읽기|이어서 시작하기/ }).click();

  // 실패하면 원인을 화면에서 그대로 읽어 알려준다 — rate limit이 가장 흔하다.
  const landed = await page
    .waitForURL(/\/(onboarding|dashboard)(?:\?|$)/, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (!landed) {
    const reason = await page.locator(".error").first().innerText().catch(() => "");
    throw new Error(
      `게스트 세션을 만들지 못했습니다${reason ? `: ${reason}` : "."}\n` +
        "'Request rate limit reached'이면 Supabase 익명 로그인 한도예요. 잠시 뒤 다시 실행하세요.",
    );
  }

  // 선행 데이터가 필요한 화면을 위해 가상 사주 정보를 이 게스트 스코프에 넣는다.
  const res = await page.request.put("/api/profile", { data: FIXTURE_PROFILE });
  expect(res.ok(), `가상 사주 정보 저장 실패 (HTTP ${res.status()})`).toBe(true);

  // dev 서버는 첫 방문에서 라우트를 컴파일한다. 홈의 초기 조회에는 4초 타임아웃이 걸려 있어,
  // 컴파일이 그보다 오래 걸리면 조회가 중단돼 첫 테스트만 엉뚱한 상태를 본다.
  // 준비 단계에서 한 번 밟아 그 비용을 여기서 치른다.
  await page.goto("/dashboard");
  await page.locator(".life-path-cta").waitFor({ timeout: 30_000 });

  await page.context().storageState({ path: GUEST_STATE_FILE });
});
