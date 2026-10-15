import { expect, test, type Page, type Route } from "@playwright/test";
import { GUEST_STATE_FILE, packageInfo } from "./fixtures/audit/session";

/**
 * 사주+기질 한 바퀴 — 홈 → 소개 → 사주 정보 → 사주 풀이 → 기질 검사 → 사주+기질 올해 운세.
 * 2026-10-15 대표 질문 "사주 → 사주 리포트 → 기질 검사 → 사주기질 리포트로 자연스럽게 넘어가지?"를
 * 버튼만 따라 눌러 확인한다. ★실제 생성은 하지 않는다★ — 생성 요청·상태 조회는 가짜 응답으로 흉내 내고,
 * 생성이 끝났을 때 화면이 알아서 다음으로 넘어가는지는 시계를 앞으로 돌려(완료 확인 주기 30초) 본다.
 */

test.use({ storageState: GUEST_STATE_FILE, viewport: { width: 390, height: 844 } });

/** 가상 풀이 — 실제 개인정보·실제 생성 결과가 아니다. */
const PERSONAL_REPORT = JSON.stringify({
  title: "가상 테스트용 한 줄 정의",
  keywords: [{ word: "시험", desc: "가상 풀이" }],
  sections: ["오행구성", "기본성향", "직업운", "금전운", "인간관계운", "건강운", "대운", "평생 실행전략"].map((id) => ({
    id,
    summary: `${id} 요약 문장`,
    body: `─ 소제목\n${id} 본문`,
  })),
  lifeline: [],
  roadmap: { character: "가상", resourceInput: "", resourceOutput: "", riskShadow: "", riskTool: "", direction: "" },
  disclaimer: "가상 풀이예요.",
});
const FUSION_REPORT = "## 먼저 결론\n가상 올해 운세 본문이야.";

type Stage = "none" | "generating" | "saved";

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

/** 한 사람의 진행 상태를 들고, 화면이 부르는 조회·생성 API를 그 상태대로 답한다. */
async function mockJourney(page: Page) {
  const s = { profile: false, personal: "none" as Stage, tciDone: false, fusion: "none" as Stage, posts: { personal: 0, fusion: 0 } };
  const progress = (x: Stage): { saved: boolean; status: "generating" | "idle" } => ({ saved: x === "saved", status: x === "generating" ? "generating" : "idle" });
  const now = () => new Date().toISOString();

  await page.route("**/api/package", (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return json(route, packageInfo({
      hasProfile: s.profile,
      personal: progress(s.personal),
      tci: { complete: s.tciDone, answered: s.tciDone ? 35 : 0, total: 35 },
      fusion: progress(s.fusion),
    }));
  });
  // 사주 정보 저장만 가로챈다 — 입력칸은 게스트의 가상 사주 정보로 채워진다.
  await page.route("**/api/profile", (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    s.profile = true;
    return json(route, { profile: route.request().postDataJSON() });
  });
  await page.route("**/api/saju/personal", (route) => {
    if (route.request().method() === "POST") {
      s.posts.personal += 1;
      s.personal = "generating";
      return json(route, { status: "generating", startedAt: now() }, 202);
    }
    const saved = s.personal === "saved" ? { report: PERSONAL_REPORT, generatedAt: now(), provider: "test", model: "test", actions: [] } : null;
    return json(route, { saved, status: progress(s.personal).status });
  });
  await page.route("**/api/tci/answers**", (route) => {
    if (route.request().method() === "PUT") {
      const answers = (route.request().postDataJSON() as { answers?: Record<string, number> }).answers ?? {};
      if (Object.keys(answers).length >= 35) s.tciDone = true;
      return json(route, { tci: { variant: "short", answers } });
    }
    return json(route, { tci: null });
  });
  await page.route("**/api/fusion/report", (route) => {
    if (route.request().method() === "POST") {
      s.posts.fusion += 1;
      s.fusion = "generating";
      return json(route, { status: "generating", startedAt: now() }, 202);
    }
    const saved = s.fusion === "saved"
      ? { report: FUSION_REPORT, generatedAt: now(), provider: "test", model: "test", meta: { scores: [], flexibility: 50, headline: "가상 헤드라인" }, actions: [] }
      : null;
    return json(route, {
      saved,
      readiness: { hasProfile: true, hasTci: s.tciDone, tciAnswered: s.tciDone ? 35 : 0, tciTotal: 35 },
      status: progress(s.fusion).status,
    });
  });
  return s;
}

/** 기질 검사 35문항 — 보기를 고르면 저절로 다음 문항으로 넘어간다. 마지막 문항은 끝내기 버튼을 따로 누른다. */
async function answerAllQuestions(page: Page) {
  const counter = page.locator(".mono").first();
  const [, total] = (await counter.innerText()).split("/").map((n) => Number(n.trim()));
  for (let at = 1; at <= total; at += 1) {
    await page.locator(".likert label").nth(2).click();
    if (at < total) await expect(counter).toHaveText(`${at + 1} / ${total}`);
  }
}

test("홈에서 버튼만 따라가면 사주 풀이 → 기질 검사 → 사주+기질 올해 운세까지 이어진다", async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.install();
  const s = await mockJourney(page);

  // 홈 → 소개 → 한 번에 시작
  await page.goto("/dashboard");
  await page.locator(".home-fusion-cta").click();
  await page.waitForURL(/\/explore\/fusion$/);
  await page.getByRole("region", { name: "사주+기질 풀이 시작" }).getByRole("link", { name: /한번에 보기/ }).click();

  // ① 사주 정보 → 저장하면 사주 풀이가 바로 시작된다(같은 의사를 두 번 묻지 않는다)
  await page.waitForURL(/\/onboarding\?next=/);
  // 입력칸이 채워진 뒤에 누른다(게스트의 가상 사주 정보가 불러와지기 전엔 빈 칸이라 저장이 막힌다).
  await expect(page.getByRole("textbox", { name: "출생 연도(네 자리)" })).toHaveValue(/^\d{4}$/);
  await page.getByRole("button", { name: /저장하고/ }).click();
  await page.waitForURL(/\/saju/);
  await expect.poll(() => s.posts.personal, { message: "사주 정보를 넣었는데 사주 풀이가 시작되지 않았습니다" }).toBe(1);
  await expect(page.locator(".genload")).toBeVisible();
  await expect.poll(() => new URL(page.url()).search, { message: "만들기 표시가 주소에 남아 새로고침하면 다시 만듭니다" }).toBe("");

  // ② 다 되면 같은 화면에서 사주 풀이가 열리고, 끝에 다음 단계(기질 검사)가 붙는다
  s.personal = "saved";
  await page.clock.fastForward(31_000);
  const header = page.getByRole("region", { name: "가상 테스트용 한 줄 정의" });
  await expect(header).toContainText("방금 나온 네 사주야");
  await expect(header).toContainText("기질 검사로 올해 운세까지");
  await expect(page.locator(".rv-sec").first()).toBeVisible();
  // 이미 이 화면에서 풀이가 열렸다 — 같은 화면으로 '보러 가기' 토스트를 또 띄우지 않는다.
  await expect(page.locator(".gen-toast")).toHaveCount(0);
  const next = page.getByRole("region", { name: "다음 단계" });
  await expect(next).toContainText("여기까지가 ‘원래의 너’야");
  await next.getByRole("link", { name: /기질 검사하고 올해 운세 보기/ }).click();

  // ③ 기질 검사 35문항 → 마치면 사주+기질 올해 운세가 바로 시작된다
  await page.waitForURL(/\/tci\?variant=short&next=fusion$/);
  await expect(page.getByRole("note")).toContainText("사주와 겹쳐 올해 운세");
  await answerAllQuestions(page);
  await page.getByRole("button", { name: "올해 운세 보기" }).click();
  await page.waitForURL(/\/fusion/);
  await expect.poll(() => s.posts.fusion, { message: "기질 검사를 마쳤는데 올해 운세가 시작되지 않았습니다" }).toBe(1);
  // 만드는 중이라는 표시가 첫 화면에 보여야 시작된 줄 안다.
  const loading = page.locator(".genload");
  await expect(loading).toBeVisible();
  expect((await loading.boundingBox())!.y, "만드는 중 표시가 첫 화면 밖에 있습니다").toBeLessThan(844);

  // ④ 다 되면 같은 화면에서 올해 운세가 열린다
  s.fusion = "saved";
  await page.clock.fastForward(31_000);
  await expect(page.getByText("가상 올해 운세 본문이야.")).toBeVisible();
  await expect(page.locator(".gen-toast")).toHaveCount(0);

  // 홈도 마지막 단계로 — 큰 버튼은 올해 운세 보기, 진행 표시는 세 단계 모두 완료
  await page.goto("/dashboard");
  await expect(page.locator(".home-fusion-cta")).toContainText("내 올해 운세 보기");
  await expect(page.locator(".home-package-step.is-done")).toHaveCount(3);
  expect(s.posts, "생성이 한 단계에 두 번 이상 시작됐습니다").toEqual({ personal: 1, fusion: 1 });
});
