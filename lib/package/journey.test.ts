import assert from "node:assert/strict";
import test from "node:test";
import { nextJourneyStep, PROFILE_FOR_PACKAGE_HREF, TCI_FOR_FUSION_HREF, type PackageJourneyState } from "./journey";

const base: PackageJourneyState = {
  entitled: true,
  hasProfile: true,
  personal: { saved: false, status: "idle" },
  tci: { complete: false, answered: 0, total: 35 },
  fusion: { saved: false, status: "idle" },
};

function at(patch: Partial<PackageJourneyState>): PackageJourneyState {
  return { ...base, ...patch };
}

test("결제 전이면 무엇이 있든 결제부터 — 저장본이 있어도 새로 만들 권한은 결제가 연다", () => {
  const step = nextJourneyStep(at({ entitled: false, personal: { saved: true, status: "idle" } }));
  assert.equal(step.key, "buy");
  assert.equal(step.href, "/checkout");
  assert.equal(step.stage, 0);
});

test("결제 후 사주 정보가 없으면 입력 → 입력이 끝나면 곧바로 사주 풀이를 만든다", () => {
  const step = nextJourneyStep(at({ hasProfile: false }));
  assert.equal(step.key, "profile");
  assert.equal(step.href, PROFILE_FOR_PACKAGE_HREF);
  assert.ok(decodeURIComponent(step.href).includes("/saju?generate=1"));
});

test("사주 풀이 없음 → 만들기 의사를 실어 사주 화면으로", () => {
  const step = nextJourneyStep(base);
  assert.equal(step.key, "personal");
  assert.equal(step.href, "/saju?generate=1");
  assert.equal(step.stage, 1);
});

test("생성 중·실패는 새 생성을 실어 보내지 않는다(재생성 비용 방지)", () => {
  assert.equal(nextJourneyStep(at({ personal: { saved: false, status: "generating" } })).href, "/saju");
  const retry = nextJourneyStep(at({ personal: { saved: false, status: "error" } }));
  assert.equal(retry.key, "personal-retry");
  assert.equal(retry.href, "/saju");
});

test("사주 풀이가 나오면 기질 검사 — 끝나면 올해 운세로 이어지는 주소", () => {
  const step = nextJourneyStep(at({ personal: { saved: true, status: "idle" } }));
  assert.equal(step.key, "tci");
  assert.equal(step.href, TCI_FOR_FUSION_HREF);
  assert.equal(step.stage, 2);
});

test("기질 검사를 반쯤 했으면 '이어서'와 진행 수를 말한다", () => {
  const step = nextJourneyStep(at({ personal: { saved: true, status: "idle" }, tci: { complete: false, answered: 12, total: 35 } }));
  assert.equal(step.label, "기질 검사 이어서 하기");
  assert.ok(step.note.includes("12/35"));
});

test("재료가 다 모이면 올해 운세 만들기 → 다 만들었으면 보기", () => {
  const ready = at({ personal: { saved: true, status: "idle" }, tci: { complete: true, answered: 35, total: 35 } });
  const make = nextJourneyStep(ready);
  assert.equal(make.key, "fusion");
  assert.equal(make.href, "/fusion?generate=1");
  assert.equal(make.stage, 3);

  const done = nextJourneyStep({ ...ready, fusion: { saved: true, status: "idle" } });
  assert.equal(done.key, "done");
  assert.equal(done.href, "/fusion");
});
