import { expect, test } from "@playwright/test";
import {
  MOBILE_WIDTHS, SKIP_REASON, expectWithinViewport, hasCredentials, noteSkip, setViewport, signIn,
} from "./fixtures/audit/session";

/**
 * 375·390px 인물 선택 버튼 경계 / 소개 제목 줄바꿈 / PC 상담 폭.
 *
 * ★가로 스크롤이 없다는 조건만으로 통과시키지 않는다★ — 잘린 영역을 숨기면 스크롤도 안 생긴다.
 * 실제 요소의 좌우 경계가 화면 안에 있는지를 본다.
 */

test.describe("반응형 레이아웃", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasCredentials) noteSkip(testInfo, SKIP_REASON);
    test.skip(!hasCredentials, SKIP_REASON);
    await signIn(page);
  });

  for (const width of MOBILE_WIDTHS) {
    test(`${width}px 용신 검증 화면에서 인물 선택 버튼이 화면 안에 들어온다`, async ({ page }) => {
      await setViewport(page, width);
      await page.goto("/saju/yongsin-check");
      const trigger = page.locator(".psw-trigger");
      if ((await trigger.count()) === 0) {
        test.skip(true, "이 계정에는 용신 데이터가 없어 헤더가 그려지지 않습니다.");
      }
      await expectWithinViewport(page, ".psw-trigger");

      // 펼친 메뉴와 포커스 테두리도 화면 안에서 열려야 한다.
      await trigger.first().click();
      await expectWithinViewport(page, ".psw-menu");
    });

    test(`${width}px 가족 소개 제목에 한 글자만 남는 줄이 없다`, async ({ page }) => {
      await setViewport(page, width);
      await page.goto("/explore/family");
      const title = page.locator(".pi-hero-copy h1");
      await expect(title).toBeVisible();

      const lastLine = await title.evaluate((el) => {
        const node = [...el.childNodes].reverse().find((n) => n.nodeType === Node.TEXT_NODE);
        if (!node) return "";
        const text = node.textContent ?? "";
        const range = document.createRange();
        let lastTop: number | null = null;
        let lastBreak = 0;
        for (let i = 0; i < text.length; i += 1) {
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const top = Math.round(range.getBoundingClientRect().top);
          if (lastTop === null) lastTop = top;
          else if (top > lastTop) { lastTop = top; lastBreak = i; }
        }
        return text.slice(lastBreak).trim();
      });
      expect(lastLine.length, `마지막 줄에 "${lastLine}" 한 글자만 남았습니다`).toBeGreaterThan(1);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, "가로 넘침이 있습니다").toBe(false);
    });
  }

  test("1440px 상담 화면에서 질문 입력 영역이 560px 이상 남는다", async ({ page }) => {
    await setViewport(page, 1440, 900);
    await page.goto("/consult");
    const main = await page.locator(".consult-main").boundingBox();
    expect(main).not.toBeNull();
    expect(main!.width, "본문이 좁습니다 — 이력 패널이 본문을 압박하고 있습니다").toBeGreaterThanOrEqual(560);
  });

  test("1024px 상담 화면은 한 열로 내려온다", async ({ page }) => {
    await setViewport(page, 1024, 900);
    await page.goto("/consult");
    const main = await page.locator(".consult-main").boundingBox();
    const rail = await page.locator(".rail").boundingBox();
    expect(main).not.toBeNull();
    expect(rail).not.toBeNull();
    // 두 열이면 같은 줄에 나란히, 한 열이면 이력이 본문 아래로 내려온다.
    expect(rail!.y, "이 폭에서는 이력이 본문 아래 한 열이어야 합니다").toBeGreaterThan(main!.y);
  });

  test("390px 상담 화면에도 가로 넘침이 없다", async ({ page }) => {
    await setViewport(page, 390);
    await page.goto("/consult");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
