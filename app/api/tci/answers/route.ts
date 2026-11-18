import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { getTci, getTciByVariant, saveTci } from "@/lib/store/guest";
import type { TciVariant } from "@/lib/store/types";
import { getSavedReport } from "@/lib/store/reports";
import { consumeRevisitPart } from "@/lib/store/revisit";
import { tciCompletionFor } from "@/lib/tci/completion";

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
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
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
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
  const body = (await req.json()) as {
    variant?: string;
    answers?: Record<string, number>;
    /** 종합 사주 다시 보기의 기질 재검사 저장 — 다시 보기권의 '기질 검사' 1회를 쓴다. */
    revisit?: boolean;
  };
  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers 누락" }, { status: 400 });
  }
  const variant = parseVariant(body.variant ?? null) ?? "short";

  // ★최종 풀이까지 받은 뒤 끝낸 응답을 바꾸는 건 다시 보기권의 '기질 검사' 1회로만★(2026-11-18).
  // 처음 검사 중의 중간 저장·완료 저장은 그대로 둔다.
  const previous = await getTciByVariant(userId, variant);
  const changed = previous?.answers && JSON.stringify(previous.answers) !== JSON.stringify(body.answers);
  if (changed && (await tciCompletionFor(variant, previous.answers)).complete && (await getSavedReport(userId, "fusion"))) {
    const used = body.revisit ? await consumeRevisitPart(userId, "tci") : ({ ok: false, reason: "none" } as const);
    if (!used.ok) {
      return NextResponse.json(
        used.reason === "none"
          ? { error: "기질 다시 검사는 '종합 사주 다시 보기'에서 할 수 있어요.", code: "REVISIT_REQUIRED" }
          : { error: "이번 다시 보기에서 기질 검사는 이미 했어요.", code: "REVISIT_USED" },
        { status: used.reason === "none" ? 402 : 409 },
      );
    }
  }
  const data = {
    variant,
    answers: body.answers,
    updatedAt: new Date().toISOString(),
  };
  await saveTci(userId, data);
  return NextResponse.json({ tci: data });
}
