import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE } from "./fixtures/audit/session";
import type { Page } from "@playwright/test";


/**
 * 설문의 ★마지막 응답★이 저장되기 전에 결과 화면으로 넘어가지 않아야 한다.
 *
 * 예전 구현은 400ms 디바운스 저장이었고, 화면이 사라질 때 타이머를 지웠다.
 * 마지막 답을 찍고 바로 "풀이 보기"를 누르면 그 타이머가 취소돼 ★마지막 답이 사라졌다.★
 */

type Answers = Record<string, number>;

/** 저장 요청을 가로채 지연·실패를 만들고, 마지막으로 받은 응답 묶음을 기록한다. */
async function interceptSave(page: Page, opts: { delayMs?: number; fail?: boolean }) {
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

/** 지금 몇 번째 문항인지 보여주는 "N / 전체" 표시. */
function counter(page: Page) {
  return page.locator(".mono").first();
}

async function readPosition(page: Page) {
  const [at, total] = (await counter(page).innerText()).split("/").map((n) => Number(n.trim()));
  return { at, total };
}

async function readTotal(page: Page) {
  return (await readPosition(page)).total;
}

/**
 * 지금 문항부터 count개 답한다.
 * 보기를 손가락·마우스로 고르면 ★저절로 다음 문항으로 넘어간다★ — "다음 문항"을 또 누르지 않는다.
 * 넘어간 걸 확인한 뒤 다음 답을 찍는다(넘어가기 전에 찍으면 같은 문항에 두 번 답하게 된다).
 * 마지막 문항은 자동으로 넘기지 않으니 "풀이 보기"는 따로 누른다.
 */
async function answerNext(page: Page, count: number) {
  for (let i = 0; i < count; i += 1) {
    const { at, total } = await readPosition(page);
    await page.locator(".likert label").nth(2).click();
    if (at < total) await expect(counter(page)).toHaveText(`${at + 1} / ${total}`);
  }
}

async function answerAll(page: Page, total: number) {
  await answerNext(page, total);
  await page.getByRole("button", { name: "풀이 보기" }).click();
}

// 준비된 게스트 세션으로 보호 화면에 들어간다(e2e/guest.setup.ts).
test.use({ storageState: GUEST_STATE_FILE });

test.describe("기질 설문 저장", () => {
  test("저장이 늦어도 마지막 응답이 저장 요청에 포함된다", async ({ page }) => {
    const received = await interceptSave(page, { delayMs: 1200 });
    await page.goto("/tci?variant=short");
    await expect(page.locator(".likert")).toBeVisible();

    const total = await readTotal(page);
    await answerAll(page, total);
    await page.waitForURL("**/tci/report", { timeout: 15_000 });

    const last = received[received.length - 1];
    expect(Object.keys(last).length, "마지막 저장 요청에 전 문항이 들어 있지 않습니다").toBe(total);
  });

  test("저장 중에는 완료 버튼이 잠기고 '저장 중'을 보여준다", async ({ page }) => {
    await interceptSave(page, { delayMs: 1500 });
    await page.goto("/tci?variant=short");
    const total = await readTotal(page);
    await answerAll(page, total);
    await expect(page.getByRole("button", { name: "저장 중…" })).toBeDisabled();
  });

  test("저장이 실패하면 이동하지 않고 응답을 유지한 채 재시도할 수 있다", async ({ page }) => {
    await interceptSave(page, { fail: true });
    await page.goto("/tci?variant=short");
    const total = await readTotal(page);
    await answerAll(page, total);

    await expect(page.locator(".error")).toContainText("마지막 응답을 저장하지 못했");
    expect(new URL(page.url()).pathname, "저장 실패인데 결과로 넘어갔습니다").toBe("/tci");
    // 답은 그대로 남아 있어야 한다.
    await expect(page.locator('.likert input:checked')).toHaveCount(1);
  });

  test("부분 응답은 완료로 처리되지 않는다", async ({ page }) => {
    await interceptSave(page, {});
    await page.goto("/tci?variant=short");
    const total = await readTotal(page);
    // 첫 문항만 답하고, 둘째 문항은 비운 채 "다음 문항"을 누른다 — 넘어가지 않아야 한다.
    await answerNext(page, 1);
    await page.getByRole("button", { name: "다음 문항" }).click();
    await expect(page.locator(".error")).toContainText("문항을 선택해 주세요");
    await expect(counter(page)).toHaveText(`2 / ${total}`);
    // 비운 문항을 채우면 끝까지 갈 수 있다.
    await answerNext(page, total - 1);
    await page.getByRole("button", { name: "풀이 보기" }).click();
    await page.waitForURL("**/tci/report", { timeout: 15_000 });
  });

  test("보기를 누르면 다음 문항으로 넘어가고, 키보드로 보기를 훑을 땐 넘어가지 않는다", async ({ page }) => {
    await interceptSave(page, {});
    await page.goto("/tci?variant=short");
    const total = await readTotal(page);
    await page.locator(".likert label").nth(2).click();
    await expect(counter(page)).toHaveText(`2 / ${total}`);

    // 방향키로 고르는 도중에 문항이 바뀌면 원하는 답을 못 고른다.
    await page.locator(".likert input").first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".likert input:checked")).toHaveCount(1);
    await page.waitForTimeout(500);
    await expect(counter(page)).toHaveText(`2 / ${total}`);
  });

  test("서버도 부분 응답으로는 생성을 시작하지 않는다", async ({ page }) => {
    // ★page.request★를 쓴다 — 브라우저 컨텍스트의 게스트 세션 쿠키를 공유해야 인증된 요청이 된다.
    // 응답을 하나만 저장한 상태로 만든 뒤 생성 POST를 시도한다.
    await page.request.put("/api/tci/answers", { data: { variant: "short", answers: { ns1: 3 } } });
    const res = await page.request.post("/api/tci/report");
    expect(res.status(), "부분 응답인데 생성이 수락됐습니다").toBe(400);
    expect(await res.text()).toContain("설문");
  });
});
