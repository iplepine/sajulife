import { NextResponse } from "next/server";
import { requireGuestId } from "@/lib/guest";
import { getProfile, saveProfile } from "@/lib/store/guest";
import type { SajuProfile } from "@/lib/store/types";

export const runtime = "nodejs";

export async function GET() {
  const guestId = await requireGuestId();
  const profile = await getProfile(guestId);
  return NextResponse.json({ profile });
}

export async function PUT(req: Request) {
  const guestId = await requireGuestId();
  const body = (await req.json()) as Partial<SajuProfile>;
  const required = ["name", "birthDate", "gender", "calendar"] as const;
  for (const key of required) {
    if (!body[key]) return NextResponse.json({ error: `${key} 누락` }, { status: 400 });
  }
  const profile: SajuProfile = {
    name: body.name!,
    birthDate: body.birthDate!,
    birthTime: body.birthTime ?? "",
    gender: body.gender!,
    calendar: body.calendar!,
    note: body.note,
  };
  await saveProfile(guestId, profile);
  return NextResponse.json({ profile });
}
