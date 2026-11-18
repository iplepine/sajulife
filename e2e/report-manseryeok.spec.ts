import { expect, test, type Page } from "@playwright/test";
import { calculateSaju } from "../lib/saju/calculator";
import { buildManseryeok } from "../lib/saju/manseryeok";
import { FUSION_SECTION_TITLES } from "../lib/fusion/reportContract";
import { TCI_DIMENSIONS, type TciDimension } from "../lib/tci/questions";
import { FIXTURE_PROFILE, GUEST_STATE_FILE, packageInfo } from "./fixtures/audit/session";

const SCORES = Object.entries(TCI_DIMENSIONS).map(([dimension, meta], index) => ({
  dimension: dimension as TciDimension, ...meta, percent: 25 + index * 10, raw: 25 + index * 10, max: 100,
}));
const REPORT = FUSION_SECTION_TITLES.map((title, index) => `${title}\n\n${index + 1}번째 저장 원문을 그대로 읽어.\n\n이 문단은 만세력 표시를 확인하기 위한 합성 자료야. 실제 인물이나 미래에 대한 해석이 아니야.`).join("\n\n");

async function prepare(page: Page, options: { unknownTime?: boolean; failure?: boolean; mismatch?: boolean } = {}) {
  const profile = { ...FIXTURE_PROFILE, birthTime: options.unknownTime ? "" : FIXTURE_PROFILE.birthTime };
  const saju = calculateSaju(profile);
  const state = { writes: [] as string[], years: [] as Array<number | null>, failure: options.failure ?? false, errors: [] as string[] };
  const dataFor = (year = 2026) => buildManseryeok(options.mismatch ? { ...profile, birthDate: "1991-04-12" } : profile, {
    currentYear: 2026, currentAge: 36, currentMonth: 11, wolwoonYear: year,
  });
  page.on("pageerror", error => state.errors.push(error.message));
  await page.addInitScript(() => localStorage.removeItem("sajulife:gen"));
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD"].includes(request.method())) {
      state.writes.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 403, json: { error: "합성 만세력 조회만 허용해." } });
    }
    const send = (json: unknown, status = 200) => route.fulfill({ status, json });
    switch (url.pathname) {
      case "/api/people": return send({ people: [], activeId: null });
      case "/api/profile": return send({ profile });
      case "/api/package": return send(packageInfo({ personal: { saved: false, status: "idle" }, fusion: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } }));
      case "/api/saju/chart": return send({ saju, name: profile.name, gender: "여성", currentAge: 36, currentYear: 2026, cautionMonths: [] });
      case "/api/saju/personal": return send({ saved: null, status: "idle" });
      case "/api/fusion/report": return send({
        saved: { report: REPORT, generatedAt: "2026-11-16T01:00:00.000Z", provider: "test", model: "synthetic", judgment: 2, meta: { headline: "만세력과 검사 응답을 함께 읽는 합성 자료", scores: SCORES } },
        status: "idle", readiness: { hasProfile: true, hasTci: true, tciAnswered: 35, tciTotal: 35 },
      });
      case "/api/tci/report": return send({ saved: null, scores: [], status: "idle", readiness: { hasProfile: true, hasTci: false, tciAnswered: 0, tciTotal: 35 } });
      case "/api/saju/manseryeok": {
        const year = url.searchParams.get("wy");
        state.years.push(year == null ? null : Number(year));
        return state.failure ? send({ error: "합성 조회 실패" }, 500) : send({ manseryeok: dataFor(year == null ? 2026 : Number(year)) });
      }
      case "/api/share": return send({ state: "none" });
      case "/api/tickets/balance": return send({ balance: 0 });
      default: return send({});
    }
  });
  return { state, data: dataFor(), saju };
}

// 2026-11-18: 원국·운세 상세는 개별 사주 쪽에서 제공하고 종합 탭에서는 복제하지 않는다.
test.use({ storageState: GUEST_STATE_FILE });
for (const width of [390, 1440]) {
  test(`${width}px 종합 탭은 만세력을 중복 표시하거나 상세 GET을 보내지 않는다`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const { state } = await prepare(page);
    await page.goto("/fusion");
    const folio = page.locator(".report-folio[data-kind='fusion']");
    await expect(folio).toBeVisible();
    await expect(folio.locator(".rv-sec")).toHaveCount(FUSION_SECTION_TITLES.length);
    await expect(folio.locator(".mnr, [role=meter]")).toHaveCount(0);
    await folio.locator("#folio-fusion-reference > summary").click();
    await expect(folio).toContainText("‘사주 풀이’ 탭");
    expect(state.years).toEqual([]);
    expect(state.writes).toEqual([]);
    expect(state.errors).toEqual([]);
  });
}
