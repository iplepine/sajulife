import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, PERSON_A, packageInfo, peopleStore } from "./fixtures/audit/session";

/**
 * D 분석 노트의 공통 표면을 실제 보호 화면에서 확인한다.
 * 세션은 인증에만 쓰고 모든 앱 API는 가상 GET 자료다. 쓰기는 차단하며,
 * 생성·결제·계정 변경·설문 저장을 클릭하지 않는다.
 */
const SCREENS = [
  { name: "home", route: "/dashboard", ready: ".home-fusion-cta" },
  { name: "materials", route: "/materials", ready: ".material-list" },
  { name: "onboarding", route: "/onboarding", ready: "form" },
  { name: "survey", route: "/tci?variant=short&next=fusion", ready: "[role='radiogroup']" },
  { name: "consult", route: "/consult", ready: ".consult-main" },
  { name: "family", route: "/family", ready: ".h-app" },
  { name: "account", route: "/account", ready: ".app-main h1" },
  { name: "checkout", route: "/checkout", ready: ".checkout-card" },
  { name: "fusion", route: "/fusion", ready: ".report-folio[data-kind='fusion']" },
] as const;

const REPORT = FUSION_SECTION_TITLES.map((title) => `${title}\n\n성장을 향해 나아가는 힘과 평소의 반응을 함께 살펴봅니다. 이 문단은 디자인 검증을 위한 합성 예시이며 실제 개인의 분석 결과가 아닙니다.`).join("\n\n");

async function prepare(page: Page) {
  const state = { writes: [] as string[], errors: [] as string[] };
  page.on("pageerror", (error) => state.errors.push(error.message));
  const saju = calculateSaju(FIXTURE_PROFILE);
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      state.writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "시각 검증에서는 쓰기를 허용하지 않습니다." }) });
    }
    const path = new URL(request.url()).pathname;
    const bodies: Record<string, unknown> = {
      "/api/people": peopleStore(PERSON_A.id),
      "/api/profile": { profile: FIXTURE_PROFILE },
      "/api/package": packageInfo({ entitled: false }),
      "/api/consult": { history: [], hasProfile: true },
      "/api/coaching": { items: [] },
      "/api/family": { family: { members: [], reportMemberIds: [] } },
      "/api/compat": { compat: { partners: [] } },
      "/api/notifications": { notifications: [] },
      "/api/tci/answers": { tci: null },
      "/api/saju/chart": { saju, name: FIXTURE_PROFILE.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] },
      "/api/fusion/report": {
        status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
        saved: { report: REPORT, generatedAt: "2026-11-03T07:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: "두 관점을 함께 읽는 가상 리포트", scores: [] } },
      },
    };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(path in bodies ? bodies[path] : { saved: null, status: "idle" }) });
  });
  return state;
}

function contrast(a: string, b: string) {
  const luminance = (value: string) => {
    const channels = value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((channel) => {
      const v = channel / 255;
      return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    });
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + .05) / (low + .05);
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("서비스 공통 분석 노트 톤", () => {
  for (const width of [390, 1440]) {
    for (const screen of SCREENS) {
      test(`${width}px ${screen.name} — 종이·글자·컨트롤과 반응형`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
        const state = await prepare(page);
        await page.goto(screen.route);
        await expect(page.locator(screen.ready).first()).toBeVisible();
        await page.evaluate(() => document.fonts.ready.then(() => {}));
        await expect(page.locator(".app-main .page-loading")).toHaveCount(0);
        await expect(page.locator(".modern-app-shell")).toBeVisible();
        const styles = await page.locator(".app-main").evaluate((main) => {
          const body = getComputedStyle(document.body);
          const content = getComputedStyle(main);
          const header = getComputedStyle(document.querySelector(".studio-header")!);
          const heading = main.querySelector(".h-app, h1, h2");
          const headingStyle = heading ? getComputedStyle(heading) : null;
          const primary = Array.from(main.querySelectorAll(".btn-primary")).filter((button) => (button as HTMLElement).offsetParent !== null).map((button) => {
            const style = getComputedStyle(button);
            return { shadow: style.boxShadow, radius: parseFloat(style.borderTopLeftRadius), background: style.backgroundColor, color: style.color };
          });
          return {
            body: body.backgroundColor, paper: content.backgroundColor, header: header.backgroundColor,
            text: body.color, muted: body.getPropertyValue("--studio-muted").trim(),
            heading: headingStyle?.fontFamily ?? "", primary,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        expect(styles.paper).toBe(styles.body);
        expect(styles.header).toBe(styles.paper);
        expect(styles.heading).toMatch(/Gowun Batang|Noto Serif KR|Nanum Myeongjo/);
        expect(contrast(styles.text, styles.paper)).toBeGreaterThanOrEqual(4.5);
        expect(styles.overflow, `${screen.route}에 문서 가로 스크롤이 있습니다`).toBe(false);
        for (const button of styles.primary) {
          expect(button.shadow).toBe("none");
          expect(button.radius).toBeLessThanOrEqual(8);
          expect(contrast(button.color, button.background)).toBeGreaterThanOrEqual(4.5);
        }
        for (const locator of [page.locator(".studio-header"), page.locator(screen.ready).first()]) {
          const box = await locator.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(width + .5);
        }
        if (screen.name === "materials") {
          for (const card of await page.locator(".material-card").all()) {
            const main = await card.locator(".material-main").boundingBox();
            const status = await card.locator(".material-status").boundingBox();
            expect(main).not.toBeNull();
            expect(status).not.toBeNull();
            expect(Math.abs(status!.x - main!.x), "풀이 상태와 제목·설명은 같은 왼쪽 기준선에 놓입니다").toBeLessThanOrEqual(.5);
          }
        }
        await mkdir("output/studio-consistency-2026-11-03", { recursive: true });
        await page.screenshot({ path: `output/studio-consistency-2026-11-03/${screen.name}-${width}.png`, fullPage: true, animations: "disabled" });
        if (screen.name === "checkout" && width === 390) {
          const pay = page.locator(".checkout-pay");
          // scrollIntoView는 고정 탭을 모른다. 사람이 화면 끝까지 내렸을 때의 접근성을 본다.
          await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
          const payBox = await pay.boundingBox();
          const tabsBox = await page.locator(".tabbar").boundingBox();
          expect(payBox).not.toBeNull();
          expect(tabsBox).not.toBeNull();
          expect(payBox!.y + payBox!.height, "결제·무료 시작 버튼을 하단 탭이 가리면 안 됩니다").toBeLessThanOrEqual(tabsBox!.y);
          await page.screenshot({ path: "output/studio-consistency-2026-11-03/checkout-cta-390.png", fullPage: false, animations: "disabled" });
        }
        expect(state.writes).toEqual([]);
        expect(state.errors).toEqual([]);
      });
    }
  }

  for (const width of [390, 1440]) {
    test(`${width}px 라이트 네 계절·다크 한 세트 — 설문 배치와 대비`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      const state = await prepare(page);
      await page.goto("/tci?variant=short&next=fusion");
      await expect(page.getByRole("radiogroup")).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => {}));
      const measure = () => page.evaluate(() => {
        const bounds = (selector: string) => {
          const box = document.querySelector(selector)!.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        };
        const body = getComputedStyle(document.body);
        const muted = getComputedStyle(document.querySelector(".tci-survey .muted")!);
        const primary = getComputedStyle(document.querySelector(".tci-survey .btn-primary")!);
        return {
          paper: body.backgroundColor, text: body.color, muted: muted.color,
          button: primary.backgroundColor, buttonText: primary.color,
          header: bounds(".studio-header"), question: bounds(".tci-survey h2"),
          choices: bounds("[role='radiogroup']"), controls: bounds(".tci-survey-controls"),
        };
      });
      const baseline = await measure();
      for (const [scheme, seasons] of [["light", ["spring", "summer", "autumn", "winter"]], ["dark", ["autumn"]]] as const) {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
        for (const season of seasons) {
          await page.evaluate((value) => { document.documentElement.dataset.seasonTheme = value; }, season);
          const themed = await measure();
          for (const element of ["header", "question", "choices", "controls"] as const) {
            for (const axis of ["x", "y", "width", "height"] as const) {
              expect(Math.abs(themed[element][axis] - baseline[element][axis]), `${scheme} ${season}: ${element}.${axis} 이동`).toBeLessThanOrEqual(.5);
            }
          }
          for (const [foreground, background] of [[themed.text, themed.paper], [themed.muted, themed.paper], [themed.buttonText, themed.button]]) {
            expect(contrast(foreground, background), `${scheme} ${season}: ${foreground} / ${background}`).toBeGreaterThanOrEqual(4.5);
          }
          await mkdir("output/studio-consistency-2026-11-03", { recursive: true });
          await page.screenshot({ path: `output/studio-consistency-2026-11-03/survey-${scheme}-${season}-${width}.png`, fullPage: false, animations: "disabled" });
        }
      }
      expect(state.writes).toEqual([]);
      expect(state.errors).toEqual([]);
    });

    test(`${width}px 로그인 — 독립 레이아웃의 공통 입력·버튼`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      const state = await prepare(page);
      await page.goto("/auth/login");
      const login = page.locator(".auth-page");
      await expect(login.getByRole("heading", { name: "로그인", exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready.then(() => {}));
      await expect(page.locator(".modern-app-shell, .studio-header, .tabbar")).toHaveCount(0);
      await expect(login.locator("input[type='email']")).toBeVisible();
      await expect(login.locator("input[type='password']")).toBeVisible();
      const styles = await login.evaluate((element) => {
        const heading = getComputedStyle(element.querySelector("h1")!);
        const primary = getComputedStyle(element.querySelector(".btn-primary")!);
        return { font: heading.fontFamily, radius: parseFloat(primary.borderTopLeftRadius), shadow: primary.boxShadow, background: primary.backgroundColor, color: primary.color, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(styles.font).toMatch(/Gowun Batang|Noto Serif KR|Nanum Myeongjo/);
      expect(styles.shadow).toBe("none");
      expect(styles.radius).toBeLessThanOrEqual(8);
      expect(contrast(styles.color, styles.background)).toBeGreaterThanOrEqual(4.5);
      expect(styles.overflow).toBe(false);
      await mkdir("output/studio-consistency-2026-11-03", { recursive: true });
      await page.screenshot({ path: `output/studio-consistency-2026-11-03/login-${width}.png`, fullPage: true, animations: "disabled" });
      expect(state.writes).toEqual([]);
      expect(state.errors).toEqual([]);
    });
  }
});
