import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * 로그인 API 라우트 예시
 * POST /api/auth/login
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Supabase Auth를 사용한 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "사용자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // PENDING 상태인 사용자는 로그인 불가
    if (user.status === "PENDING") {
      return NextResponse.json(
        { error: "회원가입 승인 대기 중입니다. 관리자 승인 후 이용 가능합니다." },
        { status: 403 }
      );
    }

    // REJECTED 상태인 사용자는 로그인 불가
    if (user.status === "REJECTED") {
      return NextResponse.json(
        { error: "회원가입이 거부되었습니다. 관리자에게 문의하세요." },
        { status: 403 }
      );
    }

    // 마지막 로그인 시간 업데이트
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    // 쿠키가 제대로 설정되도록 응답 생성
    const cookieStore = await cookies();
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        franchiseId: user.franchise_id,
        storeId: user.store_id,
      },
    });

    // Supabase 세션 쿠키가 이미 설정되어 있으므로 그대로 반환
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

