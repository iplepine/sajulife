import { NextResponse } from "next/server";
import { createGuest, getGuestIdFromCookie } from "@/lib/guest";

export const runtime = "nodejs";

export async function GET() {
  const id = await getGuestIdFromCookie();
  return NextResponse.json({ guestId: id });
}

export async function POST() {
  const existing = await getGuestIdFromCookie();
  if (existing) return NextResponse.json({ guestId: existing });
  const id = await createGuest();
  return NextResponse.json({ guestId: id });
}
