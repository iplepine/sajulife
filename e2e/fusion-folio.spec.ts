import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { PERSONAL_REPORT_SECTION_IDS } from "../lib/report/personalContract";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockJson, mockPackage } from "./fixtures/audit/session";

/** 합성 저장본만 사용한다. 비용·기존 사용자 데이터·공유 발급을 건드리지 않는다. */
const legacyTitles = [
  "먼저 결론: 네 반복 패턴 한눈에 보기",
  "타고난 결과 길러진 결: 겹치는 곳과 어긋나는 곳",
  "잘 풀릴 때: 네 리듬이 탄력받는 순간",
  "꼬일 때: 평소 반응이 엇나가는 순간",
  "자꾸 반복되는 장면: 일·돈·관계에서 같은 패턴이 도는 이유",
  "숨은 강점과 사각지대: 둘을 겹쳐야 보이는 것",
  "갈림길 사용법: 밀어붙일 때와 멈춰야 할 때",
  "앞으로 6~12개월: 기회와 삐끗할 지점 미리보기",
  "오늘부터 바꿀 세 가지",
];
const titles = FUSION_SECTION_TITLES.map((title) => title.replace(/^▣\s*/, ""));
const prose = "충분히 이해한 것을 자신의 방식으로 정리하고, 선택한 일을 꾸준히 이어 가는 힘을 살펴봅니다. 모든 일을 혼자 감당하기보다 현재의 조건과 역할을 확인해 보세요. 이 문단은 디자인 검증을 위한 합성 예시입니다.";
const personalReport = JSON.stringify({
  title: "이해한 것을 자기 방식으로 완성하는 사람",
  keywords: [{ word: "정리", desc: "합성 예시" }],
  sections: PERSONAL_REPORT_SECTION_IDS.map((id, i) => ({ id, summary: `${id}에서 읽는 사주 관점`, body: `사주 원문 보존 ${i + 1}번째 문장.\n\n${prose}\n\n${prose}` })),
  lifeline: [], roadmap: { character: "합성 인물", resourceInput: "가상 입력", resourceOutput: "가상 출력", riskShadow: "가상 부담", riskTool: "가상 조율", direction: "가상 방향" },
  disclaimer: "합성 사주 저장본입니다.",
});
const textReport = (legacy: boolean) => (legacy ? legacyTitles : titles).map((title, i) => `▣ ${title}\n\n${legacy ? "옛" : "새"} 종합 원문 보존 ${i + 1}번째 문장.\n\n${prose}\n\n${prose}`).join("\n\n");
const savedActions = [1, 2, 3].map((i) => ({ title: `합성 실천 후보 ${i}`, timeframe: "이번 주", hint: "저장 데이터 보존 검증" }));

async function prepare(page: Page, legacy = false) {
  const state = { writes: 0, fusionGets: 0, personalGets: 0, errors: [] as string[] };
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) {
      state.writes += 1;
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "합성 저장본 읽기만 허용" }) });
    }
    return route.fallback();
  });
  await page.route("**/api/fusion/report", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    state.fusionGets += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
      saved: { report: textReport(legacy), generatedAt: "2026-11-03T05:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: legacy ? "깊이 살피고 꾸준히 만들어 가는 사람" : "지속하는 힘에 선택하는 여유를 더해", scores: [], flexibility: legacy ? 70 : undefined }, actions: savedActions },
    }) });
  });
  await page.route("**/api/saju/personal", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    state.personalGets += 1;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "idle", saved: { report: personalReport, generatedAt: "2026-11-03T04:00:00.000Z", provider: "test", model: "synthetic", judgment: 2 } }) });
  });
  await mockJson(page, "**/api/saju/chart", { saju: calculateSaju(FIXTURE_PROFILE), name: FIXTURE_PROFILE.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
  await mockPackage(page, { personal: { saved: true, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } });
  return state;
}

async function screenshot(page: Page, kind: "fusion" | "personal" | "legacy", width: number) {
  await mkdir("output/fusion-folio-2026-11-03", { recursive: true });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `output/fusion-folio-2026-11-03/${kind}-${width}.png`, fullPage: true });
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("D 분석 폴리오 리포트", () => {
  for (const width of [390, 1440]) {
    for (const legacy of [false, true]) {
      test(`${width}px ${legacy ? "옛 9영역" : "새 8영역"} 저장본을 근거보다 먼저 읽고 목차로 이동한다`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        const state = await prepare(page, legacy);
        await page.goto("/fusion");
        const folio = page.locator(".report-folio[data-kind='fusion']");
        await expect(folio).toBeVisible();
        await expect(folio.getByText(`${legacy ? "옛" : "새"} 종합 원문 보존 1번째 문장.`, { exact: true })).toHaveCount(1);
        const expectedTitles = legacy ? legacyTitles : titles;
        const sections = folio.locator(".rv-sec");
        await expect(sections).toHaveCount(expectedTitles.length);
        await expect(folio.locator(".rv-sec[open]")).toHaveCount(expectedTitles.length);
        const toc = page.getByRole("navigation", { name: "종합 풀이 목차", exact: true });
        await expect(toc).toBeVisible();
        await expect(toc.getByRole("link")).toHaveCount(expectedTitles.length);
        for (let i = 0; i < expectedTitles.length; i++) {
          await expect(sections.nth(i).locator("summary")).toContainText(expectedTitles[i]);
          await expect(sections.nth(i)).toContainText(`${legacy ? "옛" : "새"} 종합 원문 보존 ${i + 1}번째 문장.`);
          const anchor = await sections.nth(i).getAttribute("id");
          expect(anchor).toBeTruthy();
          await expect(toc.getByRole("link").nth(i)).toHaveAttribute("href", `#${anchor}`);
        }
        await expect(page.locator(".fusion-cmap")).not.toBeVisible();
        await expect(page.locator(".year-trio")).not.toBeVisible();
        const firstParagraph = sections.first().locator(".rv-body");
        await expect(firstParagraph).toBeVisible();
        await expect(folio).toContainText("사주 관점");
        await expect(folio).toContainText("응답 관점");
        const perspectives = folio.getByRole("region", { name: "사주와 기질을 함께 읽는 다섯 관점" });
        await expect(perspectives).toBeVisible();
        for (const name of ["큰 나무", "타는 불", "너른 흙", "흐르는 물", "단단한 쇠"]) await expect(perspectives).toContainText(name);
        const forceLayout = await perspectives.locator("dl").evaluate(element => ({
          width: element.clientWidth,
          scrollWidth: element.scrollWidth,
          tops: Array.from(element.children, child => child.getBoundingClientRect().top),
        }));
        expect(forceLayout.scrollWidth).toBeLessThanOrEqual(forceLayout.width);
        expect(forceLayout.tops[2]).toBe(forceLayout.tops[0]);
        if (width < 768) {
          expect(forceLayout.tops[3]).toBeGreaterThan(forceLayout.tops[0]);
          expect(forceLayout.tops[4]).toBe(forceLayout.tops[3]);
        } else expect(forceLayout.tops[4]).toBe(forceLayout.tops[0]);
        await mkdir("output/fusion-wrap-2026-11-03", { recursive: true });
        await perspectives.screenshot({ path: `output/fusion-wrap-2026-11-03/five-forces-${width}.png` });
        await expect(folio.getByText("코칭 액션 플랜", { exact: true })).toHaveCount(0);
        await expect(folio.getByRole("button", { name: "전체 등록", exact: true })).toHaveCount(0);
        await expect(folio.getByRole("button", { name: "등록", exact: true })).toHaveCount(0);
        await expect(folio.getByRole("button", { name: "공유하기", exact: true })).toBeVisible();
        await expect(folio.getByRole("button", { name: "다시 생성", exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await screenshot(page, legacy ? "legacy" : "fusion", width);

        // 접힌 본문도 목차를 누르면 열어 해당 원문으로 이동해야 한다.
        await sections.nth(2).locator("summary").click();
        await expect(sections.nth(2)).not.toHaveAttribute("open", "");
        await toc.getByRole("link").nth(2).click();
        await expect(sections.nth(2)).toHaveAttribute("open", "");
        await expect.poll(async () => {
          const box = await sections.nth(2).boundingBox();
          return box ? box.y >= 0 && box.y < 350 : false;
        }).toBe(true);
        expect(state.writes).toBe(0);
        expect(state.errors).toEqual([]);
        expect(state.fusionGets).toBe(1);

        if (!legacy) {
          await page.getByRole("tab", { name: "사주 풀이", exact: true }).click();
          const personal = page.locator(".report-folio[data-kind='personal']");
          await expect(personal).toBeVisible();
          await expect(personal.getByText("이해한 것을 자기 방식으로 완성하는 사람", { exact: true })).toBeVisible();
          await expect(personal.locator(".rv-sec--personal")).toHaveCount(PERSONAL_REPORT_SECTION_IDS.length);
          const personalToc = page.getByRole("navigation", { name: "사주 풀이 목차", exact: true });
          await expect(personalToc.getByRole("link")).toHaveCount(PERSONAL_REPORT_SECTION_IDS.length);
          for (let i = 0; i < PERSONAL_REPORT_SECTION_IDS.length; i++) {
            await expect(personal.locator(".rv-sec--personal").nth(i)).toContainText(`사주 원문 보존 ${i + 1}번째 문장.`);
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await screenshot(page, "personal", width);
          expect(state.personalGets).toBe(1);
          expect(state.writes).toBe(0);
          expect(state.errors).toEqual([]);
        }
      });
    }
  }
});
