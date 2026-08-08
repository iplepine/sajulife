import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test("a seeded staging account can reissue and revoke a public link without an AI call", async ({ page }) => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD for the seeded staging-account share flow.");

  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(email!);
  await page.locator('input[type="password"]').fill(password!);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL(/\/(dashboard|onboarding)(?:\?|$)/);

  // 이 계정에는 사전에 개인 리포트 1건이 있어야 한다. 여기서는 Gemini를 절대 호출하지 않는다.
  const created = await page.context().request.post("/api/share", {
    data: { kind: "personal", expiry: "30d", mode: "create" },
  });
  test.skip(created.status() === 404, "The E2E account needs one pre-seeded personal report.");
  expect(created.status()).toBe(200);
  const current = (await created.json()) as { url: string; expiresAt: string | null };
  expect(current.expiresAt).not.toBeNull();

  const reissued = await page.context().request.post("/api/share", {
    data: { kind: "personal", expiry: "30d", mode: "reissue" },
  });
  expect(reissued.status()).toBe(200);
  const replacement = (await reissued.json()) as { url: string };
  expect(replacement.url).not.toBe(current.url);

  await page.goto(new URL(current.url).pathname);
  await expect(page.getByRole("heading", { name: "공유된 풀이를 찾을 수 없어요" })).toBeVisible();

  await page.goto(new URL(replacement.url).pathname);
  await expect(page.getByRole("heading", { name: /님의 .*풀이/ })).toBeVisible();

  const revoked = await page.context().request.delete("/api/share", { data: { kind: "personal" } });
  expect(revoked.status()).toBe(200);

  await page.goto(new URL(replacement.url).pathname);
  await expect(page.getByRole("heading", { name: "공유된 풀이를 찾을 수 없어요" })).toBeVisible();
});
