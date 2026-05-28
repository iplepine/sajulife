import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { getTci, saveTci } from "@/lib/store/guest";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tci = await getTci(userId);
  return NextResponse.json({ tci });
}

export async function PUT(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { answers?: Record<string, number> };
  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers 누락" }, { status: 400 });
  }
  const data = { answers: body.answers, updatedAt: new Date().toISOString() };
  await saveTci(userId, data);
  return NextResponse.json({ tci: data });
}
