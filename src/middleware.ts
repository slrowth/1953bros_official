import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경 변수가 없으면 그냥 통과
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Supabase 클라이언트 생성 (쿠키 읽기/쓰기용)
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 세션 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 모바일 경로(/m) 접근 시 처리
  if (pathname.startsWith("/m")) {
    // 모바일 로그인 페이지는 무한 루프 방지를 위해 제외
    if (pathname === "/m/login" || pathname.startsWith("/m/login/")) {
      return response;
    }

    // 세션이 없으면 로그인 페이지로 리다이렉트
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/m/login";
      // 원래 가려던 경로를 쿼리 파라미터로 저장 (로그인 후 돌아가기 위해)
      if (pathname !== "/m") {
        url.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// 미들웨어가 작동할 경로 설정
export const config = {
  matcher: [
    // 모바일 경로만 명시적으로 지정
    // /m 또는 /m/로 시작하는 모든 경로 (정규식 패턴)
    "^/m(/.*)?$",
  ],
};
