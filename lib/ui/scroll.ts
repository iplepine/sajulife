/**
 * 가로 스크롤 레일에서 '지금' 셀을 중앙으로 맞춰준다.
 * 진입 시 오늘(현재 대운·세운) 위치가 화면 밖에 있으면 안 보이므로,
 * 마운트 직후 현재 셀을 가운데로 스크롤한다. 시작/끝은 clamp(빈 여백 방지).
 *
 * getBoundingClientRect(스크롤·페인트 타이밍 의존) 대신 offsetLeft(정적 위치)를
 * 써서, 아직 스크롤 전이거나 레이아웃이 덜 끝난 순간에도 안전하게 계산한다.
 * offsetLeft 합산이 container에서 멈추도록, 사용처에서 container에 position:relative를 준다.
 * 세로(페이지) 스크롤은 건드리지 않도록 scrollLeft만 조정한다.
 */
export function centerCurrentInScroller(
  container: HTMLElement | null | undefined,
  currentSelector: string,
): void {
  if (!container) return;
  const cur = container.querySelector<HTMLElement>(currentSelector);
  if (!cur) return;
  let left = 0;
  let node: HTMLElement | null = cur;
  while (node && node !== container) {
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  const target = left + cur.offsetWidth / 2 - container.clientWidth / 2;
  const max = container.scrollWidth - container.clientWidth;
  container.scrollLeft = Math.max(0, Math.min(target, max));
}

/**
 * 현재 셀 중앙 정렬을 즉시 + 다음 두 프레임에 걸쳐 실행한다.
 * 즉시 실행(offsetLeft가 동기 레이아웃을 강제)으로 대개 끝나지만, 폰트·이미지로
 * 폭이 늦게 잡히는 경우까지 커버하려 rAF·더블 rAF로 한 번 더 맞춘다(멱등).
 * React effect의 cleanup으로 쓸 수 있게 취소 함수를 반환한다.
 */
export function scheduleCenterCurrent(
  getContainers: () => Array<HTMLElement | null | undefined>,
  currentSelector: string,
): () => void {
  const rafs: number[] = [];
  const run = () => {
    for (const c of getContainers()) centerCurrentInScroller(c, currentSelector);
  };
  run();
  rafs.push(
    requestAnimationFrame(() => {
      run();
      rafs.push(requestAnimationFrame(run));
    }),
  );
  return () => rafs.forEach((id) => cancelAnimationFrame(id));
}
