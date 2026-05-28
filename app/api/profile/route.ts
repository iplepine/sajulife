import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { getProfile, saveProfile } from "@/lib/store/guest";
import type { SajuProfile } from "@/lib/store/types";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getProfile(userId);
  return NextResponse.json({ profile });
}

export async function PUT(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  await saveProfile(userId, profile);
  return NextResponse.json({ profile });
}
