import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { getConsult } from "@/lib/store/consults";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** GET — 단건 상담 풀이 상세. */
export async function GET(_req: Request, ctx: RouteContext) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const record = await getConsult(userId, id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ record });
}
