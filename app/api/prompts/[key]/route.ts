import { NextResponse } from "next/server";
import { getPrompt, resetPrompt, savePrompt } from "@/lib/prompts/store";
import type { PromptKey } from "@/lib/store/types";

export const runtime = "nodejs";

const VALID_KEYS: PromptKey[] = ["tci-report", "personal-saju", "family-saju", "tci-saju-fusion"];

function isValidKey(key: string): key is PromptKey {
  return (VALID_KEYS as string[]).includes(key);
}

type RouteContext = { params: Promise<{ key: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { key } = await ctx.params;
  if (!isValidKey(key)) return NextResponse.json({ error: "unknown key" }, { status: 404 });
  const prompt = await getPrompt(key);
  return NextResponse.json({ prompt });
}

export async function PUT(req: Request, ctx: RouteContext) {
  const { key } = await ctx.params;
  if (!isValidKey(key)) return NextResponse.json({ error: "unknown key" }, { status: 404 });
  const body = (await req.json()) as { template?: string; temperature?: number };
  if (typeof body.template !== "string") {
    return NextResponse.json({ error: "template 누락" }, { status: 400 });
  }
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;
  await savePrompt(key, { template: body.template, temperature, updatedAt: new Date().toISOString() });
  const prompt = await getPrompt(key);
  return NextResponse.json({ prompt });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const { key } = await ctx.params;
  if (!isValidKey(key)) return NextResponse.json({ error: "unknown key" }, { status: 404 });
  const prompt = await resetPrompt(key);
  return NextResponse.json({ prompt });
}
