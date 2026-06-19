import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 인증 없이 접근 가능한 경로.
 * - "/"  : 로그인(랜딩) 페이지
 * - 그 외 정적 자원은 middleware.ts matcher에서 이미 제외됨.
 */
const PUBLIC_PATHS = new Set<string>(["/"]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // API는 자체적으로 401을 반환하므로 리다이렉트하지 않는다 (프론트의 fetch 에러 처리 흐름 보존)
  if (pathname.startsWith("/api/")) return true;
  // 인증 콜백 등 향후 확장 여지
  if (pathname.startsWith("/auth/")) return true;
  // 공개 공유 링크 — 비로그인 열람 (/share/[token] + opengraph-image)
  if (pathname.startsWith("/share/")) return true;
  return false;
}

/**
 * Middleware에서 호출되어 세션 토큰을 refresh하고 응답 쿠키를 갱신한다.
 * Supabase SSR 공식 패턴이며, getUser()를 반드시 한 번 호출해서 토큰 검증을 트리거해야 한다.
 *
 * 또한 보호 경로(=public이 아닌 모든 경로)에 대해 미인증 사용자는 "/"로 리다이렉트한다.
 * 원래 가려던 경로는 `redirectedFrom` 쿼리 파라미터로 보존되어, 로그인 후 그 곳으로
 * 돌려보낼 수 있게 한다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 검증 + refresh 트리거 (반드시 호출)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  // 미인증 + 보호 경로 → "/"로 리다이렉트 (원래 경로는 redirectedFrom으로 보존)
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("redirectedFrom", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
