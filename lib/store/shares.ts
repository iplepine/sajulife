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
export const DEFAULT_SHARE_EXPIRY_DAYS = 30;

export type ShareExpiry = "30d" | "never";
export type ShareLinkState = "none" | "active" | "expired" | "revoked";

type ShareBase = {
  token: string;
  kind: ReportKind;
  ownerName: string;
  report: string;
  generatedAt: string;
  createdAt: string;
  /** null이면 만료 없음. 레거시 스냅샷은 createdAt 기준 30일로 해석한다. */
  expiresAt?: string | null;
  /** 폐기된 스냅샷은 보존하되 공개 조회에서는 절대 반환하지 않는다. */
  revokedAt?: string;
  currentYear: number;
};

export type ShareSnapshot =
  | (ShareBase & {
      kind: "personal";
      saju: SajuResult;
      birthYear: number;
      gender?: string;
      occupation?: string;
      currentAge?: number;
    })
  | (ShareBase & { kind: "tci"; scores: TciScore[]; flexibility?: number })
  | (ShareBase & {
      kind: "fusion";
      scores: TciScore[];
      flexibility?: number;
      saju: SajuResult;
      birthYear: number;
      gender?: string;
      occupation?: string;
      currentAge?: number;
    })
  | (ShareBase & { kind: "family"; circleMembers: FamilyCircleMember[] })
  // 궁합도 '여러 사람의 사주를 한 장에' 구조라 가족과 같은 circleMembers를 쓴다(본인 + 상대 1명).
  | (ShareBase & { kind: "compat"; circleMembers: FamilyCircleMember[]; relation: string });

// 유니온 위에서 Omit이 공통 키만 남기지 않도록 분배(distributive) Omit.
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type ShareSnapshotInput = DistributiveOmit<
  ShareSnapshot,
  "token" | "createdAt" | "expiresAt" | "revokedAt"
>;

export type ShareLinkStatus =
  | { state: "none" }
  | {
      state: Exclude<ShareLinkState, "none">;
      token: string;
      createdAt: string;
      expiresAt: string | null;
      revokedAt?: string;
    };

type CreateShareOptions = {
  expiry: ShareExpiry;
  /** 현재 활성 링크를 폐기하고 새 토큰으로 다시 발급한다. */
  reissue?: boolean;
};

function defaultExpiryFrom(createdAt: string): string | null {
  const createdMs = Date.parse(createdAt);
  // 레거시 레코드의 발급 시각이 손상됐으면 "무기한"으로 해석하지 않는다.
  if (Number.isNaN(createdMs)) return new Date(0).toISOString();
  return new Date(createdMs + DEFAULT_SHARE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** 누락된 expiresAt은 출시 전 발급된 링크의 안전한 30일 기본값으로 해석한다. */
export function shareExpiresAt(snapshot: Pick<ShareBase, "createdAt" | "expiresAt">): string | null {
  return snapshot.expiresAt === undefined ? defaultExpiryFrom(snapshot.createdAt) : snapshot.expiresAt;
}

function hasExpired(snapshot: Pick<ShareBase, "createdAt" | "expiresAt">, now = Date.now()): boolean {
  const expiresAt = shareExpiresAt(snapshot);
  if (!expiresAt) return false;
  const expiresMs = Date.parse(expiresAt);
  // 손상된 만료 시각은 공개하지 않는다.
  return Number.isNaN(expiresMs) || expiresMs <= now;
}

function isPubliclyAvailable(snapshot: ShareSnapshot): boolean {
  return !snapshot.revokedAt && !hasExpired(snapshot);
}

function expiryFor(option: ShareExpiry, now: Date): string | null {
  if (option === "never") return null;
  return new Date(now.getTime() + DEFAULT_SHARE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function statusFor(snapshot: ShareSnapshot): ShareLinkStatus {
  const expiresAt = shareExpiresAt(snapshot);
  if (snapshot.revokedAt) {
    return { state: "revoked", token: snapshot.token, createdAt: snapshot.createdAt, expiresAt, revokedAt: snapshot.revokedAt };
  }
  if (hasExpired(snapshot)) {
    return { state: "expired", token: snapshot.token, createdAt: snapshot.createdAt, expiresAt };
  }
  return { state: "active", token: snapshot.token, createdAt: snapshot.createdAt, expiresAt };
}

/** 내부 관리·재발급에 쓰는 원본 조회. 공개 렌더에서는 getShare만 사용한다. */
async function getShareRecord(token: string): Promise<ShareSnapshot | null> {
  return readJson<ShareSnapshot | null>(shareKey(token), null);
}

/** 공개 공유 스냅샷 조회. 폐기·만료·손상된 링크는 존재하지 않는 것처럼 취급한다. */
export async function getShare(token: string): Promise<ShareSnapshot | null> {
  const snapshot = await getShareRecord(token);
  return snapshot && isPubliclyAvailable(snapshot) ? snapshot : null;
}

/** (user, kind)에 이미 발급된 공유 토큰. 없으면 null. */
export async function getShareTokenFor(
  userId: string,
  kind: ReportKind,
): Promise<string | null> {
  return readJson<string | null>(userShareKey(userId, kind), null);
}

/** 인증된 소유자용: 해당 리포트의 최신 공유 링크 상태를 돌려준다. */
export async function getShareStatusFor(userId: string, kind: ReportKind): Promise<ShareLinkStatus> {
  const token = await getShareTokenFor(userId, kind);
  if (!token) return { state: "none" };
  const snapshot = await getShareRecord(token);
  if (!snapshot || snapshot.kind !== kind) return { state: "none" };
  return statusFor(snapshot);
}

/**
 * 공유 스냅샷을 만들거나 갱신한다.
 * 활성 링크는 같은 토큰으로 최신 리포트 스냅샷을 갱신한다. 폐기·만료 링크는 절대 되살리지
 * 않고 새 토큰을 발급하며, reissue는 기존 활성 링크도 먼저 폐기한다.
 */
export async function createOrUpdateShare(
  userId: string,
  input: ShareSnapshotInput,
  { expiry, reissue = false }: CreateShareOptions,
): Promise<ShareSnapshot> {
  const existingToken = await getShareTokenFor(userId, input.kind);
  const existing = existingToken ? await getShareRecord(existingToken) : null;
  const canUpdateExisting = Boolean(existing && existing.kind === input.kind && isPubliclyAvailable(existing) && !reissue);

  if (existing && existing.kind === input.kind && isPubliclyAvailable(existing) && reissue) {
    await writeJson(shareKey(existing.token), { ...existing, revokedAt: new Date().toISOString() });
  }

  const now = new Date();
  const token = canUpdateExisting && existing ? existing.token : `s_${randomUUID()}`;
  const snapshot = {
    ...input,
    token,
    // 같은 링크 갱신에서는 처음 발급 시각을 유지한다. 재발급은 새 발급 시각으로 시작한다.
    createdAt: canUpdateExisting && existing ? existing.createdAt : now.toISOString(),
    expiresAt: expiryFor(expiry, now),
  } as ShareSnapshot;
  await writeJson(shareKey(token), snapshot);
  if (!canUpdateExisting) await writeJson(userShareKey(userId, input.kind), token);
  return snapshot;
}

/** 최신 공유 링크를 폐기한다. 이미 폐기·만료된 링크도 공개 복구를 막기 위해 폐기 시각을 남긴다. */
export async function revokeShare(userId: string, kind: ReportKind): Promise<ShareLinkStatus> {
  const token = await getShareTokenFor(userId, kind);
  if (!token) return { state: "none" };
  const snapshot = await getShareRecord(token);
  if (!snapshot || snapshot.kind !== kind) return { state: "none" };
  if (!snapshot.revokedAt) {
    const revoked = { ...snapshot, revokedAt: new Date().toISOString() } as ShareSnapshot;
    await writeJson(shareKey(token), revoked);
    return statusFor(revoked);
  }
  return statusFor(snapshot);
}
