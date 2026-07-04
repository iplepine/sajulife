/**
 * 데이터 스코프 — 한 계정 아래 여러 "인물"을 격리하기 위한 순수 헬퍼.
 *
 * 모든 스토어 함수(guest / reports / actions / consults / shares …)는 첫 인자로
 * 이 스코프 id를 받는다. 스토어·키 코드는 그대로 두고, 라우트가 넘기는 값만
 * userId → scopeId로 바꾸면 개인·기질·융합·가족·상담·공유가 전부 인물별로 분리된다.
 *
 * - 본인(self): scope = bare userId. → 레거시 데이터(user:{userId}:profile …)와 그대로 이어져 마이그레이션이 필요 없다.
 * - 추가 인물: scope = `${userId}:p:${personId}`. → user:{userId}:p:{personId}:… 로 완전 격리.
 *
 * userId는 콜론이 없는 UUID, personId는 `p_xxxxxxxx` 꼴이라 self의 하위 네임스페이스
 * (profile/tci/report/…)와 절대 충돌하지 않는다.
 */

/** 계정 본인을 가리키는 고정 인물 id. 이 인물의 스코프는 bare userId다(레거시 호환). */
export const SELF_PERSON_ID = "self";

/** (userId, personId) → 데이터 스코프 id. */
export function scopeIdFor(userId: string, personId: string): string {
  return personId === SELF_PERSON_ID ? userId : `${userId}:p:${personId}`;
}
