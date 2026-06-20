import { randomUUID } from "node:crypto";
import { readJson, writeJson } from "./kv";
import { userActionsKey } from "./keys";
import type { ActionItem } from "./types";

/**
 * 코칭 액션 플랜 스토어.
 * - 한 사용자의 액션 아이템을 배열 하나에 모아 KV에 보관한다 (최신순).
 * - 리포트에서 "등록"하거나 직접 추가하면 prepend.
 * - 같은 출처(source) + 같은 제목(title)이면 중복 등록하지 않는다
 *   (리포트를 다시 열어 또 눌러도 한 번만 들어가게).
 * - 폭주 방지로 최근 MAX_ITEMS건만 유지한다.
 */
const MAX_ITEMS = 200;

/** 새 아이템 입력 — id·done·createdAt은 서버가 채운다. */
export type NewActionInput = Pick<
  ActionItem,
  "title" | "timeframe" | "hint" | "source" | "sourceLabel"
>;

export async function listActions(userId: string): Promise<ActionItem[]> {
  return readJson<ActionItem[]>(userActionsKey(userId), []);
}

/**
 * 아이템들을 추가한다. 중복(같은 source+title)은 건너뛴다.
 * 실제로 새로 추가된 아이템만 반환한다.
 */
export async function addActions(
  userId: string,
  inputs: NewActionInput[],
): Promise<ActionItem[]> {
  if (inputs.length === 0) return [];
  const all = await listActions(userId);
  const seen = new Set(all.map((a) => dedupeKey(a.source, a.title)));

  const created: ActionItem[] = [];
  const now = new Date().toISOString();
  for (const input of inputs) {
    const title = input.title.trim();
    if (!title) continue;
    const key = dedupeKey(input.source, title);
    if (seen.has(key)) continue;
    seen.add(key);
    created.push({
      id: `a_${randomUUID().slice(0, 8)}`,
      title,
      timeframe: input.timeframe,
      hint: input.hint?.trim() || undefined,
      source: input.source,
      sourceLabel: input.sourceLabel,
      done: false,
      createdAt: now,
    });
  }
  if (created.length === 0) return [];

  const next = [...created, ...all].slice(0, MAX_ITEMS);
  await writeJson(userActionsKey(userId), next);
  return created;
}

/** 완료 토글. 갱신된 아이템을 반환(없으면 null). */
export async function setActionDone(
  userId: string,
  id: string,
  done: boolean,
): Promise<ActionItem | null> {
  const all = await listActions(userId);
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const updated: ActionItem = {
    ...all[idx],
    done,
    doneAt: done ? new Date().toISOString() : undefined,
  };
  all[idx] = updated;
  await writeJson(userActionsKey(userId), all);
  return updated;
}

/** 아이템 삭제. 삭제됐으면 true. */
export async function deleteAction(userId: string, id: string): Promise<boolean> {
  const all = await listActions(userId);
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return false;
  await writeJson(userActionsKey(userId), next);
  return true;
}

function dedupeKey(source: string, title: string): string {
  return `${source}::${title.trim()}`;
}
