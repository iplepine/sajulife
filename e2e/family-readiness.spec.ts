import { expect, test } from "@playwright/test";
import { GUEST_STATE_FILE, failRoute, mockJson } from "./fixtures/audit/session";

/**
 * 가족 소개 화면이 약속하는 상태와 실제 /family 화면의 생성 가능 여부가 같아야 한다.
 * ★계정 인물 수(/api/people)와 가족 구성원 수(/api/family)는 다른 데이터★다.
 */

const MEMBER = (id: string, name: string) => ({
  id,
  relation: "어머니",
  profile: { name, birthDate: "1962-05-04", birthTime: "09:00", gender: "female", calendar: "solar" },
});

// 준비된 게스트 세션으로 보호 화면에 들어간다(e2e/guest.setup.ts).
test.use({ storageState: GUEST_STATE_FILE });

test.describe("가족 준비 상태", () => {
  test("계정 인물이 여럿이어도 현재 인물의 가족이 0명이면 '가족 추가'로 안내한다", async ({ page }) => {
    // 인물은 넷, 가족은 0명 — 예전엔 인물 수를 세서 "바로 볼 수 있음"이라고 말했다.
    await mockJson(page, "**/api/people", {
      people: [1, 2, 3, 4].map((n) => ({ id: `p${n}`, label: `가상${n}`, birthDate: "1990-01-0" + n, createdAt: "2026-01-01T00:00:00.000Z" })),
      activeId: "p1",
    });
    await mockJson(page, "**/api/family", { family: { members: [] } });
    await mockJson(page, "**/api/family/report", { saved: null, status: "idle" });

    await page.goto("/explore/family");
    const cta = page.locator(".intro-cta");
    await expect(cta).toContainText("가족 한 명 추가하기");
    await expect(cta).toHaveAttribute("href", "/family#family-form");
    await expect(page.locator(".pi-cta-note")).not.toContainText("바로 볼 수 있어");
  });

  test("가족은 등록됐지만 이번 풀이에 아무도 안 골랐으면 '선택하기'로 안내한다", async ({ page }) => {
    await mockJson(page, "**/api/family", {
      family: { members: [MEMBER("m1", "가상엄마"), MEMBER("m2", "가상아빠")], reportMemberIds: [] },
    });
    await mockJson(page, "**/api/family/report", { saved: null, status: "idle" });

    await page.goto("/explore/family");
    await expect(page.locator(".intro-cta")).toContainText("풀이에 포함할 가족 선택하기");
  });

  test("본인 + 선택 가족이 있으면 총 인원을 설명하고 만들기로 안내한다", async ({ page }) => {
    await mockJson(page, "**/api/family", {
      family: { members: [MEMBER("m1", "가상엄마")], reportMemberIds: ["m1"] },
    });
    await mockJson(page, "**/api/family/report", { saved: null, status: "idle" });

    await page.goto("/explore/family");
    await expect(page.locator(".intro-cta")).toContainText("가족 풀이 만들기");
    await expect(page.locator(".pi-cta-note")).toContainText("총 2명");
  });

  test("저장본이 있으면 보기로, 생성 중이면 진행 안내로 바뀐다", async ({ page }) => {
    await mockJson(page, "**/api/family", { family: { members: [MEMBER("m1", "가상엄마")], reportMemberIds: ["m1"] } });
    await mockJson(page, "**/api/family/report", { saved: { report: "{}", generatedAt: "2026-09-01T00:00:00.000Z" }, status: "idle" });
    await page.goto("/explore/family");
    await expect(page.locator(".intro-cta")).toContainText("우리 가족 풀이 보기");

    await page.unroute("**/api/family/report");
    await mockJson(page, "**/api/family/report", { saved: null, status: "generating" });
    await page.goto("/explore/family");
    await expect(page.locator(".intro-cta")).toContainText("가족 풀이 생성 중");
  });

  test("조회가 실패하면 '가족 없음'이 아니라 다시 불러오기를 보여준다", async ({ page }) => {
    await failRoute(page, "**/api/family", "server");
    await mockJson(page, "**/api/family/report", { saved: null, status: "idle" });

    await page.goto("/explore/family");
    await expect(page.locator(".intro-cta")).toContainText("다시 불러오기");
    await expect(page.locator(".pi-mine")).not.toContainText("아직 등록한 가족이 없어");
  });

  test("리포트 포함 인원은 본인 + 가족 최대 3명 제한을 유지한다", async ({ page }) => {
    const members = ["m1", "m2", "m3", "m4", "m5"].map((id, i) => MEMBER(id, `가상${i}`));
    await mockJson(page, "**/api/family", { family: { members, reportMemberIds: ["m1", "m2", "m3", "m4", "m5"] } });
    await mockJson(page, "**/api/family/report", { saved: null, status: "idle" });

    await page.goto("/explore/family");
    // 선택 규칙(normalizeFamilyReportMemberIds)이 3명으로 잘라 준다 → 본인 포함 4명.
    await expect(page.locator(".pi-cta-note")).toContainText("총 4명");
  });
});
