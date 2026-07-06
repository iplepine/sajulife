/**
 * 가로 스크롤 레일의 '지금' 셀 위치를 잡아준다.
 *
 * getBoundingClientRect(스크롤·페인트 타이밍 의존) 대신 offsetLeft(정적 위치)를
 * 써서, 아직 스크롤 전이거나 레이아웃이 덜 끝난 순간에도 안전하게 계산한다.
 * offsetLeft 합산이 container에서 멈추도록, 사용처에서 container에 position:relative를 준다.
 * 세로(페이지) 스크롤은 건드리지 않도록 scrollLeft만 조정한다.
 */

/** container 기준 요소의 왼쪽 오프셋(정적). offsetParent 체인을 container까지 합산. */
function offsetLeftWithin(container: HTMLElement, el: HTMLElement): number {
  let left = 0;
  let node: HTMLElement | null = el;
  while (node && node !== container) {
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return left;
}

function clampScroll(container: HTMLElement, target: number): void {
  const max = container.scrollWidth - container.clientWidth;
  container.scrollLeft = Math.max(0, Math.min(target, max));
}

/** '지금' 셀을 컨테이너 가운데로 맞춘다. 시작/끝은 clamp(빈 여백 방지). */
export function centerCurrentInScroller(
  container: HTMLElement | null | undefined,
  currentSelector: string,
): void {
  if (!container) return;
  const cur = container.querySelector<HTMLElement>(currentSelector);
  if (!cur) return;
  const left = offsetLeftWithin(container, cur);
  clampScroll(container, left + cur.offsetWidth / 2 - container.clientWidth / 2);
}

/**
 * '지금' 셀을 컨테이너 왼쪽에 붙인다 — 지금→미래를 먼저 보여주는 정렬.
 * peek 만큼만 이전 칸을 살짝 남겨(맥락) 나머지 미래 칸에 폭을 몰아준다.
 * '생애 흐름'처럼 "언제 오나"가 핵심인 레일에 쓴다(가운데 정렬은 과거에 폭을 낭비).
 */
export function alignCurrentStartInScroller(
  container: HTMLElement | null | undefined,
  currentSelector: string,
  peek = 22,
): void {
  if (!container) return;
  const cur = container.querySelector<HTMLElement>(currentSelector);
  if (!cur) return;
  const left = offsetLeftWithin(container, cur);
  clampScroll(container, left - peek);
}

/**
 * 정렬을 즉시 + 다음 두 프레임에 걸쳐 멱등 실행한다.
 * 즉시 실행(offsetLeft가 동기 레이아웃을 강제)으로 대개 끝나지만, 폰트·이미지로
 * 폭이 늦게 잡히는 경우까지 커버하려 rAF·더블 rAF로 한 번 더 맞춘다(멱등).
 * React effect의 cleanup으로 쓸 수 있게 취소 함수를 반환한다.
 */
function scheduleFrames(run: () => void): () => void {
  const rafs: number[] = [];
  run();
  rafs.push(
    requestAnimationFrame(() => {
      run();
      rafs.push(requestAnimationFrame(run));
    }),
  );
  return () => rafs.forEach((id) => cancelAnimationFrame(id));
}

export function scheduleCenterCurrent(
  getContainers: () => Array<HTMLElement | null | undefined>,
  currentSelector: string,
): () => void {
  return scheduleFrames(() => {
    for (const c of getContainers()) centerCurrentInScroller(c, currentSelector);
  });
}

export function scheduleAlignCurrentStart(
  getContainers: () => Array<HTMLElement | null | undefined>,
  currentSelector: string,
  peek?: number,
): () => void {
  return scheduleFrames(() => {
    for (const c of getContainers()) alignCurrentStartInScroller(c, currentSelector, peek);
  });
}
