import { readJson, writeJson } from "./kv";
import { userConsultsKey } from "./keys";
import type { ConsultSummary, SavedConsult } from "./types";

/**
 * 단건 상담 리포트 히스토리.
 * - 한 사용자의 상담 기록을 배열 하나에 모아 KV에 저장한다 (최신순).
 * - 새 리포트 생성 시 `appendConsult`가 맨 앞에 prepend.
 * - 폭주 방지로 최근 MAX_HISTORY건만 유지한다.
 */
const MAX_HISTORY = 50;

function summarize(c: SavedConsult): ConsultSummary {
  return {
    id: c.id,
    question: c.question,
    basis: c.basis,
    basisLabel: c.basisLabel,
    generatedAt: c.generatedAt,
  };
}

/** 전체 풀데이터 — 서버 사이드 전용. */
async function readAll(userId: string): Promise<SavedConsult[]> {
  return readJson<SavedConsult[]>(userConsultsKey(userId), []);
}

/** 히스토리 요약 리스트 (본문 제외) — 사이드바용. */
export async function listConsults(userId: string): Promise<ConsultSummary[]> {
  const all = await readAll(userId);
  return all.map(summarize);
}

/** 단건 리포트 — 상세 페이지용. */
export async function getConsult(
  userId: string,
  id: string,
): Promise<SavedConsult | null> {
  const all = await readAll(userId);
  return all.find((c) => c.id === id) ?? null;
}

/** 새 리포트를 맨 앞에 추가. MAX_HISTORY 초과분은 잘라낸다. */
export async function appendConsult(
  userId: string,
  record: SavedConsult,
): Promise<void> {
  const all = await readAll(userId);
  const next = [record, ...all].slice(0, MAX_HISTORY);
  await writeJson(userConsultsKey(userId), next);
}
