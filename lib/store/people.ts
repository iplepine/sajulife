import { randomUUID } from "node:crypto";
import { getProfile } from "./guest";
import { deleteJson, readJson, writeJson } from "./kv";
import {
  userActionsKey,
  userConsultBasisKey,
  userConsultsKey,
  userKey,
  userPeopleKey,
  userReportJobKey,
  userReportKey,
  userShareKey,
  userTciKey,
} from "./keys";
import { SELF_PERSON_ID, scopeIdFor } from "./scope";
import type { Gender, PeopleStore, Person, ReportKind } from "./types";

/**
 * 인물(Person) 레지스트리 — 한 계정 아래 전환 가능한 사주 워크스페이스 목록.
 *
 * - 저장 위치: user:{userId}:people (항상 real userId 키, 스코프 대상 아님).
 * - self는 언제나 존재하며(레거시 단일 사용자 = self), 저장본이 없으면 self 1명 기본값을 돌려준다.
 *   → 이 기능을 안 쓰던 기존 사용자는 아무 변화 없이 self 하나로 그대로 동작한다.
 */

const REPORT_KINDS: ReportKind[] = ["personal", "tci", "family", "fusion"];

function nowIso(): string {
  return new Date().toISOString();
}

function selfEntry(): Person {
  return { id: SELF_PERSON_ID, label: "", createdAt: nowIso() };
}

/** 저장본을 신뢰 가능한 형태로 보정: self 보장 + activeId 유효성. */
function normalize(store: PeopleStore): PeopleStore {
  const people = Array.isArray(store.people) ? store.people.filter((p) => p && p.id) : [];
  if (!people.some((p) => p.id === SELF_PERSON_ID)) people.unshift(selfEntry());
  const activeId = people.some((p) => p.id === store.activeId) ? store.activeId : SELF_PERSON_ID;
  return { people, activeId };
}

/** 계정의 인물 목록 + 활성 인물. 저장본이 없으면 self 1명 기본값. */
export async function getPeople(userId: string): Promise<PeopleStore> {
  const stored = await readJson<PeopleStore | null>(userPeopleKey(userId), null);
  if (!stored || !Array.isArray(stored.people) || stored.people.length === 0) {
    return { people: [selfEntry()], activeId: SELF_PERSON_ID };
  }
  return normalize(stored);
}

async function writePeople(userId: string, store: PeopleStore): Promise<PeopleStore> {
  const next = normalize(store);
  await writeJson(userPeopleKey(userId), next);
  return next;
}

/**
 * 인물 목록에 표시 메타(이름·생일·성별)를 각 인물의 실제 프로필에서 채워 돌려준다.
 * self는 프로필 저장 전 label이 비어 "나"로만 보였는데, 프로필이 있으면 실제 이름을 보인다.
 * label은 사용자가 지정한 별명을 존중해 비어 있을 때만 프로필 이름으로 채운다.
 * 바뀐 게 있으면 저장본도 self-heal 한다(홈 전환 칩 등 다른 화면에도 반영되게).
 */
export async function getPeopleWithMeta(userId: string): Promise<PeopleStore> {
  const store = await getPeople(userId);
  const enriched = await Promise.all(
    store.people.map(async (p) => {
      const profile = await getProfile(scopeIdFor(userId, p.id));
      if (!profile) return p;
      return {
        ...p,
        label: p.label.trim() ? p.label : profile.name.trim(),
        birthDate: profile.birthDate || p.birthDate,
        gender: profile.gender ?? p.gender,
      };
    }),
  );
  const changed = enriched.some((p, i) => {
    const prev = store.people[i];
    return p.label !== prev.label || p.birthDate !== prev.birthDate || p.gender !== prev.gender;
  });
  if (!changed) return { ...store, people: enriched };
  return writePeople(userId, { ...store, people: enriched }).catch(() => ({ ...store, people: enriched }));
}

/** 활성 인물을 반영한 데이터 스코프를 돌려준다(라우트 진입점에서 사용). */
export async function getActiveScopeId(
  userId: string,
): Promise<{ people: PeopleStore; personId: string; scopeId: string }> {
  const people = await getPeople(userId);
  return { people, personId: people.activeId, scopeId: scopeIdFor(userId, people.activeId) };
}

/** 새 인물을 추가하고 곧바로 활성으로 만든다. 프로필은 이후 온보딩에서 채운다. */
export async function addPerson(userId: string, label = ""): Promise<{ store: PeopleStore; person: Person }> {
  const current = await getPeople(userId);
  const person: Person = { id: `p_${randomUUID().slice(0, 8)}`, label: label.trim(), createdAt: nowIso() };
  const store = await writePeople(userId, {
    people: [...current.people, person],
    activeId: person.id,
  });
  return { store, person };
}

/** 활성 인물 전환. 존재하지 않는 id면 무시(현재 상태 유지). */
export async function setActivePerson(userId: string, personId: string): Promise<PeopleStore> {
  const current = await getPeople(userId);
  if (!current.people.some((p) => p.id === personId)) return current;
  return writePeople(userId, { ...current, activeId: personId });
}

/** 인물 표시 메타 동기화(프로필 저장 시 호출) — 없는 인물이면 아무것도 안 함. */
export async function syncPersonMeta(
  userId: string,
  personId: string,
  meta: { label: string; birthDate?: string; gender?: Gender },
): Promise<void> {
  const current = await getPeople(userId);
  const idx = current.people.findIndex((p) => p.id === personId);
  if (idx < 0) return;
  const people = [...current.people];
  people[idx] = {
    ...people[idx],
    label: meta.label.trim(),
    birthDate: meta.birthDate,
    gender: meta.gender,
  };
  await writePeople(userId, { ...current, people });
}

/** 인물 이름만 수정. */
export async function renamePerson(userId: string, personId: string, label: string): Promise<PeopleStore> {
  const current = await getPeople(userId);
  const idx = current.people.findIndex((p) => p.id === personId);
  if (idx < 0) return current;
  const people = [...current.people];
  people[idx] = { ...people[idx], label: label.trim() };
  return writePeople(userId, { ...current, people });
}

/**
 * 인물 삭제(self는 삭제 불가). 삭제된 인물이 활성이었으면 self로 전환한다.
 * 해당 인물의 저장 데이터(프로필·기질·리포트·상담·액션·공유 포인터)도 best-effort로 정리한다.
 */
export async function deletePerson(userId: string, personId: string): Promise<PeopleStore> {
  if (personId === SELF_PERSON_ID) return getPeople(userId);
  const current = await getPeople(userId);
  if (!current.people.some((p) => p.id === personId)) return current;

  const people = current.people.filter((p) => p.id !== personId);
  const activeId = current.activeId === personId ? SELF_PERSON_ID : current.activeId;
  const next = await writePeople(userId, { people, activeId });

  await deletePersonData(scopeIdFor(userId, personId));
  return next;
}

/** 한 인물 스코프의 알려진 데이터 키를 모두 삭제(best-effort). */
async function deletePersonData(scopeId: string): Promise<void> {
  const keys = [
    userKey(scopeId, "profile"),
    userKey(scopeId, "tci"), // 레거시 약식 응답 키
    userKey(scopeId, "family"),
    userTciKey(scopeId, "short"),
    userTciKey(scopeId, "full"),
    userConsultsKey(scopeId),
    userActionsKey(scopeId),
    userConsultBasisKey(scopeId),
    ...REPORT_KINDS.flatMap((k) => [
      userReportKey(scopeId, k),
      userReportJobKey(scopeId, k),
      userShareKey(scopeId, k),
    ]),
  ];
  await Promise.all(keys.map((k) => deleteJson(k).catch(() => {})));
}
