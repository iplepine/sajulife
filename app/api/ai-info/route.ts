import { NextResponse } from "next/server";
import { getAIConfigurationStatus } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET() {
  const config = getAIConfigurationStatus();
  return NextResponse.json({
    ...config,
    // 기존 Debug panel 호환값. 주·보조 키 모두 없을 때만 false다.
    hasKey: config.hasPrimaryKey || config.hasFallbackKey,
  });
}
