import { getItemsForScoring } from "@/lib/tci/questions";
import type { TciVariant } from "@/lib/store/types";

/**
 * 기질 설문의 ★완료 판정★ — 화면과 서버가 같은 기준을 쓰기 위한 단일 출처.
 *
 * ★왜 필요한가★ — 예전엔 `Boolean(tci)` 하나로 "설문 끝남"을 판단했다. 응답이 한 개만
 * 저장돼 있어도 저장본이 존재하니 참이 됐고, 그대로 풀이 생성까지 갔다.
 * 부분 응답으로 만든 풀이는 없는 근거로 쓴 글이 된다.
 *
 * ★자동 저장은 부분 응답을 계속 허용한다★ — 이어서 풀려면 중간 저장이 있어야 한다.
 * 전 문항을 요구하는 시점은 ★생성 시작★뿐이다. 34/35는 "이어서 풀기", 35/35만 준비 완료.
 *
 * ★화면 버튼만 막는 건 충분하지 않다★ — 서버의 생성 POST도 같은 판정을 쓴다.
 */

/** 리커트 응답으로 인정하는 값 — 1~5 정수. 문자열·0·6·NaN은 응답이 아니다. */
export function isValidTciAnswer(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

export type TciCompletion = {
  variant: TciVariant;
  /** 유효한 응답이 채워진 문항 수 */
  answered: number;
  /** 해당 variant의 전체 문항 수 */
  total: number;
  /** 전 문항이 유효하게 채워졌는지 — 생성 시작의 유일한 기준 */
  complete: boolean;
};

/** 문항 목록과 응답을 대조해 완료 상태를 센다. 문항 ID가 다르면 세지 않는다. */
export function tciCompletionFromItems(
  variant: TciVariant,
  itemIds: readonly string[],
  answers: Record<string, unknown> | null | undefined,
): TciCompletion {
  const total = itemIds.length;
  if (!answers || typeof answers !== "object") {
    return { variant, answered: 0, total, complete: false };
  }
  let answered = 0;
  for (const id of itemIds) {
    if (isValidTciAnswer(answers[id])) answered += 1;
  }
  // 문항이 아직 안 채워진 확장판(total 0)을 "완료"로 보지 않는다.
  return { variant, answered, total, complete: total > 0 && answered === total };
}

/** 서버용 — variant의 문항을 직접 읽어 완료 상태를 판정한다. */
export async function tciCompletionFor(
  variant: TciVariant,
  answers: Record<string, unknown> | null | undefined,
): Promise<TciCompletion> {
  const items = await getItemsForScoring(variant);
  return tciCompletionFromItems(variant, items.map((item) => item.id), answers);
}
