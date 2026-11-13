import { expect, test } from "@playwright/test";

test.describe("public and account safety boundaries", () => {
  test("landing discloses public-link visibility without naming AI providers", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /타고난 나와/ })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("공유 링크는 누구나 열 수 있어요");
    // AI 제공자 이름은 화면에 쓰지 않는다(2026-11-14 대표 결정) — 처리 위탁 고지는 개인정보 처리방침에 있다.
    await expect(page.getByRole("note")).not.toContainText("OpenAI");
    await expect(page.getByRole("note")).not.toContainText("Gemini");
    await expect(page.getByRole("note")).not.toContainText("AI");
  });

  test("guest cannot create a public share link through the API", async ({ request }) => {
    const response = await request.post("/api/share", {
      data: { kind: "personal", expiry: "30d" },
    });

    expect(response.status()).toBe(401);
  });

  test("unknown public share token returns a non-disclosing 404", async ({ page }) => {
    const path = "/share/e2e-token-that-does-not-exist";
    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page.getByText("공유된 풀이를 찾을 수 없어요")).toBeVisible();

    const ogResponse = await page.request.get(`${path}/opengraph-image`);
    expect(ogResponse.status()).toBe(404);
  });

  test("login provides a password-recovery path", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("link", { name: "비밀번호 재설정" })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });
});
