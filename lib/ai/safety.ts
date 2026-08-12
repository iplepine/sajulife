import { createHash } from "node:crypto";

/** OpenAI에 사용자 원문 식별자를 보내지 않기 위한 안정 식별자. */
export function safetyIdentifierForUser(userId: string): string {
  return `sl_${createHash("sha256").update(userId).digest("hex").slice(0, 60)}`;
}
