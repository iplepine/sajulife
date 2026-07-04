import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { getConsult } from "@/lib/store/consults";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** GET — 단건 상담 풀이 상세. */
export async function GET(_req: Request, ctx: RouteContext) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
  const { id } = await ctx.params;
  const record = await getConsult(userId, id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ record });
}
