import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { getTicketBalance } from "@/lib/store/tickets";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const balance = await getTicketBalance(userId);
  return NextResponse.json({ balance });
}
