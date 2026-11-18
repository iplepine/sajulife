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

async function prepare(page: Page, personal = savedPersonal) {
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
  await mockJson(page, "**/api/saju/personal", { status: "idle", saved: personal });
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

  for (const width of [390, 1440]) {
    test(`${width}px에서 옛 저장본도 명식부터 보여주고 원래 해설을 모두 보존한다`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const sections = ["타고난 기운 배합", "기본성향", "재물운", "직업운", "연애운", "건강운", "대운별 흐름", "올해 실행전략"]
        .map((id, i) => ({ id, summary: `옛 ${i + 1}절 핵심 문장`, body: `옛 ${i + 1}절 본문 첫 문단\n\n옛 ${i + 1}절 본문 마지막 문단` }));
      const roadmap = { character: "저장된 나의 정의", resourceInput: "저장된 채우는 힘", resourceOutput: "저장된 활용 방법", riskShadow: "저장된 주의점", riskTool: "저장된 대처법", direction: "저장된 방향" };
      const legacy = { ...savedPersonal, report: JSON.stringify({
        title: "옛 저장본의 표제", keywords: [{ word: "옛 키워드", desc: "저장된 키워드 설명" }], sections,
        lifeline: [{ startAge: 21, endAge: 30, season: "봄", seasonLabel: "저장된 계절", tone: "저장된 시기 설명", summary: "저장된 대운별 해설" }],
        roadmap, disclaimer: "옛 저장본의 안내 문장",
      }) };
      const state = await prepare(page, legacy);
      await page.goto("/fusion?tab=personal");
      await page.getByRole("tab", { name: "사주 풀이", exact: true }).click();
      const sheet = page.getByRole("article", { name: "사주 풀이 보고서", exact: true });
      await expect(sheet).toBeVisible();
      await expect(sheet.getByRole("table", { name: "사주명식", exact: true })).toBeVisible();
      await expect(sheet.getByRole("table", { name: "대운", exact: true })).toBeVisible();
      await expect(sheet.getByRole("heading", { level: 3 })).toHaveText(sections.map(s => `■ ${s.id}`));
      await expect(sheet.locator("details")).toHaveCount(0);
      const chartBox = await sheet.getByRole("table", { name: "사주명식", exact: true }).boundingBox();
      const firstSectionBox = await sheet.getByRole("heading", { level: 3 }).first().boundingBox();
      expect(chartBox!.y + chartBox!.height).toBeLessThan(firstSectionBox!.y);
      for (const section of sections) {
        await expect(sheet).toContainText(section.summary);
        for (const paragraph of section.body.split("\n\n")) await expect(sheet).toContainText(paragraph);
      }
      for (const text of ["옛 저장본의 표제", "옛 키워드", "저장된 키워드 설명", "21~30세", "저장된 계절", "저장된 시기 설명", "저장된 대운별 해설", ...Object.values(roadmap), "옛 저장본의 안내 문장"]) await expect(sheet).toContainText(text);
      await expect(sheet.getByRole("rowheader", { name: /조후|격국|억부|전년도|금년도|내년도/ })).toHaveCount(0);
      if (width < 768) {
        const sheetWidth = (await sheet.boundingBox())!.width;
        const captions = sheet.locator("caption");
        await expect(captions).toHaveCount(2);
        for (const caption of await captions.all()) {
          const bounds = (await caption.boundingBox())!;
          expect(bounds.width).toBeGreaterThanOrEqual(sheetWidth - 1);
          expect(bounds.height).toBeLessThan(40);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(state.writes).toBe(0);
      expect(state.errors).toEqual([]);
      await mkdir(OUTPUT, { recursive: true });
      await sheet.screenshot({ path: `${OUTPUT}/legacy-${width === 390 ? "mobile" : "desktop"}.png` });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.evaluate(() => Promise.all([...document.images].filter(image => {
        const bounds = image.getBoundingClientRect();
        return bounds.bottom > 0 && bounds.top < innerHeight;
      }).map(image => image.decode().catch(() => {}))));
      await page.screenshot({ path: `${OUTPUT}/legacy-${width === 390 ? "mobile" : "desktop"}-viewport.png`, fullPage: false });
    });
  }

  test("파싱할 수 없는 옛 텍스트는 기존 본문으로 읽을 수 있다", async ({ page }) => {
    const state = await prepare(page, { ...savedPersonal, report: "[기본성향]\n\n파싱되지 않는 옛 저장 본문도 그대로 남아 있어야 합니다." });
    await page.goto("/fusion?tab=personal");
    await page.getByRole("tab", { name: "사주 풀이", exact: true }).click();
    await expect(page.locator('.report-folio[data-kind="personal"]')).toBeVisible();
    await expect(page.locator('.report-folio[data-kind="personal"]')).toContainText("파싱되지 않는 옛 저장 본문도 그대로 남아 있어야 합니다.");
    await expect(page.getByRole("article", { name: "사주 풀이 보고서", exact: true })).toHaveCount(0);
    expect(state.writes).toBe(0);
    expect(state.errors).toEqual([]);
  });
});
