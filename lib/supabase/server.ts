import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client. RSC, Route Handlers, Server Actions에서 사용.
 * Next.js의 cookies() jar와 연결해 세션을 자동 동기화한다.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // RSC 등 set 불가능한 컨텍스트에서는 무시. middleware가 갱신을 담당한다.
          }
        },
      },
    }
  );
}
