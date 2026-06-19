import { headers } from "next/headers";

function protoFor(host: string, forwarded: string | null): string {
  if (forwarded) return forwarded;
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
}

/**
 * 요청 호스트 기준 절대 base URL (예: 링크 복사용).
 * 라우트 핸들러에서 Request를 그대로 넘겨 쓴다.
 */
export function requestBaseUrl(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${protoFor(host, h.get("x-forwarded-proto"))}://${host}`;
}

/**
 * 소셜/카카오 canonical base URL.
 * NEXT_PUBLIC_SITE_URL이 있으면 그걸(크롤러는 등록 도메인 필요), 없으면 요청 호스트.
 */
export function canonicalBaseUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return env || requestBaseUrl(req);
}

/**
 * 서버 컴포넌트·generateMetadata용 base URL (Request가 없을 때).
 * NEXT_PUBLIC_SITE_URL 우선, 없으면 next/headers의 host로 구성.
 */
export async function siteBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${protoFor(host, h.get("x-forwarded-proto"))}://${host}`;
}
