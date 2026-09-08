/**
 * "앞 화면에서 이미 만들기를 눌렀다"는 의사를 결과 화면까지 나르는 표시.
 *
 * ★왜 주소로 나르나★ — 결과 화면은 단순 방문과 "만들어줘"를 구분해야 한다.
 * 상태로만 두면 새로고침·뒤로가기에서 사라지고, 자동 생성으로 되돌리면 방문만으로 비용이 든다.
 * 주소의 표시는 ★한 번 쓰고 즉시 지운다★ — 그래야 새로고침이 재생성으로 이어지지 않는다.
 *
 * 링크 쪽에서는 `?generate=1`을 붙이면 된다(withGenerateIntent).
 */

const PARAM = "generate";

/** 링크에 생성 의사를 실어 보낸다. */
export function withGenerateIntent(href: string): string {
  return href.includes("?") ? `${href}&${PARAM}=1` : `${href}?${PARAM}=1`;
}

/** 지금 주소에 생성 의사가 실려 있는지. 서버 렌더 중에는 항상 false. */
export function wantsGenerate(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(PARAM) === "1";
}

/**
 * 표시를 지운다 — 히스토리를 늘리지 않고 현재 항목만 바꾼다.
 * 이걸 안 하면 새로고침·뒤로가기마다 생성이 다시 시작된다.
 */
export function consumeGenerateIntent(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PARAM)) return;
  url.searchParams.delete(PARAM);
  const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "") + url.hash;
  window.history.replaceState(window.history.state, "", next);
}
