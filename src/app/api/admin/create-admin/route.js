import { createAdminClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * 개발용 Admin 계정 생성 API
 * ⚠️ 프로덕션 환경에서는 사용하지 마세요!
 * POST /api/admin/create-admin
 * 
 * Body: {
 *   email: string,
 *   password: string,
 *   name?: string
 * }
 */
export async function POST(request) {
  // 프로덕션 환경 체크
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "이 API는 프로덕션 환경에서 사용할 수 없습니다." },
      { status: 403 }
    );
  }

  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 서비스 롤 키로 Admin 클라이언트 생성 (auth.admin API 사용 가능)
    const adminAuthClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 확인 생략
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // users 테이블에 ADMIN 계정 생성
    const adminClient = createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        password_hash: "", // Supabase Auth 사용
        role: "ADMIN",
        status: "APPROVED", // 바로 승인
        name: name || null,
      })
      .select()
      .single();

    if (userError) {
      // users 테이블 삽입 실패 시 auth 사용자도 삭제
      await adminAuthClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Admin 계정이 생성되었습니다.",
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        status: userData.status,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Admin 계정 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

