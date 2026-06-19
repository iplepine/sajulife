import { randomUUID } from "node:crypto";
import type { SajuResult } from "@/lib/saju/calculator";
import type { FamilyCircleMember } from "@/lib/saju/familyCircle";
import type { TciScore } from "@/lib/tci/scoring";
import { readJson, writeJson } from "./kv";
import { shareKey, userShareKey } from "./keys";
import type { ReportKind } from "./types";

/**
 * 공개 공유 스냅샷 — 비로그인 페이지가 인증 fetch·재계산 없이 그대로 렌더할 수 있도록
 * 시각화·본문에 필요한 모든 데이터를 생성 시점에 박제한 자기완결 객체.
 * (ShareSnapshot 타입은 store + saju + tci + components 타입을 모두 참조하므로
 *  중앙 types.ts가 아니라 공유 스토어 모듈에 둔다 — 순환 import 회피.)
 */
type ShareBase = {
  token: string;
  kind: ReportKind;
  ownerName: string;
  report: string;
  generatedAt: string;
  createdAt: string;
  currentYear: number;
};

export type ShareSnapshot =
  | (ShareBase & { kind: "personal"; saju: SajuResult; birthYear: number })
  | (ShareBase & { kind: "tci"; scores: TciScore[]; flexibility?: number })
  | (ShareBase & {
      kind: "fusion";
      scores: TciScore[];
      flexibility?: number;
      saju: SajuResult;
      birthYear: number;
    })
  | (ShareBase & { kind: "family"; circleMembers: FamilyCircleMember[] });

// 유니온 위에서 Omit이 공통 키만 남기지 않도록 분배(distributive) Omit.
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type ShareSnapshotInput = DistributiveOmit<ShareSnapshot, "token" | "createdAt">;

/** 공유 스냅샷 조회. 없으면 null. */
export async function getShare(token: string): Promise<ShareSnapshot | null> {
  return readJson<ShareSnapshot | null>(shareKey(token), null);
}

/** (user, kind)에 이미 발급된 공유 토큰. 없으면 null. */
export async function getShareTokenFor(
  userId: string,
  kind: ReportKind,
): Promise<string | null> {
  return readJson<string | null>(userShareKey(userId, kind), null);
}

/**
 * 공유 스냅샷을 만들거나 갱신한다.
 * 같은 (user, kind)는 한 토큰을 재사용 — 재공유 시 같은 링크가 최신 스냅샷으로 갱신되고
 * 끊어진 옛 링크(orphan)가 쌓이지 않는다. 토큰 포맷은 레포 관례(c_/m_)를 따른다.
 */
export async function createOrUpdateShare(
  userId: string,
  input: ShareSnapshotInput,
): Promise<ShareSnapshot> {
  const existing = await getShareTokenFor(userId, input.kind);
  const token = existing ?? `s_${randomUUID().slice(0, 8)}`;
  const snapshot = {
    ...input,
    token,
    createdAt: new Date().toISOString(),
  } as ShareSnapshot;
  await writeJson(shareKey(token), snapshot);
  if (!existing) await writeJson(userShareKey(userId, input.kind), token);
  return snapshot;
}
