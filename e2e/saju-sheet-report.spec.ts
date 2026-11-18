import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { calculateSaju } from "../lib/saju/calculator";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { PERSONAL_REPORT_SECTION_IDS } from "../lib/report/personalContract";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, mockJson, mockPackage } from "./fixtures/audit/session";

/**
 * 최종 풀이 '사주 풀이' 탭 = 전문가 견본(엑셀 '개선점 정리') 한 장 보고서(2026-11-18 대표 결정).
 * 합성 저장본만 읽고 모든 쓰기 요청을 막는다 — AI 생성 호출 없음.
 */
const OUTPUT = "output/saju-sheet-2026-11-18";
const saju = calculateSaju(FIXTURE_PROFILE);
const formal = "이 문단은 화면 배치를 확인하기 위한 합성 예시이며, 실제 인물의 명식을 해석한 결과가 아닙니다.";
const body: Record<string, string> = {
  "세운 분석": [
    "2025년(乙巳)은 조직 안에서 맡은 역할을 정리해 보기에 알맞은 해였습니다. " + formal,
    "2026년(丙午)은 火기가 겹쳐 속도를 조절할 필요가 있는 해입니다. " + formal,
    "2027년(丁未)은 주변의 도움을 받아 계획을 다듬어 볼 수 있는 해입니다. " + formal,
  ].join("\n\n"),
};
const personalText = JSON.stringify({
  title: "합성 보고서",
  keywords: [{ word: "합성", desc: "합성 자료" }],
  sections: PERSONAL_REPORT_SECTION_IDS.map((id, i) => ({
    id,
    summary: `${id}의 핵심을 정리한 합성 문장입니다.`,
    body: body[id] ?? `${i + 1}번째 절의 합성 본문입니다. 己未 일주, 寅午합처럼 명리 근거를 한자로 적습니다.\n\n${formal}`,
  })),
  lifeline: [],
  roadmap: { character: "합성", resourceInput: "합성", resourceOutput: "합성", riskShadow: "합성", riskTool: "합성", direction: "합성" },
  disclaimer: "사주는 자기 이해를 위한 참고 관점이며, 실제 선택은 본인의 판단이 우선합니다.",
});
const savedPersonal = { report: personalText, generatedAt: "2026-11-18T01:00:00.000Z", provider: "test", model: "synthetic", judgment: 2 };
const fusionText = FUSION_SECTION_TITLES.map((title) => `${title}\n\n종합 합성 문단입니다.`).join("\n\n");

async function prepare(page: Page) {
  const state = { writes: 0, errors: [] as string[] };
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
  await page.route("**/api/**", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) {
      state.writes += 1;
      return route.fulfill({ status: 403, json: { error: "합성 테스트에서는 쓰기 금지" } });
    }
    return route.fallback();
  });
  await mockJson(page, "**/api/saju/personal", { status: "idle", saved: savedPersonal });
  await mockJson(page, "**/api/fusion/report", {
    status: "idle",
    saved: { report: fusionText, generatedAt: "2026-11-18T02:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: "합성", scores: [] }, actions: [] },
    readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
  });
  await mockJson(page, "**/api/tci/report", { saved: null, scores: [], status: "idle", readiness: { hasProfile: true, hasTci: false, tciAnswered: 0, tciTotal: 35 } });
  await mockJson(page, "**/api/share?*", { state: "none" });
  await mockJson(page, "**/api/saju/chart", { saju, name: FIXTURE_PROFILE.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
  await mockPackage(page, { personal: { saved: true, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } });
  return state;
}

test.use({ storageState: GUEST_STATE_FILE });

test.describe("최종 풀이 사주 탭의 한 장 보고서", () => {
  for (const width of [390, 1440]) {
    test(`${width}px에서 견본 배치 그대로 명식·분석·세운·조언을 보여준다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const state = await prepare(page);
      await page.goto("/fusion?tab=personal");
      await page.getByRole("tab", { name: "사주 풀이", exact: true }).click();
      const sheet = page.getByRole("article", { name: "사주 풀이 보고서", exact: true });
      await expect(sheet).toBeVisible();

      // 1) 사주명식(시·일·월·년) + 대운 — 한자 그대로, 나이 큰 쪽이 왼쪽.
      const natalTable = sheet.getByRole("table", { name: "사주명식", exact: true });
      const dayunTable = sheet.getByRole("table", { name: "대운", exact: true });
      const natal = [saju.pillars.time, saju.pillars.day, saju.pillars.month, saju.pillars.year];
      for (const [i, p] of natal.entries()) {
        await expect(natalTable.locator("tbody tr").nth(0).locator("td").nth(i)).toHaveText(p?.gan.hanja ?? "－");
        await expect(natalTable.locator("tbody tr").nth(1).locator("td").nth(i)).toHaveText(p?.zhi.hanja ?? "－");
      }
      const dayun = [...saju.daewoon].sort((a, b) => b.startAge - a.startAge);
      await expect(dayunTable.locator("tbody tr").nth(0).locator("td")).toHaveCount(dayun.length);
      await expect(dayunTable.locator("tbody tr").nth(0).locator("td").first()).toHaveText(dayun[0].gan.hanja);
      await expect(dayunTable.locator("tbody tr").nth(1).locator("td").last()).toHaveText(dayun[dayun.length - 1].zhi.hanja);
      // PC는 견본처럼 한 줄, 모바일은 위아래로 쌓는다.
      const [nb, db] = [await natalTable.boundingBox(), await dayunTable.boundingBox()];
      if (width < 768) expect(db!.y).toBeGreaterThan(nb!.y + nb!.height - 1);
      else expect(Math.abs(db!.y - nb!.y)).toBeLessThan(2);

      // 2) 견본의 ■ 소제목 일곱 개와 세 분석 칸.
      await expect(sheet.getByRole("heading", { level: 3 })).toHaveText([
        "■ 타고난 기질과 성격", "■ 강점과 잠재력", "■ 인생의 흐름",
        "■ 필요한 것", "■ 행동지침", "■ 인생 로드맵", "■ 성공 조언",
      ]);
      for (const label of ["(건강 및 환경)", "(적성 및 그릇)", "(수행능력)"]) await expect(sheet.getByRole("rowheader", { name: new RegExp(label.replace(/[()]/g, "\\$&")) })).toBeVisible();

      // 3) 세운 — 전년도·금년도·내년도 줄마다 그 해의 간지와 그 해의 문단만.
      const rows = [["전년도", "乙巳", "2025년(乙巳)은"], ["금년도", "丙午", "2026년(丙午)은"], ["내년도", "丁未", "2027년(丁未)은"]];
      for (const [label, gz, text] of rows) {
        const row = sheet.getByRole("row").filter({ has: page.getByRole("rowheader", { name: new RegExp(label) }) });
        await expect(row).toContainText(gz);
        await expect(row).toContainText(text);
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(state.writes).toBe(0);
      expect(state.errors).toEqual([]);
      await mkdir(OUTPUT, { recursive: true });
      await sheet.screenshot({ path: `${OUTPUT}/${width === 390 ? "mobile" : "desktop"}.png` });
    });
  }
});
