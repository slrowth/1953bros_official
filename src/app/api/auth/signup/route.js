import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * 회원가입 API 라우트
 * POST /api/auth/signup
 */
export async function POST(request) {
  try {
    const { email, password, role = "STAFF", name, position, phone, storeName, storeId } = await request.json();

    // 입력값 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증 (최소 6자)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 최소 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Supabase Auth를 사용한 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      // 이미 존재하는 이메일인 경우
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        return NextResponse.json(
          { error: "이미 등록된 이메일입니다." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: error.message || "회원가입 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    // auth.users에 사용자가 생성되었으면 public.users 테이블에도 데이터 삽입
    // RLS를 우회하기 위해 서비스 롤 키를 사용
    if (data.user) {
      const adminClient = createAdminClient();
      
      // storeId가 있으면 stores 테이블에서 해당 매장의 정보를 가져와서 store_id와 franchise_id에 저장
      let storeIdToSave = null;
      let franchiseId = null;
      
      if (storeId) {
        // storeId로 직접 저장
        storeIdToSave = storeId;
        
        // stores 테이블에서 franchise_id 가져오기
        const { data: storeData } = await adminClient
          .from("stores")
          .select("franchise_id")
          .eq("id", storeId)
          .single();
        
        if (storeData) {
          franchiseId = storeData.franchise_id;
        }
      } else if (storeName) {
        // storeName으로 stores 테이블에서 찾기 (하위 호환성)
        const { data: storeData } = await adminClient
          .from("stores")
          .select("id, franchise_id")
          .eq("name", storeName)
          .eq("is_active", true)
          .single();
        
        if (storeData) {
          storeIdToSave = storeData.id;
          franchiseId = storeData.franchise_id;
        }
      }
      
      const { error: insertError } = await adminClient
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email,
          password_hash: "", // Supabase Auth를 사용하므로 password_hash는 사용하지 않음
          role: role,
          status: "PENDING",
          name: name || null,
          position: position || null,
          phone: phone || null,
          store_name: storeName || null,
          store_id: storeIdToSave,
          franchise_id: franchiseId,
        });

      if (insertError) {
        // 이미 users 테이블에 데이터가 있는 경우는 무시 (중복 에러)
        if (!insertError.message.includes("duplicate") && insertError.code !== "23505") {
          console.error("Failed to insert user into users table:", insertError);
          // auth.users는 생성되었지만 users 테이블에 삽입 실패
          // 사용자에게는 성공 메시지를 보내지만 로그는 남김
        }
      }
    }

    // 회원가입 성공
    return NextResponse.json(
      {
        message: "회원가입이 완료되었습니다. 이메일을 확인해주세요.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

