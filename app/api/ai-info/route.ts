import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const provider = process.env.AI_PROVIDER ?? "gemini";
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-pro";
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-key-here";
  return NextResponse.json({ provider, model, hasKey });
}
