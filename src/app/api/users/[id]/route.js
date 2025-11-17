import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { NextResponse } from "next/server";

/**
 * 사용자 상태 업데이트 API
 * PUT /api/users/[id]
 * ADMIN만 접근 가능
 */
export async function PUT(request, { params }) {
  try {
    const user = await requireRole(["ADMIN"]);

    if (!user) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { status, memo } = body;

    // 유효한 상태 값 확인
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태 값입니다." },
        { status: 400 }
      );
    }

    // 사용자 존재 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상태 및 메모 업데이트
    const updateData = {};
    if (status) {
      updateData.status = status;
    }
    if (memo !== undefined) {
      updateData.memo = memo || null;
    }

    // 업데이트할 데이터가 없으면 에러 반환
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "업데이트할 데이터가 없습니다." },
        { status: 400 }
      );
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("User update error:", updateError);
      // 더 구체적인 에러 메시지 제공
      const errorMessage = updateError.message || "사용자 정보 업데이트 중 오류가 발생했습니다.";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        status: updatedUser.status,
        memo: updatedUser.memo,
      },
    });
  } catch (error) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { error: error.message || "사용자 정보 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

