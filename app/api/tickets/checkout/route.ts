import { NextResponse } from "next/server";
import { getUserIdOrNull } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * 결제·권한 모델은 베타 검증 범위 밖이다.
 * 기존 클라이언트나 직접 API 요청도 새 결제를 시작하지 않도록 서버에서 막는다.
 */
export async function POST() {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json(
    { error: "베타 기간에는 티켓 구매를 받지 않아요. 개인 사주 풀이는 무료로 이용할 수 있어요." },
    { status: 409 },
  );
}
