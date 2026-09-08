/**
 * 조회 결과를 ★성공 / 실패★로 나눠서 돌려주는 얇은 래퍼 (클라이언트 전용).
 *
 * ★왜 필요한가★ — 화면들이 `.catch(() => ({}))`나 `res.json()` 무조건 호출로 실패를 빈 값에
 * 합쳐 왔다. 그러면 500도, 네트워크 끊김도, 세션 만료도 전부 ★"아직 기록이 없어요"★로 보인다.
 * 사용자는 자기 데이터가 사라진 줄 알고, 다시 만들려 든다.
 *
 * 세션 만료(401)는 "데이터 없음"이 아니라 ★로그인으로 돌려보낼 일★이라 따로 구분한다.
 */

export type FetchFailure = { ok: false; kind: "auth" | "server" | "network"; status?: number };
export type FetchOutcome<T> = { ok: true; data: T } | FetchFailure;

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<FetchOutcome<T>> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (res.status === 401 || res.status === 403) return { ok: false, kind: "auth", status: res.status };
    if (!res.ok) return { ok: false, kind: "server", status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    // 네트워크 끊김·중단·JSON 파싱 실패 — 어느 쪽이든 "데이터 없음"은 아니다.
    return { ok: false, kind: "network" };
  }
}

/** 실패 종류별 사용자 문구. 리포트 화면 문구라 반말(CLAUDE.md). */
export function failureMessage(failure: FetchFailure): string {
  if (failure.kind === "auth") return "로그인이 풀렸어. 다시 로그인하면 그대로 돌아올 수 있어.";
  if (failure.kind === "network") return "네트워크가 끊겼어. 연결을 확인하고 다시 시도해줘.";
  return "지금 서버에서 불러오지 못했어. 잠깐 뒤에 다시 시도해줘.";
}

/** 세션이 풀렸을 때 되돌아올 주소를 붙인 로그인 경로. */
export function loginHrefFor(pathname: string): string {
  return `/?redirectedFrom=${encodeURIComponent(pathname)}`;
}
