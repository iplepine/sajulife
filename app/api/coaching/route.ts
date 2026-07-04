import { NextResponse } from "next/server";
import { resolveScopeOrNull } from "@/lib/store/session";
import { addActions, listActions, type NewActionInput } from "@/lib/store/actions";
import type { ActionSource } from "@/lib/store/types";

export const runtime = "nodejs";

const VALID_SOURCES: ActionSource[] = ["tci", "personal", "family", "fusion", "consult", "manual"];
const VALID_TIMEFRAMES = ["오늘", "이번 주", "이번 달", ""];

function isSource(v: unknown): v is ActionSource {
  return typeof v === "string" && (VALID_SOURCES as string[]).includes(v);
}

/** 입력 한 건을 검증·정규화. 유효하지 않으면 null. */
function sanitize(raw: unknown): NewActionInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title) return null;
  if (!isSource(o.source)) return null;
  const timeframe = typeof o.timeframe === "string" && VALID_TIMEFRAMES.includes(o.timeframe.trim())
    ? o.timeframe.trim()
    : "";
  const hint = typeof o.hint === "string" && o.hint.trim() ? o.hint.trim().slice(0, 200) : undefined;
  const sourceLabel = typeof o.sourceLabel === "string" && o.sourceLabel.trim()
    ? o.sourceLabel.trim().slice(0, 40)
    : "코칭";
  return { title: title.slice(0, 200), timeframe, hint, source: o.source, sourceLabel };
}

/** GET — 코칭 액션 플랜 전체. */
export async function GET() {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;
  const items = await listActions(userId);
  return NextResponse.json({ items });
}

/** POST — 액션 아이템 추가(풀이에서 등록 또는 직접 추가). body: { items: [...] }. */
export async function POST(req: Request) {
  const scope = await resolveScopeOrNull();
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 활성 인물을 반영한 데이터 스코프. 이하 모든 스토어 호출은 이 값을 넘긴다.
  const userId = scope.scopeId;

  const body = (await req.json().catch(() => ({}))) as { items?: unknown };
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "추가할 액션이 없습니다." }, { status: 400 });
  }
  if (rawItems.length > 20) {
    return NextResponse.json({ error: "한 번에 추가할 수 있는 액션은 최대 20개입니다." }, { status: 400 });
  }

  const inputs = rawItems.map(sanitize).filter((x): x is NewActionInput => x !== null);
  if (inputs.length === 0) {
    return NextResponse.json({ error: "유효한 액션이 없습니다 (제목·출처 확인)." }, { status: 400 });
  }

  const added = await addActions(userId, inputs);
  const items = await listActions(userId);
  return NextResponse.json({ added, items });
}
