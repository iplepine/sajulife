import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("registered account", () => {
  test("a verified staging account can sign in without invoking Gemini", async ({ page }) => {
    test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD for the staging-account smoke flow.");

    await page.goto("/auth/login");
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.getByRole("button", { name: "로그인" }).click();

    await page.waitForURL(/\/(dashboard|onboarding)(?:\?|$)/);
    await expect(page.locator("body")).not.toContainText("Invalid login credentials");
  });
});
