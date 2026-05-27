import { NextResponse } from "next/server";
import { requireGuestId } from "@/lib/guest";
import { getTci, saveTci } from "@/lib/store/guest";

export const runtime = "nodejs";

export async function GET() {
  const guestId = await requireGuestId();
  const tci = await getTci(guestId);
  return NextResponse.json({ tci });
}

export async function PUT(req: Request) {
  const guestId = await requireGuestId();
  const body = (await req.json()) as { answers?: Record<string, number> };
  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers 누락" }, { status: 400 });
  }
  const data = { answers: body.answers, updatedAt: new Date().toISOString() };
  await saveTci(guestId, data);
  return NextResponse.json({ tci: data });
}
