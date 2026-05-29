/**
 * 로그인/인증 후 돌아갈 경로를 안전하게 정규화한다.
 * 외부 URL이나 protocol-relative URL(`//evil.com`)로 인한 오픈 리다이렉트를 막기 위해
 * 내부 절대경로("/..")만 허용한다.
 */
export function sanitizeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null; // protocol-relative URL 방어
  return raw;
}
