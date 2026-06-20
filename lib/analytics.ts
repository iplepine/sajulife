import { track } from "@vercel/analytics";

/**
 * 전환 이벤트 기록 — 한 곳을 거치게 해서 프로바이더(현재 Vercel Analytics) 교체 시
 * 이 파일만 바꾸면 되게 한다. 방문자·페이지뷰는 루트 레이아웃의 <Analytics/>가 자동 추적하고,
 * 여기선 가입·리포트 생성·상담·공유 같은 '전환' 지점만 명시적으로 찍는다.
 *
 * 호출부는 모두 클라이언트 컴포넌트. 애널리틱스가 비활성(로컬·미설정)이면 track은 조용히 no-op.
 */
export type EventName =
  | "signup"
  | "report_generated"
  | "consult_asked"
  | "share_created";

export function trackEvent(
  name: EventName,
  props?: Record<string, string | number | boolean | null>,
): void {
  track(name, props);
}
