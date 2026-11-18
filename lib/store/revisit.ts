import { paymentAvailability } from "@/lib/package/paymentMode";
import { SAJU_TCI_PACKAGE } from "@/lib/package/product";
import { claimOnce, deleteJson, readJson, writeJson } from "./kv";
import { userRevisitKey } from "./keys";
import type { RevisitPart, RevisitPass } from "./types";

/**
 * 종합 사주 다시 보기권 — 2026-11-18 대표 결정.
 *
 * '다시 보기'를 시작하는 순간 1장을 쓴다(베타 동안 무료, 실결제는 첫 이용권과 같은 4,900원).
 * 1장에는 사주 다시 분석 1회 · 기질 검사 1회 · 통합 리포트 1회가 들어 있다.
 * 통합 리포트를 만들면 이 다시 보기는 끝난다 — 다음 다시 보기는 새 1장이 필요하다.
 *
 * 횟수는 ★서버가 센다★(claimOnce). 화면 버튼만 숨기면 직접 호출로 무제한 재생성이 된다.
 * 생성이 실패하면 그 회차를 돌려준다(releaseRevisitPart) — 돈 내고 실패만 남지 않게.
 */

const claimKey = (pass: RevisitPass, part: RevisitPart) => `revisit:${pass.id}:${part}`;

/** 진행 중인(통합 리포트를 아직 안 만든) 다시 보기권. 없으면 null. */
export async function getActiveRevisitPass(scopeId: string): Promise<RevisitPass | null> {
  const pass = await readJson<RevisitPass | null>(userRevisitKey(scopeId), null);
  return pass && !pass.fusionAt ? pass : null;
}

export type StartRevisitResult =
  | { ok: true; pass: RevisitPass; reused: boolean }
  | { ok: false; code: "REVISIT_PAYMENT_PENDING"; error: string };

/**
 * 다시 보기를 시작한다. 이미 진행 중인 권이 있으면 새로 쓰지 않고 그것을 돌려준다(재방문·새로고침 멱등).
 * 베타 무료일 때만 바로 연다 — 실결제 모드의 결제 연동은 아직 없다(대표 결정: 베타 동안 무료).
 */
export async function startRevisitPass(userId: string, scopeId: string): Promise<StartRevisitResult> {
  const active = await getActiveRevisitPass(scopeId);
  if (active) return { ok: true, pass: active, reused: true };
  if (paymentAvailability() !== "free") {
    return { ok: false, code: "REVISIT_PAYMENT_PENDING", error: "다시 보기 결제는 준비 중이에요. 잠시 후 다시 시도해 주세요." };
  }
  const pass: RevisitPass = {
    id: crypto.randomUUID(),
    userId,
    scopeId,
    productId: SAJU_TCI_PACKAGE.id,
    // 베타 무료는 받은 돈이 0원 — 정산 때 실결제와 섞이지 않게 금액을 0으로 남긴다.
    amount: 0,
    listPrice: SAJU_TCI_PACKAGE.price,
    mode: "free",
    startedAt: new Date().toISOString(),
  };
  await writeJson(userRevisitKey(scopeId), pass);
  return { ok: true, pass, reused: false };
}

const FIELD: Record<RevisitPart, "sajuAt" | "tciAt" | "fusionAt"> = { saju: "sajuAt", tci: "tciAt", fusion: "fusionAt" };

/**
 * 진행 중인 권에서 한 회차를 쓴다. 이미 썼으면 false.
 * claimOnce로 동시 요청(중복 클릭·재시도)에도 한 번만 성공한다.
 */
export async function consumeRevisitPart(scopeId: string, part: RevisitPart): Promise<{ ok: true; pass: RevisitPass } | { ok: false; reason: "none" | "used" }> {
  const pass = await getActiveRevisitPass(scopeId);
  if (!pass) return { ok: false, reason: "none" };
  if (pass[FIELD[part]]) return { ok: false, reason: "used" };
  if (!(await claimOnce(claimKey(pass, part)))) return { ok: false, reason: "used" };
  const next: RevisitPass = { ...pass, [FIELD[part]]: new Date().toISOString() };
  await writeJson(userRevisitKey(scopeId), next);
  return { ok: true, pass: next };
}

/** 생성이 시작되지 못했거나 실패했을 때 그 회차를 돌려준다. */
export async function releaseRevisitPart(scopeId: string, passId: string, part: RevisitPart): Promise<void> {
  const pass = await readJson<RevisitPass | null>(userRevisitKey(scopeId), null);
  if (!pass || pass.id !== passId) return;
  await deleteJson(claimKey(pass, part));
  const next: RevisitPass = { ...pass };
  delete next[FIELD[part]];
  await writeJson(userRevisitKey(scopeId), next);
}

/** 화면에 보낼 공개 상태 — 금액·사용자 식별자는 빼고 무엇을 썼는지만. */
export function revisitPublicState(pass: RevisitPass | null) {
  if (!pass) return null;
  return { id: pass.id, startedAt: pass.startedAt, saju: Boolean(pass.sajuAt), tci: Boolean(pass.tciAt), fusion: Boolean(pass.fusionAt) };
}
