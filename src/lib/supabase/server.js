import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * 서버 사이드에서 사용할 Supabase 클라이언트
 * Server Components, Server Actions, Route Handlers에서 사용
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
          } catch (error) {
            // Server Component에서 쿠키를 설정할 수 없는 경우
            // 이는 일반적으로 리다이렉트 중에 발생합니다
          }
        },
      },
    }
  );
}

/**
 * 서비스 롤 키를 사용한 관리자 클라이언트
 * RLS를 우회하여 관리 작업에 사용
 * 주의: 서버 사이드에서만 사용하고 클라이언트에 노출하지 마세요
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

