import { expect, test } from "@playwright/test";
import { SKIP_REASON, hasCredentials, noteSkip, signIn } from "./fixtures/audit/session";

/**
 * 설문의 ★마지막 응답★이 저장되기 전에 결과 화면으로 넘어가지 않아야 한다.
 *
 * 예전 구현은 400ms 디바운스 저장이었고, 화면이 사라질 때 타이머를 지웠다.
 * 마지막 답을 찍고 바로 "풀이 보기"를 누르면 그 타이머가 취소돼 ★마지막 답이 사라졌다.★
 */

type Answers = Record<string, number>;

/** 저장 요청을 가로채 지연·실패를 만들고, 마지막으로 받은 응답 묶음을 기록한다. */
async function interceptSave(page: Parameters<typeof signIn>[0], opts: { delayMs?: number; fail?: boolean }) {
  const received: Answers[] = [];
  await page.route("**/api/tci/answers", async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    const body = route.request().postDataJSON() as { answers?: Answers };
    received.push(body?.answers ?? {});
    if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
    if (opts.fail) return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "저장 실패" }) });
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ tci: { variant: "short", answers: body?.answers ?? {} } }) });
  });
  return received;
}

/** 현재 문항에 답하고 다음으로. 마지막 문항이면 이동까지 기다린다. */
async function answerAll(page: Parameters<typeof signIn>[0], count: number) {
  for (let i = 0; i < count; i += 1) {
    await page.locator('.likert label').nth(2).click();
    await page.getByRole("button", { name: /다음 문항|풀이 보기|저장 중/ }).click();
  }
}

test.describe("기질 설문 저장", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasCredentials) noteSkip(testInfo, SKIP_REASON);
    test.skip(!hasCredentials, SKIP_REASON);
    await signIn(page);
  });

  test("저장이 늦어도 마지막 응답이 저장 요청에 포함된다", async ({ page }) => {
    const received = await interceptSave(page, { delayMs: 1200 });
    await page.goto("/tci?variant=short");
    await expect(page.locator(".likert")).toBeVisible();

    const total = Number((await page.locator(".mono").first().innerText()).split("/")[1].trim());
    await answerAll(page, total);
    await page.waitForURL("**/tci/report", { timeout: 15_000 });

    const last = received[received.length - 1];
    expect(Object.keys(last).length, "마지막 저장 요청에 전 문항이 들어 있지 않습니다").toBe(total);
  });

  test("저장 중에는 완료 버튼이 잠기고 '저장 중'을 보여준다", async ({ page }) => {
    await interceptSave(page, { delayMs: 1500 });
    await page.goto("/tci?variant=short");
    const total = Number((await page.locator(".mono").first().innerText()).split("/")[1].trim());
    for (let i = 0; i < total - 1; i += 1) {
      await page.locator('.likert label').nth(2).click();
      await page.getByRole("button", { name: "다음 문항" }).click();
    }
    await page.locator('.likert label').nth(2).click();
    await page.getByRole("button", { name: "풀이 보기" }).click();
    await expect(page.getByRole("button", { name: "저장 중…" })).toBeDisabled();
  });

  test("저장이 실패하면 이동하지 않고 응답을 유지한 채 재시도할 수 있다", async ({ page }) => {
    await interceptSave(page, { fail: true });
    await page.goto("/tci?variant=short");
    const total = Number((await page.locator(".mono").first().innerText()).split("/")[1].trim());
    await answerAll(page, total);

    await expect(page.locator(".error")).toContainText("마지막 응답을 저장하지 못했");
    expect(new URL(page.url()).pathname, "저장 실패인데 결과로 넘어갔습니다").toBe("/tci");
    // 답은 그대로 남아 있어야 한다.
    await expect(page.locator('.likert input:checked')).toHaveCount(1);
  });

  test("부분 응답은 완료로 처리되지 않는다", async ({ page }) => {
    await interceptSave(page, {});
    await page.goto("/tci?variant=short");
    const total = Number((await page.locator(".mono").first().innerText()).split("/")[1].trim());
    // 한 문항만 비워두고 마지막까지 이동한다.
    for (let i = 0; i < total; i += 1) {
      if (i !== 1) await page.locator('.likert label').nth(2).click();
      const name = i === total - 1 ? "풀이 보기" : "다음 문항";
      await page.getByRole("button", { name }).click();
      if (i === 1) {
        await expect(page.locator(".error")).toContainText("문항을 선택해 주세요");
        await page.locator('.likert label').nth(2).click();
        await page.getByRole("button", { name: "다음 문항" }).click();
      }
    }
  });

  test("서버도 부분 응답으로는 생성을 시작하지 않는다", async ({ request }) => {
    // 응답을 하나만 저장한 상태로 만든 뒤 생성 POST를 시도한다.
    await request.put("/api/tci/answers", { data: { variant: "short", answers: { ns1: 3 } } });
    const res = await request.post("/api/tci/report");
    expect(res.status(), "부분 응답인데 생성이 수락됐습니다").toBe(400);
    expect(await res.text()).toContain("설문");
  });
});
