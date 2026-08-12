/** 공급자 장애에서만 다른 공급자로 재시도한다. 잘못된 요청·정책 거절은 넘기지 않는다. */
export function isTransientAIError(error: unknown): boolean {
  if (error instanceof EmptyAIResponseError) return true;

  const status = readStatus(error);
  if (status === 408 || status === 409 || status === 429) return true;
  if (status !== null && status >= 500) return true;

  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|AbortError|fetch failed|network error|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|try again later/i.test(
    message,
  );
}

export class EmptyAIResponseError extends Error {
  constructor(provider: string) {
    super(`${provider} returned an empty response`);
    this.name = "EmptyAIResponseError";
  }
}

function readStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("status" in error)) return null;
  const status = Number(error.status);
  return Number.isInteger(status) ? status : null;
}
