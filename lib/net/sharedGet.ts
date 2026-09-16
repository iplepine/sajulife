/**
 * 같은 주소로 ★동시에★ 나간 GET을 한 번으로 합친다 (클라이언트 전용).
 *
 * ★왜 필요한가★ — 화면을 옮길 때마다 SeasonThemeProvider(앱 계절색)와 그 화면(사주표·히어로 궤도)이
 * /api/saju/chart를 따로 불러, 한 번 이동에 세션 확인·프로필 조회·만세력 계산이 서버에서 두 번씩 돌았다.
 * 둘은 같은 렌더의 effect에서 거의 같은 순간에 출발하므로 ★진행 중인 요청만★ 나눠 쓰면 중복이 사라진다.
 *
 * ★끝난 응답은 붙잡지 않는다★ — 응답이 오는 순간 공유를 푼다. 캐시가 아니라 "같은 순간의 중복 제거"다.
 * 인물을 바꾸거나 사주 정보를 고친 직후에 옛 사주표를 돌려주면 안 되기 때문이다.
 *
 * 받는 쪽마다 응답을 복제해 주므로 평소 fetch 응답처럼 .ok·.json()을 그대로 쓰면 된다.
 * signal은 ★내 기다림만★ 멈춘다 — 같은 요청을 기다리는 다른 화면까지 끊지 않는다.
 */

const inflight = new Map<string, Promise<Response>>();

export function sharedGet(url: string, init?: { signal?: AbortSignal }): Promise<Response> {
  const signal = init?.signal;
  if (signal?.aborted) return Promise.reject(abortReason(signal));

  let request = inflight.get(url);
  if (!request) {
    const started = fetch(url, { cache: "no-store" });
    const release = () => {
      if (inflight.get(url) === started) inflight.delete(url);
    };
    started.then(release, release);
    inflight.set(url, started);
    request = started;
  }

  // 본문은 한 번만 읽을 수 있다 — 원본을 그대로 나눠 주면 두 번째로 읽는 쪽이 깨진다.
  const mine = request.then((res) => res.clone());
  if (!signal) return mine;
  return new Promise<Response>((resolve, reject) => {
    const onAbort = () => reject(abortReason(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    mine.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
}
