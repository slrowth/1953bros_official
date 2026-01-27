/**
 * 레이아웃에서 사용할 Supabase 세션 업데이트
 * Next.js 15 proxy 마이그레이션: middleware 대신 레이아웃에서 세션 관리
 */

import { createClient } from "./server";

/**
 * 레이아웃에서 Supabase 세션을 업데이트합니다
 * 쿠키를 통해 세션을 새로고침합니다
 */
export async function updateSessionInLayout() {
  try {
    // 환경 변수 확인
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // 환경 변수가 없으면 세션 업데이트를 건너뜀
      return;
    }
    
    const supabase = await createClient();
    // 세션 새로고침 (쿠키가 자동으로 업데이트됨)
    await supabase.auth.getUser();
  } catch (error) {
    // 세션 업데이트 실패는 무시 (인증되지 않은 사용자일 수 있음)
    // 환경 변수 오류는 이미 createClient에서 처리됨
    console.error("Session update error:", error);
  }
}
