/**
 * Middleware - 세션 업데이트만 수행
 * Next.js 15 마이그레이션: 인증 및 권한 체크는 레이아웃에서 수행
 * 
 * 이 middleware는 Supabase 세션을 업데이트하는 역할만 수행합니다.
 * 실제 인증 및 권한 체크는 각 레이아웃에서 수행됩니다.
 */

import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Supabase 세션 업데이트
  const response = await updateSession(request);
  
  // 레이아웃에서 사용할 수 있도록 pathname을 헤더에 추가
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로와 일치:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - public 폴더의 파일들
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

