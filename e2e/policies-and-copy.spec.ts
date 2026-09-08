import { expect, test } from "@playwright/test";

/**
 * 정책 링크·회사 정보·설문 설명 — ★로그인 없이 확인할 수 있는 것들★.
 * 이 파일은 인증 없이 돌아가므로 건너뛰지 않는다.
 */

const DUMMY_PATTERNS = [/000-00-00000/, /2026-서울중랑-0000/];

test.describe("정책 문서와 공개 문구", () => {
  test("정책 세 문서는 비로그인 상태에서 전문을 읽을 수 있다", async ({ page }) => {
    for (const [path, heading] of [
      ["/terms", "이용약관"],
      ["/privacy", "개인정보 처리방침"],
      ["/refund", "환불 정책"],
    ] as const) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} 가 비로그인에서 열려야 합니다`).toBe(200);
      expect(new URL(page.url()).pathname, `${path} 가 로그인으로 리다이렉트됐습니다`).toBe(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      // 확정 전 초안이라는 사실을 숨기지 않는다.
      await expect(page.getByRole("note")).toContainText("검토 중인 초안");
    }
  });

  test("정책 문서 사이를 서로 오갈 수 있다", async ({ page }) => {
    await page.goto("/terms");
    await page.getByRole("navigation", { name: "다른 정책 문서" }).getByRole("link", { name: "환불 정책" }).click();
    await page.waitForURL("**/refund");
    await expect(page.getByRole("heading", { level: 1, name: "환불 정책" })).toBeVisible();
  });

  test("더미 사업자 번호와 임시 신고 번호가 화면에 남아 있지 않다", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    for (const pattern of DUMMY_PATTERNS) {
      expect(body, `${pattern} 가 화면에 남아 있습니다`).not.toMatch(pattern);
    }
  });
});
