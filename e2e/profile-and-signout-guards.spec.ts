import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE } from "./fixtures/audit/session";

/**
 * 되돌리기 어려운 입력·동작 앞의 안전장치.
 *
 * - 성별: 예전엔 '여성'이 미리 눌린 채 시작해, 고르지 않은 사람도 여성으로 저장됐다.
 *   성별은 대운 방향을 바꾸므로 조용히 틀리면 풀이 전체가 어긋난다.
 * - 게스트 로그아웃: 익명 사용자는 이메일·비밀번호가 없어 로그아웃하면 그 데이터로 다시 못 들어온다.
 *   한 번 더 묻고, 먼저 회원 전환을 권해야 한다.
 */

// 준비된 게스트 세션으로 보호 화면에 들어간다(e2e/guest.setup.ts).
test.use({ storageState: GUEST_STATE_FILE });

test.describe("성별은 직접 골라야 저장된다", () => {
  test("아무것도 눌리지 않은 채 시작하고, 고르지 않으면 저장 요청을 보내지 않는다", async ({ page }) => {
    const saved: Array<{ gender?: string }> = [];
    // 저장은 가짜로 받는다 — 공유 게스트 세션의 실제 사주 정보를 바꾸지 않는다.
    await page.route("**/api/profile", async (route) => {
      if (route.request().method() === "PUT") {
        saved.push(route.request().postDataJSON() as { gender?: string });
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: null }) });
    });
    await page.goto("/onboarding");

    const gender = page.getByRole("group", { name: "성별" });
    await expect(gender.getByRole("button", { name: "여성" })).toHaveAttribute("aria-pressed", "false");
    await expect(gender.getByRole("button", { name: "남성" })).toHaveAttribute("aria-pressed", "false");

    await page.getByPlaceholder("예: 김서연").fill("가상 에이");
    await page.getByLabel("출생 연도(네 자리)").fill("1990");
    await page.getByLabel("출생 월").fill("03");
    await page.getByLabel("출생 일").fill("11");
    await page.getByLabel(/시각 모름/).check();

    const submit = page.getByRole("button", { name: "저장하고 시작" });
    await submit.click();
    await expect(page.getByText("성별을 선택하세요.")).toBeVisible();
    expect(saved, "성별을 고르지 않았는데 저장됐습니다").toHaveLength(0);

    await gender.getByRole("button", { name: "남성" }).click();
    await expect(gender.getByRole("button", { name: "남성" })).toHaveAttribute("aria-pressed", "true");
    await submit.click();
    await expect.poll(() => saved.length).toBe(1);
    expect(saved[0].gender).toBe("male");
  });
});

test.describe("게스트 로그아웃", () => {
  test("한 번 더 묻고 회원 전환을 먼저 권하며, 취소하면 그대로 남는다", async ({ page }) => {
    // 안전망 — 무슨 일이 있어도 공유 게스트 세션을 실제로 끊지 않는다.
    let logoutCalls = 0;
    await page.route("**/auth/v1/logout**", (route) => {
      logoutCalls += 1;
      return route.abort();
    });
    await page.goto("/account");

    await page.getByRole("button", { name: "로그아웃", exact: true }).click();
    const dialog = page.getByRole("alertdialog", { name: "로그아웃하면 지금 데이터를 다시 못 찾아요" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "이메일로 회원 전환하고 지키기" })).toHaveAttribute("href", "/auth/signup");
    // 실수로 한 번 더 눌러도 나가지 않게 기본 초점은 '취소'.
    await expect(dialog.getByRole("button", { name: "취소" })).toBeFocused();

    await dialog.getByRole("button", { name: "취소" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "로그아웃", exact: true })).toBeVisible();
    expect(logoutCalls, "확인 전에 로그아웃 요청이 나갔습니다").toBe(0);
  });
});
