import { NextResponse } from "next/server";
import { configuredAIDeepModel, configuredAIModel } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET() {
  const provider = process.env.AI_PROVIDER ?? "gemini";
  const model = configuredAIModel();
  const deepModel = configuredAIDeepModel();
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-key-here";
  return NextResponse.json({ provider, model, deepModel, hasKey });
}
