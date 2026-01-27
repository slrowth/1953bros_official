import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Supabase 세션 업데이트
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // 정적 파일과 API 라우트는 미들웨어를 건너뜀
  // 모바일 로그인 페이지는 인증 체크 제외
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.svg") ||
    pathname.startsWith("/m/login") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return response;
  }

  // 인증이 필요한 라우트 체크
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/products") || pathname.startsWith("/training") || pathname.startsWith("/notices") || pathname.startsWith("/quality");
  const isAdminRoute = pathname.startsWith("/admin");
  const isMobileRoute = pathname.startsWith("/m");

  if (isDashboardRoute || isAdminRoute || isMobileRoute) {
    // Supabase 클라이언트를 생성하여 사용자 정보 확인
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!user || error) {
      // 모바일 라우트는 모바일 로그인 페이지로
      if (isMobileRoute) {
        const redirectUrl = new URL("/m/login", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 사용자 정보 조회 (role, status 확인)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      // 사용자 정보를 찾을 수 없으면 로그인 페이지로 리다이렉트
      if (isMobileRoute) {
        return NextResponse.redirect(new URL("/m/login", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // PENDING 상태인 사용자는 대기 페이지로 리다이렉트
    if (userData.status === "PENDING") {
      if (pathname !== "/pending") {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
      return response;
    }

    // REJECTED 상태인 사용자는 접근 불가
    if (userData.status === "REJECTED") {
      return NextResponse.redirect(new URL("/login?error=rejected", request.url));
    }

    // Dashboard 라우트: OWNER 또는 STAFF만 접근 가능
    if (isDashboardRoute) {
      if (userData.role !== "OWNER" && userData.role !== "STAFF") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
      }
    }

    // Mobile 라우트: OWNER 또는 STAFF만 접근 가능
    if (isMobileRoute) {
      if (userData.role !== "OWNER" && userData.role !== "STAFF") {
        return NextResponse.redirect(new URL("/m/login?error=unauthorized", request.url));
      }
    }

    // Admin 라우트: ADMIN만 접근 가능
    if (isAdminRoute) {
      if (userData.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
      }
    }
    
    // 권한 체크 통과 시 response 반환
    return response;
  }

  return response;
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

