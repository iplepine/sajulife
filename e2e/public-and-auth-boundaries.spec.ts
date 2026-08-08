import { expect, test } from "@playwright/test";

test.describe("public and account safety boundaries", () => {
  test("landing discloses AI data transfer and public-link visibility", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /사주로 나를 읽고/ })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Gemini");
    await expect(page.getByRole("note")).toContainText("공유 링크는 누구나 열 수 있어요");
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
