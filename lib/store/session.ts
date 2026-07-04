import { getUserIdOrNull } from "@/lib/auth";
import { getActiveScopeId } from "./people";

/**
 * 라우트 진입점 — 현재 세션 + 활성 인물을 한 번에 해석한다.
 *
 * 반환:
 * - userId : 계정 식별자(real Supabase uid). 인물 목록/전환 등 계정 단위 작업에만 사용.
 * - scopeId: 활성 인물을 반영한 데이터 스코프. ★프로필·리포트·상담 등 모든 스토어 호출은 이 값을 넘긴다.★
 * - personId: 활성 인물 id.
 * 세션이 없으면 null.
 */
export async function resolveScopeOrNull(): Promise<
  { userId: string; scopeId: string; personId: string } | null
> {
  const userId = await getUserIdOrNull();
  if (!userId) return null;
  const { scopeId, personId } = await getActiveScopeId(userId);
  return { userId, scopeId, personId };
}
