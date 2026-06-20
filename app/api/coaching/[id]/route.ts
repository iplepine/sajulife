import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { deleteAction, setActionDone } from "@/lib/store/actions";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH — 완료 토글. body: { done: boolean }. */
export async function PATCH(req: Request, ctx: RouteContext) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { done?: unknown };
  if (typeof body.done !== "boolean") {
    return NextResponse.json({ error: "done(boolean)이 필요합니다." }, { status: 400 });
  }
  const item = await setActionDone(userId, id, body.done);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

/** DELETE — 액션 아이템 삭제. */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteAction(userId, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
