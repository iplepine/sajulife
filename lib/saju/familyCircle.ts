import type { SajuResult } from "@/lib/saju/calculator";

/**
 * 가족 현재 결 관계도(FamilyCircle)에 한 명을 그리기 위한 데이터.
 * 색은 CSS 변수 문자열("var(--el-fire)" 등) — 가족 페이지의 이름 옆 점(el-dot)과 같은 순서.
 *
 * 타입을 lib에 두어 API 라우트(서버)·페이지·공유 스냅샷이 components 의존 없이 공유한다.
 * components/FamilyCircle.tsx가 이 타입을 re-export 한다(기존 import 호환).
 */
export type FamilyCircleMember = {
  id: string;
  name: string;
  relation: string;
  color: string;
  saju: SajuResult;
  birthYear: number;
};

/** 본인(먹색) 외 구성원 색 순서 — 또렷이 구분되는 빨강·파랑·초록·금·회색. */
export const FAMILY_PALETTE = ["fire", "water", "wood", "earth", "metal"] as const;

function birthYearOf(saju: SajuResult): number {
  return Number(saju.input.birthDate.split("-")[0]) || 0;
}

/**
 * 본인 + 구성원을 FamilyCircle용 멤버 배열로 만든다.
 * - 색은 `members` 원본 인덱스 기준(사주 계산 실패해 빠져도 남은 멤버 색이 밀리지 않게 인덱스로 매긴 뒤 필터).
 * - 본인은 맨 앞에 먹색("var(--text)"), 관계 "나"로 prepend.
 * 가족 페이지와 공유 API가 동일 출력을 내도록 단일 출처로 둔다.
 */
export function buildFamilyCircleMembers(
  self: { name: string; saju: SajuResult } | null,
  members: Array<{ id: string; name: string; relation: string; saju: SajuResult | null }>,
): FamilyCircleMember[] {
  const memberCircles = members
    .map((m, i): FamilyCircleMember | null =>
      m.saju
        ? {
            id: m.id,
            name: m.name,
            relation: m.relation,
            color: `var(--el-${FAMILY_PALETTE[i % FAMILY_PALETTE.length]})`,
            saju: m.saju,
            birthYear: birthYearOf(m.saju),
          }
        : null,
    )
    .filter((m): m is FamilyCircleMember => m !== null);

  const selfMember: FamilyCircleMember | null = self
    ? {
        id: "self",
        name: self.name,
        relation: "나",
        color: "var(--text)",
        saju: self.saju,
        birthYear: birthYearOf(self.saju),
      }
    : null;

  return selfMember ? [selfMember, ...memberCircles] : memberCircles;
}
