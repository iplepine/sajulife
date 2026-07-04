import { SELF_PERSON_ID } from "@/lib/store/scope";
import type { PeopleStore, Person } from "@/lib/store/types";

/**
 * 인물(Person) 전환 기능의 클라이언트 헬퍼.
 * /api/people 를 감싸 스위처·계정 관리 UI가 공유한다. (순수 fetch — 서버 모듈 import 없음)
 */

export type { Person, PeopleStore };

/** 표시 이름 — 프로필 미입력이면 self는 "나", 그 외는 "이름 미입력". */
export function personLabel(p: Person): string {
  const l = p.label?.trim();
  if (l) return l;
  return p.id === SELF_PERSON_ID ? "나" : "이름 미입력";
}

/** 부제(생일·성별) — 동명이인 구분용. 없으면 "". */
export function personSubtitle(p: Person): string {
  const bits: string[] = [];
  if (p.birthDate) bits.push(p.birthDate);
  if (p.gender) bits.push(p.gender === "male" ? "남" : "여");
  return bits.join(" · ");
}

export function isSelf(p: Person): boolean {
  return p.id === SELF_PERSON_ID;
}

async function readJsonOrThrow(res: Response, fallbackMsg: string): Promise<PeopleStore> {
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? fallbackMsg);
  }
  return res.json();
}

export async function fetchPeople(): Promise<PeopleStore> {
  return readJsonOrThrow(await fetch("/api/people"), "인물 목록을 불러오지 못했어요.");
}

export async function switchPerson(activeId: string): Promise<PeopleStore> {
  return readJsonOrThrow(
    await fetch("/api/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeId }),
    }),
    "전환에 실패했어요.",
  );
}

/** 새 인물 생성 → 서버에서 곧바로 활성으로 잡힌다. */
export async function createPerson(): Promise<PeopleStore & { added: Person }> {
  const res = await fetch("/api/people", { method: "POST" });
  if (!res.ok) {
    const d = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(d.error ?? "추가에 실패했어요.");
  }
  return res.json();
}

export async function renamePerson(id: string, label: string): Promise<PeopleStore> {
  return readJsonOrThrow(
    await fetch("/api/people", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, label }),
    }),
    "이름 변경에 실패했어요.",
  );
}

export async function deletePerson(id: string): Promise<PeopleStore> {
  return readJsonOrThrow(
    await fetch(`/api/people?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    "삭제에 실패했어요.",
  );
}
