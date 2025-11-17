import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 사이드에서 사용할 Supabase 클라이언트
 * 브라우저에서만 사용 가능
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

