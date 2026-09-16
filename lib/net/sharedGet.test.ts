import assert from "node:assert/strict";
import test from "node:test";
import { sharedGet } from "./sharedGet";

/** 호출 횟수를 세고, 응답 시점을 테스트가 직접 정하는 가짜 fetch. */
function stubFetch() {
  const calls: string[] = [];
  const pending: Array<{ resolve: (res: Response) => void; reject: (err: unknown) => void }> = [];
  globalThis.fetch = ((url: string) => {
    calls.push(url);
    return new Promise<Response>((resolve, reject) => pending.push({ resolve, reject }));
  }) as typeof fetch;
  return {
    calls,
    respond(body: unknown, status = 200) {
      pending.shift()!.resolve(new Response(JSON.stringify(body), { status }));
    },
    fail(err: unknown) {
      pending.shift()!.reject(err);
    },
  };
}

test("같은 순간에 부른 두 화면은 요청 하나를 나눠 쓰고, 둘 다 본문을 읽는다", async () => {
  const f = stubFetch();
  const a = sharedGet("/api/saju/chart");
  const b = sharedGet("/api/saju/chart");
  assert.equal(f.calls.length, 1);
  f.respond({ saju: "x" });
  const [ra, rb] = await Promise.all([a, b]);
  assert.deepEqual(await ra.json(), { saju: "x" });
  assert.deepEqual(await rb.json(), { saju: "x" });
});

test("주소가 다르면 합치지 않는다", async () => {
  const f = stubFetch();
  const a = sharedGet("/api/saju/chart");
  const b = sharedGet("/api/family");
  assert.deepEqual(f.calls, ["/api/saju/chart", "/api/family"]);
  f.respond({});
  f.respond({});
  await Promise.all([a, b]);
});

test("끝난 응답은 붙잡지 않는다 — 다음 호출은 새로 요청한다(인물 전환 뒤 옛 사주표 방지)", async () => {
  const f = stubFetch();
  const first = sharedGet("/api/saju/chart");
  f.respond({ saju: "old" });
  await first;
  const second = sharedGet("/api/saju/chart");
  assert.equal(f.calls.length, 2);
  f.respond({ saju: "new" });
  assert.deepEqual(await (await second).json(), { saju: "new" });
});

test("내 signal로 멈추면 나만 그만 기다리고, 같이 기다리던 쪽은 응답을 받는다", async () => {
  const f = stubFetch();
  const controller = new AbortController();
  const mine = sharedGet("/api/saju/chart", { signal: controller.signal });
  const other = sharedGet("/api/saju/chart");
  controller.abort();
  await assert.rejects(mine, { name: "AbortError" });
  f.respond({ saju: "x" });
  assert.deepEqual(await (await other).json(), { saju: "x" });
});

test("이미 멈춘 signal이면 요청을 보내지 않는다", async () => {
  const f = stubFetch();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(sharedGet("/api/saju/chart", { signal: controller.signal }), { name: "AbortError" });
  assert.equal(f.calls.length, 0);
});

test("네트워크 실패는 기다리던 모두에게 전해지고, 다음 호출은 다시 시도한다", async () => {
  const f = stubFetch();
  const a = sharedGet("/api/saju/chart");
  const b = sharedGet("/api/saju/chart");
  f.fail(new TypeError("Failed to fetch"));
  await assert.rejects(a, TypeError);
  await assert.rejects(b, TypeError);
  const retry = sharedGet("/api/saju/chart");
  assert.equal(f.calls.length, 2);
  f.respond({ saju: "x" });
  assert.equal((await retry).ok, true);
});

test("실패 응답(401 등)도 그대로 나눠 준다 — 받는 쪽이 .ok로 판단한다", async () => {
  const f = stubFetch();
  const a = sharedGet("/api/saju/chart");
  const b = sharedGet("/api/saju/chart");
  f.respond({ error: "Unauthorized" }, 401);
  assert.equal((await a).status, 401);
  assert.equal((await b).status, 401);
});
