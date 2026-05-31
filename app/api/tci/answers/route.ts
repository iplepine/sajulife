import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";
import { getTci, getTciByVariant, saveTci } from "@/lib/store/guest";
import type { TciVariant } from "@/lib/store/types";

export const runtime = "nodejs";

function parseVariant(v: string | null): TciVariant | null {
  if (v === "short" || v === "full") return v;
  return null;
}

/**
 * GET — TCI 응답 조회.
 * `?variant=short|full` 지정 시 해당 variant만 반환.
 * 미지정 시 가장 최근 갱신된 variant를 반환(이전 동작 호환).
 */
export async function GET(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const variant = parseVariant(url.searchParams.get("variant"));
  const tci = variant ? await getTciByVariant(userId, variant) : await getTci(userId);
  return NextResponse.json({ tci });
}

/**
 * PUT — TCI 응답 저장.
 * body는 `{ variant, answers }`. variant 누락 시 `short`로 처리(레거시 호환).
 */
export async function PUT(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as {
    variant?: string;
    answers?: Record<string, number>;
  };
  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers 누락" }, { status: 400 });
  }
  const variant = parseVariant(body.variant ?? null) ?? "short";
  const data = {
    variant,
    answers: body.answers,
    updatedAt: new Date().toISOString(),
  };
  await saveTci(userId, data);
  return NextResponse.json({ tci: data });
}
